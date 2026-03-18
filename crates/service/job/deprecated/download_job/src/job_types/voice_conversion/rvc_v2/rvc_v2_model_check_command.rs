use std::path::{Path, PathBuf};

use anyhow::anyhow;
use log::info;
use subprocess::{Popen, PopenConfig};

use errors::AnyhowResult;
use filesys::path_to_string::path_to_string;
use subprocess_common::docker_options::{DockerFilesystemMount, DockerGpu, DockerOptions};

/// This command is used to check tacotron for being a real model
#[derive(Clone)]
pub struct RvcV2ModelCheckCommand {
  /// Where the python model code lives
  rvc_v2_root_code_directory: PathBuf,

  executable_or_command: ExecutableOrCommand,

  /// eg. `source python/bin/activate`
  maybe_virtual_env_activation_command: Option<String>,

  /// Optional default config file to use
  maybe_default_config_path: Option<PathBuf>,

  /// Optional default test wav file to use
  maybe_default_test_wav_path: Option<PathBuf>,

  /// If this is run under Docker (eg. in development), these are the options.
  maybe_docker_options: Option<DockerOptions>,
}

#[derive(Clone)]
pub enum ExecutableOrCommand {
  /// Eg. `check.py`
  Executable(PathBuf),

  /// Eg. `python3 check.py`
  Command(String),
}

pub struct CheckArgs<P: AsRef<Path>, Q: AsRef<Path>> {
  /// --model_path: model path
  pub model_path: P,

  /// --model_index_path: model index path
  pub maybe_model_index_path: Option<Q>,

  /// --hubert_model_path: path to the hubert model on the filesystem
  pub hubert_path: P,

  /// --input_audio_filename: input wav path
  /// If absent, we'll use a default test wav file
  pub maybe_input_path: Option<P>,

  /// --output_audio_filename: output path of wav file.
  pub output_path: P,
}

impl RvcV2ModelCheckCommand {
  pub fn new<P: AsRef<Path>>(
    rvc_v2_root_code_directory: P,
    executable_or_command: ExecutableOrCommand,
    maybe_virtual_env_activation_command: Option<&str>,
    maybe_default_config_path: Option<P>,
    maybe_default_test_wav_path: Option<P>,
    maybe_docker_options: Option<DockerOptions>,
  ) -> Self {
    Self {
      rvc_v2_root_code_directory: rvc_v2_root_code_directory.as_ref().to_path_buf(),
      executable_or_command,
      maybe_virtual_env_activation_command: maybe_virtual_env_activation_command.map(|s| s.to_string()),
      maybe_default_config_path: maybe_default_config_path.map(|p| p.as_ref().to_path_buf()),
      maybe_default_test_wav_path: maybe_default_test_wav_path.map(|p| p.as_ref().to_path_buf()),
      maybe_docker_options,
    }
  }

  pub fn from_env() -> AnyhowResult<Self> {
    let rvc_v2_root_code_directory = easyenv::get_env_pathbuf_required(
      "RVC_V2_MODEL_CHECK_ROOT_DIRECTORY")?;

    let maybe_check_command = easyenv::get_env_string_optional(
      "RVC_V2_MODEL_CHECK_COMMAND");

    // Optional, eg. `./infer.py`. Typically we'll use the command form instead.
    let maybe_check_executable = easyenv::get_env_pathbuf_optional(
      "RVC_V2_MODEL_CHECK_EXECUTABLE");

    let executable_or_command = match maybe_check_command {
      Some(command) => ExecutableOrCommand::Command(command),
      None => match maybe_check_executable {
        Some(executable) => ExecutableOrCommand::Executable(executable),
        None => return Err(anyhow!("neither command nor executable passed")),
      },
    };

    let maybe_virtual_env_activation_command = easyenv::get_env_string_optional(
      "RVC_V2_MODEL_CHECK_MAYBE_VENV_COMMAND");

    let maybe_default_config_path = easyenv::get_env_pathbuf_optional(
      "RVC_V2_MODEL_CHECK_MAYBE_DEFAULT_CONFIG_PATH");

    let maybe_default_test_wav_path = easyenv::get_env_pathbuf_optional(
      "RVC_V2_MODEL_CHECK_MAYBE_DEFAULT_TEST_WAV_PATH");

    let maybe_docker_options = easyenv::get_env_string_optional(
      "RVC_V2_MODEL_CHECK_MAYBE_DOCKER_IMAGE")
        .map(|image_name| {
          DockerOptions {
            image_name,
            maybe_bind_mount: Some(DockerFilesystemMount::tmp_to_tmp()),
            maybe_environment_variables: None,
            maybe_gpu: Some(DockerGpu::All),
          }
        });

    Ok(Self {
      rvc_v2_root_code_directory,
      executable_or_command,
      maybe_virtual_env_activation_command,
      maybe_docker_options,
      maybe_default_config_path,
      maybe_default_test_wav_path,
    })
  }

  pub fn execute_check<P: AsRef<Path>, Q: AsRef<Path>>(
    &self,
    args: CheckArgs<P, Q>,
  ) -> AnyhowResult<()> {

    let mut command = String::new();
    command.push_str(&format!("cd {}", path_to_string(&self.rvc_v2_root_code_directory)));

    if let Some(venv_command) = self.maybe_virtual_env_activation_command.as_deref() {
      command.push_str(" && ");
      command.push_str(venv_command);
      command.push_str(" ");
    }

    command.push_str(" && ");

    match self.executable_or_command {
      ExecutableOrCommand::Executable(ref executable) => {
        command.push_str(&path_to_string(executable));
      }
      ExecutableOrCommand::Command(ref cmd) => {
        command.push_str(cmd);
        command.push_str(" ");
      }
    }

    // ===== Begin Python Args =====

    command.push_str(" --model_path ");
    command.push_str(&path_to_string(args.model_path));

    if let Some(model_index_path) = args.maybe_model_index_path {
      command.push_str(" --model_index_path ");
      command.push_str(&path_to_string(model_index_path));
    }

    command.push_str(" --hubert_model_path ");
    command.push_str(&path_to_string(args.hubert_path));

    command.push_str(" --output_audio_filename ");
    command.push_str(&path_to_string(args.output_path));

    let input_path = match args.maybe_input_path {
      Some(path) => path.as_ref().to_path_buf(),
      None => match self.maybe_default_test_wav_path.as_deref() {
        Some(path) => path.to_path_buf(),
        None => return Err(anyhow!("no test wav path supplied")),
      }
    };

    command.push_str(" --input_audio_filename ");
    command.push_str(&path_to_string(input_path));

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

    let config = PopenConfig::default();

    let mut p = Popen::create(&command_parts, config)?;

    info!("Subprocess PID: {:?}", p.pid());

    let exit_status = p.wait()?;

    info!("Subprocess exit status: {:?}", exit_status);

    Ok(())
  }
}
