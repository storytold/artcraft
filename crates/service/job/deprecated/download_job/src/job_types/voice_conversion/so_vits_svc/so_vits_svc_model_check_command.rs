use std::ffi::OsString;
use std::path::{Path, PathBuf};

use anyhow::anyhow;
use log::info;
use subprocess::{Popen, PopenConfig};

use errors::AnyhowResult;
use filesys::path_to_string::path_to_string;
use subprocess_common::docker_options::{DockerFilesystemMount, DockerGpu, DockerOptions};

/// This command is used to check tacotron for being a real model
#[derive(Clone)]
pub struct SoVitsSvcModelCheckCommand {
  /// Where the so-vits-svc code lives
  so_vits_svc_root_code_directory: PathBuf,

  // /// The name of the check/process script, eg. `export_ts.py`
  // check_script_name: PathBuf,

  executable_or_command: ExecutableOrCommand,

  /// eg. `source python/bin/activate`
  maybe_virtual_env_activation_command: Option<String>,

  /// Optional default config file to use
  maybe_default_config_path: Option<PathBuf>,

  /// Optional default test wav file to use
  maybe_default_test_wav_path: Option<PathBuf>,

  /// If this is run under Docker (eg. in development), these are the options.
  maybe_docker_options: Option<DockerOptions>,

  /// Supposedly where HF caches models it downloads (have not verified this!)
  maybe_huggingface_cache_dir: Option<PathBuf>,

  /// Supposedly where NLTK caches models it downloads (have not verified this!)
  maybe_nltk_cache_dir: Option<PathBuf>,
}

#[derive(Clone)]
pub enum ExecutableOrCommand {
  /// Eg. `check.py`
  Executable(PathBuf),

  /// Eg. `python3 -m so_vits_svc_fork.fakeyou_infer`
  Command(String),
}

pub enum Device {
  Cuda,
  Cpu,
}

pub struct CheckArgs<P: AsRef<Path>> {
  /// --model-path: model path
  pub model_path: P,

  /// (positional arg): input wav path
  /// This can fall back to a default value set at construction.
  pub maybe_input_path: Option<P>,

  /// --config-path: path of the hparams json file
  /// This can fall back to a default value set at construction.
  pub maybe_config_path: Option<P>,

  /// --output_path: output path of converting model to onnx (which we use to test validity)
  pub output_path: P,

  /// --device: cpu or cuda
  pub device: Device,
}

impl SoVitsSvcModelCheckCommand {
  pub fn new<P: AsRef<Path>>(
    so_vits_svc_root_code_directory: P,
    executable_or_command: ExecutableOrCommand,
    maybe_virtual_env_activation_command: Option<&str>,
    maybe_default_config_path: Option<P>,
    maybe_default_test_wav_path: Option<P>,
    maybe_docker_options: Option<DockerOptions>,
    maybe_huggingface_cache_dir: Option<P>,
    maybe_nltk_cache_dir: Option<P>,
  ) -> Self {
    Self {
      so_vits_svc_root_code_directory: so_vits_svc_root_code_directory.as_ref().to_path_buf(),
      executable_or_command,
      maybe_virtual_env_activation_command: maybe_virtual_env_activation_command.map(|s| s.to_string()),
      maybe_default_config_path: maybe_default_config_path.map(|p| p.as_ref().to_path_buf()),
      maybe_default_test_wav_path: maybe_default_test_wav_path.map(|p| p.as_ref().to_path_buf()),
      maybe_docker_options,
      maybe_huggingface_cache_dir: maybe_huggingface_cache_dir.map(|s| s.as_ref().to_path_buf()),
      maybe_nltk_cache_dir: maybe_nltk_cache_dir.map(|s| s.as_ref().to_path_buf()),
    }
  }

  pub fn from_env() -> AnyhowResult<Self> {
    let so_vits_svc_root_code_directory = easyenv::get_env_pathbuf_required(
      "SO_VITS_SVC_MODEL_CHECK_ROOT_DIRECTORY")?;

    // NB: The command is installed (typically as `svc`) rather than called as a python script.
    // Lately we've had to call it as `python3 -m so_vits_svc_fork.fakeyou_infer`
    let maybe_check_command = easyenv::get_env_string_optional(
      "SO_VITS_SVC_MODEL_CHECK_COMMAND");

    // Optional, eg. `./infer.py`. Typically we'll use the command form instead.
    let maybe_check_executable = easyenv::get_env_pathbuf_optional(
      "SO_VITS_SVC_MODEL_CHECK_EXECUTABLE");

    let executable_or_command = match maybe_check_command {
      Some(command) => ExecutableOrCommand::Command(command),
      None => match maybe_check_executable {
        Some(executable) => ExecutableOrCommand::Executable(executable),
        None => return Err(anyhow!("neither command nor executable passed")),
      },
    };

    let maybe_virtual_env_activation_command = easyenv::get_env_string_optional(
      "SO_VITS_SVC_MODEL_CHECK_MAYBE_VENV_COMMAND");

    let maybe_default_config_path = easyenv::get_env_pathbuf_optional(
      "SO_VITS_SVC_MODEL_CHECK_MAYBE_DEFAULT_CONFIG_PATH");

    let maybe_default_test_wav_path = easyenv::get_env_pathbuf_optional(
      "SO_VITS_SVC_MODEL_CHECK_MAYBE_DEFAULT_TEST_WAV_PATH");

    let maybe_huggingface_cache_dir =
        easyenv::get_env_pathbuf_optional("HF_DATASETS_CACHE");

    let maybe_nltk_cache_dir =
        easyenv::get_env_pathbuf_optional("NLTK_DATA");

    let maybe_docker_options = easyenv::get_env_string_optional(
      "SO_VITS_SVC_MODEL_CHECK_MAYBE_DOCKER_IMAGE")
        .map(|image_name| {
          DockerOptions {
            image_name,
            maybe_bind_mount: Some(DockerFilesystemMount::tmp_to_tmp()),
            maybe_environment_variables: None,
            maybe_gpu: Some(DockerGpu::All),
          }
        });

    Ok(Self {
      so_vits_svc_root_code_directory,
      executable_or_command,
      maybe_virtual_env_activation_command,
      maybe_docker_options,
      maybe_default_config_path,
      maybe_default_test_wav_path,
      maybe_huggingface_cache_dir,
      maybe_nltk_cache_dir,
    })
  }

  pub fn execute_check<P: AsRef<Path>>(
    &self,
    args: CheckArgs<P>,
  ) -> AnyhowResult<()> {

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

    let device = match args.device {
      Device::Cuda => "cuda",
      Device::Cpu => "cpu",
    };

    command.push_str(" --device ");
    command.push_str(&path_to_string(device));

    let input_path = match args.maybe_input_path {
      Some(path) => path.as_ref().to_path_buf(),
      None => match self.maybe_default_test_wav_path.as_deref() {
        Some(path) => path.to_path_buf(),
        None => return Err(anyhow!("no test wav path supplied")),
      }
    };

    // NB: Input wav path is not a named arg
    command.push_str(" ");
    command.push_str(&path_to_string(input_path));
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

    let mut maybe_cache_dirs = Vec::new();

    if let Some(cache_dir) = self.maybe_huggingface_cache_dir.as_deref() {
      maybe_cache_dirs.push((
        OsString::from("HF_DATASETS_CACHE"),
        OsString::from(cache_dir),
      ));
      maybe_cache_dirs.push((
        OsString::from("HF_HOME"),
        OsString::from(cache_dir),
      ));
    }

    if let Some(cache_dir) = self.maybe_nltk_cache_dir.as_deref() {
      maybe_cache_dirs.push((
        OsString::from("NLTK_DATA"),
        OsString::from(cache_dir),
      ));
      maybe_cache_dirs.push((
        OsString::from("NLTK_DATA_PATH"),
        OsString::from(cache_dir),
      ));
    }

    let mut config = PopenConfig::default();

    if !maybe_cache_dirs.is_empty() {
      config.env = Some(maybe_cache_dirs);
    }

    let mut p = Popen::create(&command_parts, config)?;

    info!("Subprocess PID: {:?}", p.pid());

    let exit_status = p.wait()?;

    info!("Subprocess exit status: {:?}", exit_status);

    Ok(())
  }
}
