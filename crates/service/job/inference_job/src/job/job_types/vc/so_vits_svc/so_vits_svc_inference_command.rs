use std::ffi::OsString;
use std::fs::File;
use std::path::{Path, PathBuf};
use std::time::Duration;

use anyhow::anyhow;
use log::info;
use subprocess::{Popen, PopenConfig, Redirection};

use errors::AnyhowResult;
use filesys::path_to_string::path_to_string;
use subprocess_common::command_exit_status::CommandExitStatus;
use subprocess_common::docker_options::{DockerEnvVar, DockerFilesystemMount, DockerGpu, DockerOptions};

use crate::util::get_filtered_env_vars::get_filtered_env_vars;

/// This command is used to check tacotron for being a real model
#[derive(Clone)]
pub struct SoVitsSvcInferenceCommand {
  /// Where the so-vits-svc code lives
  so_vits_svc_root_code_directory: PathBuf,

  /// A single executable script or a much larger bash command.
  /// eg. `infer.py` vs `python3 -m so_vits_svc_fork.__main__`
  executable_or_command: ExecutableOrCommand,

  /// eg. `source python/bin/activate`
  maybe_virtual_env_activation_command: Option<String>,

  /// Optional default config file to use
  maybe_default_config_path: Option<PathBuf>,

  /// If this is run under Docker (eg. in development), these are the options.
  maybe_docker_options: Option<DockerOptions>,

  /// Where to cache hubert. We send this to the model via HUBERT_PATH env var.
  maybe_hubert_path: Option<PathBuf>,

  maybe_huggingface_cache_dir: Option<PathBuf>,
  maybe_nltk_cache_dir: Option<PathBuf>,

  /// If the execution should be ended after a certain point.
  maybe_execution_timeout: Option<Duration>,

  /// Enable optional "hacky fixes" in the code.
  enable_hacky_fix: Option<bool>,
}

#[derive(Clone)]
pub enum ExecutableOrCommand {
  /// Eg. `infer.py`
  Executable(PathBuf),

  /// Eg. `python3 -m so_vits_svc_fork.fakeyou_infer`
  Command(String),
}

pub enum Device {
  Cuda,
  Cpu,
}

pub struct InferenceArgs<P: AsRef<Path>> {
  /// --model-path: model path
  pub model_path: P,

  /// (positional arg): input wav path
  pub input_path: P,

  /// --config-path: path of the hparams json file
  /// This can fall back to a default value set at construction.
  pub maybe_config_path: Option<P>,

  /// --output_path: output path of converting model to onnx (which we use to test validity)
  pub output_path: P,

  pub stderr_output_file: P,

  /// --auto-predict-f0: turn on or off fundamental frequency auto prediction
  /// This sounds better when left off, but it defaults to *ON* if not specified.
  pub auto_predict_f0: bool,

  /// --transpose: pitch adjustment
  pub maybe_transpose: Option<i32>,

  /// --device: cpu or cuda
  pub device: Device,
}

impl SoVitsSvcInferenceCommand {
  pub fn new<P: AsRef<Path>>(
    so_vits_svc_root_code_directory: P,
    executable_or_command: ExecutableOrCommand,
    maybe_virtual_env_activation_command: Option<&str>,
    maybe_default_config_path: Option<P>,
    maybe_docker_options: Option<DockerOptions>,
    maybe_hubert_path: Option<P>,
    maybe_huggingface_cache_dir: Option<P>,
    maybe_nltk_cache_dir: Option<P>,
    maybe_execution_timeout: Option<Duration>,
    enable_hacky_fix: Option<bool>,
  ) -> Self {
    Self {
      so_vits_svc_root_code_directory: so_vits_svc_root_code_directory.as_ref().to_path_buf(),
      executable_or_command,
      maybe_virtual_env_activation_command: maybe_virtual_env_activation_command.map(|s| s.to_string()),
      maybe_default_config_path: maybe_default_config_path.map(|p| p.as_ref().to_path_buf()),
      maybe_docker_options,
      maybe_hubert_path: maybe_hubert_path.map(|s| s.as_ref().to_path_buf()),
      maybe_huggingface_cache_dir: maybe_huggingface_cache_dir.map(|s| s.as_ref().to_path_buf()),
      maybe_nltk_cache_dir: maybe_nltk_cache_dir.map(|s| s.as_ref().to_path_buf()),
      maybe_execution_timeout,
      enable_hacky_fix,
    }
  }

  pub fn from_env() -> AnyhowResult<Self> {
    let so_vits_svc_root_code_directory = easyenv::get_env_pathbuf_required(
      "SO_VITS_SVC_INFERENCE_ROOT_DIRECTORY")?;

    // NB: The command is installed (typically as `svc`) rather than called as a python script.
    // Lately we've had to call it as `python3 -m so_vits_svc_fork.fakeyou_infer`
    let maybe_inference_command = easyenv::get_env_string_optional(
      "SO_VITS_SVC_INFERENCE_COMMAND");

    // Optional, eg. `./infer.py`. Typically we'll use the command form instead.
    let maybe_inference_executable = easyenv::get_env_pathbuf_optional(
      "SO_VITS_SVC_INFERENCE_EXECUTABLE");

    let executable_or_command = match maybe_inference_command {
      Some(command) => ExecutableOrCommand::Command(command),
      None => match maybe_inference_executable {
        Some(executable) => ExecutableOrCommand::Executable(executable),
        None => return Err(anyhow!("neither command nor executable passed")),
      },
    };

    let maybe_virtual_env_activation_command = easyenv::get_env_string_optional(
      "SO_VITS_SVC_INFERENCE_MAYBE_VENV_COMMAND");

    let maybe_default_config_path = easyenv::get_env_pathbuf_optional(
      "SO_VITS_SVC_INFERENCE_MAYBE_DEFAULT_CONFIG_PATH");

    let maybe_hubert_path =
        easyenv::get_env_pathbuf_optional("HUBERT_PATH");

    let maybe_huggingface_cache_dir =
        easyenv::get_env_pathbuf_optional("HF_DATASETS_CACHE");

    let maybe_nltk_cache_dir =
        easyenv::get_env_pathbuf_optional("NLTK_DATA");

    let enable_hacky_fix =
        easyenv::get_env_bool_optional("SO_VITS_SVC_ENABLE_HACKY_FIX");

    let maybe_execution_timeout =
        easyenv::get_env_duration_seconds_optional("SO_VITS_SVC_TIMEOUT_SECONDS");

    let maybe_docker_options = easyenv::get_env_string_optional(
      "SO_VITS_SVC_INFERENCE_MAYBE_DOCKER_IMAGE")
        .map(|image_name| {
          let mut docker_env_vars = Vec::new();

          if let Some(cache_dir) = maybe_huggingface_cache_dir.as_deref() {
            let cache_dir = cache_dir.to_string_lossy().to_string();
            docker_env_vars.push(DockerEnvVar::new("HF_DATASETS_CACHE", &cache_dir));
            docker_env_vars.push(DockerEnvVar::new("HF_HOME", &cache_dir));
          }

          if let Some(cache_dir) = maybe_nltk_cache_dir.as_deref() {
            let cache_dir = cache_dir.to_string_lossy().to_string();
            docker_env_vars.push(DockerEnvVar::new("NLTK_DATA", &cache_dir));
            docker_env_vars.push(DockerEnvVar::new("NLTK_DATA_PATH", &cache_dir));
          }

          if let Some(hubert_path) = maybe_hubert_path.as_deref() {
            let hubert_path = hubert_path.to_string_lossy().to_string();
            docker_env_vars.push(DockerEnvVar::new("HUBERT_PATH", &hubert_path));
          }

          let maybe_environment_variables =
              if docker_env_vars.is_empty() { None } else { Some(docker_env_vars) };

          DockerOptions {
            image_name,
            maybe_bind_mount: Some(DockerFilesystemMount::tmp_to_tmp()),
            maybe_environment_variables,
            maybe_gpu: Some(DockerGpu::All),
          }
        });

    Ok(Self {
      so_vits_svc_root_code_directory,
      executable_or_command,
      maybe_virtual_env_activation_command,
      maybe_default_config_path,
      maybe_docker_options,
      maybe_hubert_path,
      maybe_huggingface_cache_dir,
      maybe_nltk_cache_dir,
      maybe_execution_timeout,
      enable_hacky_fix,
    })
  }

  pub fn execute_inference<P: AsRef<Path>>(
    &self,
    args: InferenceArgs<P>,
  ) -> CommandExitStatus {
    match self.do_execute_inference(args) {
      Ok(exit_status) => exit_status,
      Err(error) => CommandExitStatus::FailureWithReason { reason: format!("error: {:?}", error) },
    }
  }

  fn do_execute_inference<P: AsRef<Path>>(
    &self,
    args: InferenceArgs<P>,
  ) -> AnyhowResult<CommandExitStatus> {

    let mut command = String::new();
    command.push_str(&format!("cd {}", path_to_string(&self.so_vits_svc_root_code_directory)));

    if let Some(venv_command) = self.maybe_virtual_env_activation_command.as_deref() {
      command.push_str(" && ");
      command.push_str(venv_command);
      command.push_str(" ");
    }

    // NB: We can't use `onnx` for model integrity checking (that might take long anyway), so
    // we'll just run inference instead. That's flexible and works.
    command.push_str(" && ");

    match self.executable_or_command {
      ExecutableOrCommand::Executable(ref executable) => {
        command.push_str(&path_to_string(executable));
        command.push_str(" infer ");
      }
      ExecutableOrCommand::Command(ref cmd) => {
        command.push_str(cmd);
        command.push_str(" ");
      }
    }

    // ===== Begin Python Args =====

    command.push_str(" --model-path ");
    command.push_str(&path_to_string(args.model_path));
    command.push_str(" --output-path ");
    command.push_str(&path_to_string(args.output_path));

    let config_path = match args.maybe_config_path {
      Some(path) => path.as_ref().to_path_buf(),
      None => match self.maybe_default_config_path.as_deref() {
        Some(path) => path.to_path_buf(),
        None => return Err(anyhow!("no config path supplied")),
      }
    };

    command.push_str(" --config-path ");
    command.push_str(&path_to_string(config_path));

    command.push_str(" --auto-predict-f0 ");
    command.push_str(if args.auto_predict_f0 { "true" } else { "false" });
    command.push_str(" ");

    if let Some(transpose) = args.maybe_transpose {
      let value = transpose.to_string();
      command.push_str(" --transpose ");
      command.push_str(&value);
      command.push_str(" ");
    }

    let device = match args.device {
      Device::Cuda => "cuda",
      Device::Cpu => "cpu",
    };

    command.push_str(" --device ");
    command.push_str(&path_to_string(device));

    if let Some(enable_hacky_fix) = self.enable_hacky_fix {
      command.push_str(" --hacky-fix ");
      command.push_str(if enable_hacky_fix { "true" } else { "false" } );
      command.push_str(" ");
    }

    // NB: Input wav path is not a named arg
    command.push_str(" ");
    command.push_str(&path_to_string(args.input_path));
    command.push_str(" ");

    // ===== End Python Args =====

    if let Some(docker_options) = self.maybe_docker_options.as_ref() {
      command = docker_options.to_command_string(&command);
    }

    info!("Command: {:?}", command);

    let command_parts = [
      "bash",
      "-c",
      &command
    ];

    let mut env_vars = get_filtered_env_vars();

    // In production / k8s, we should get this env var from the deployment and handle it
    // more generally when copying over all environment variables, but in local development
    // we're explicit since it may not be set outside of config files.
    if let Some(hubert_path) = self.maybe_hubert_path.as_deref() {
      env_vars.push((
        OsString::from("HUBERT_PATH"),
        OsString::from(hubert_path),
      ));
    }

    let mut config = PopenConfig::default();

    info!("stderr will be written to file: {:?}", args.stderr_output_file.as_ref());

    let stderr_file = File::create(&args.stderr_output_file)?;
    config.stderr = Redirection::File(stderr_file);

    if !env_vars.is_empty() {
      config.env = Some(env_vars);
    }

    let mut p = Popen::create(&command_parts, config)?;

    info!("Subprocess PID: {:?}", p.pid());

    match self.maybe_execution_timeout {
      None => {
        let exit_status = p.wait()?;
        info!("Subprocess exit status: {:?}", exit_status);
        Ok(CommandExitStatus::from_exit_status(exit_status))
      }
      Some(timeout) => {
        info!("Executing with timeout: {:?}", &timeout);
        let exit_status = p.wait_timeout(timeout)?;

        match exit_status {
          None => {
            // NB: If the program didn't successfully terminate, kill it.
            info!("Subprocess didn't end after timeout: {:?}; terminating...", &timeout);
            let _r = p.terminate()?;
            Ok(CommandExitStatus::Timeout)
          }
          Some(exit_status) => {
            info!("Subprocess timed wait exit status: {:?}", exit_status);
            Ok(CommandExitStatus::from_exit_status(exit_status))
          }
        }
      }
    }
  }
}
