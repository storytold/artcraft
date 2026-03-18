use std::fs::File;
use std::path::{Path, PathBuf};
use std::time::Duration;

use anyhow::anyhow;
use log::info;
use subprocess::{Popen, PopenConfig, Redirection};

use filesys::path_to_string::path_to_string;
use subprocess_common::command_exit_status::CommandExitStatus;
use subprocess_common::docker_options::{DockerFilesystemMount, DockerGpu, DockerOptions};

use crate::util::get_filtered_env_vars::get_filtered_env_vars;

#[derive(Clone)]
pub struct F5TTSInferenceCommand {
  /// Where the code lives
  pub(crate) f5_tts_code_directory: PathBuf,

  /// A single executable script or a much larger bash command.
  executable_or_command: ExecutableOrCommand,

  /// eg. `source python/bin/activate`
  maybe_virtual_env_activation_command: Option<String>,

  /// If this is run under Docker (eg. in development), these are the options.
  maybe_docker_options: Option<DockerOptions>,

  /// If the execution should be ended after a certain point.
  maybe_execution_timeout: Option<Duration>,

}
#[derive(Clone)]
pub enum ExecutableOrCommand {
  /// Eg. `inference.py`
  Executable(PathBuf),

  /// Eg. `python3 inference.py`
  Command(String),
}

#[derive(Debug)]
pub struct InferenceArgs<'s> {
  pub stderr_output_file: &'s Path,
  pub stdout_output_file: &'s Path,

  pub input_text_file: &'s Path,
  pub reference_audio_path: &'s Path,

  pub reference_transcript_path: Option<&'s Path>,

  pub output_audio_directory: &'s Path,
  // pub output_file_path: &'s Path,
}

impl F5TTSInferenceCommand {
  pub fn new(
    f5_tts_code_directory: PathBuf,
    executable_or_command: ExecutableOrCommand,
    maybe_virtual_env_activation_command: Option<String>,
    maybe_docker_options: Option<DockerOptions>,
    maybe_execution_timeout: Option<Duration>,
  ) -> Self {
    Self {
      f5_tts_code_directory,
      executable_or_command,
      maybe_virtual_env_activation_command,
      maybe_docker_options,
      maybe_execution_timeout,
    }
  }

  pub fn from_env() -> anyhow::Result<Self> {
    let f5_tts_code_directory = easyenv::get_env_pathbuf_required("F5_TTS_CODE_DIRECTORY")?;

    let maybe_inference_command = easyenv::get_env_string_optional("F5_TTS_INFERENCE_COMMAND");

    let maybe_inference_executable = easyenv::get_env_pathbuf_optional("F5_TTS_INFERENCE_EXECUTABLE");

    let executable_or_command = match maybe_inference_command {
      Some(command) => ExecutableOrCommand::Command(command),
      None => match maybe_inference_executable {
        Some(executable) => ExecutableOrCommand::Executable(executable),
        None => return Err(anyhow!("neither command nor executable passed")),
      },
    };

    let maybe_virtual_env_activation_command = easyenv::get_env_string_optional("F5_TTS_VENV_ACTIVATION_COMMAND");
    let maybe_docker_options = easyenv::get_env_string_optional("F5_TTS_DOCKER_OPTIONS")
    .map(|image_name| {
      DockerOptions {
        image_name,
        maybe_bind_mount: Some(DockerFilesystemMount::tmp_to_tmp()),
        maybe_environment_variables: None,
        maybe_gpu: Some(DockerGpu::All),
      }
    });
    let maybe_execution_timeout = easyenv::get_env_duration_seconds_optional("F5_TTS_EXECUTION_TIMEOUT");

    Ok(Self {
      f5_tts_code_directory,
      executable_or_command,
      maybe_virtual_env_activation_command,
      maybe_docker_options,
      maybe_execution_timeout,
    })
  }

  pub fn execute_inference(
    &self,
    args: InferenceArgs,
  ) -> CommandExitStatus {
    match self.do_execute_inference(args) {
      Ok(exit_status) => exit_status,
      Err(error) => CommandExitStatus::FailureWithReason { reason: format!("error: {:?}", error) },
    }
  }

  pub fn do_execute_inference(
    &self,
    args: InferenceArgs,
  ) -> anyhow::Result<CommandExitStatus> {
    let mut command = String::new();


    command.push_str(&format!("cd {}", path_to_string(&self.f5_tts_code_directory)));

    if let Some(venv_command) = self.maybe_virtual_env_activation_command.as_deref() {
      command.push_str(" && ");
      command.push_str(venv_command);
      command.push_str(" ");
    }

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

    command.push_str(&format!(" --gen_file {}", path_to_string(args.input_text_file)));
    command.push_str(&format!(" --ref_audio {}", path_to_string(args.reference_audio_path)));


    //command.push_str(&format!(" --output_path {}", path_to_string(args.output_audio_directory)));
    command.push_str(&format!(" --output_dir {}", path_to_string(args.output_audio_directory)));

    if let Some(maybe_docker_options) = self.maybe_docker_options.as_ref() {
      command = maybe_docker_options.to_command_string(&command);
    }

    info!("Running command: {}", command);

    info!("Command: {:?}", command);

    let command_parts = [
      "bash",
      "-c",
      &command
    ];

    let env_vars = get_filtered_env_vars();

    let mut config = PopenConfig::default();

    info!("stderr will be written to file: {:?}", args.stderr_output_file.as_os_str());

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