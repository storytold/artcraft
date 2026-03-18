use std::fs::OpenOptions;
use std::path::Path;

use log::info;
use subprocess::{Popen, PopenConfig, Redirection};

use errors::AnyhowResult;
use subprocess_common::docker_options::DockerOptions;

/// This command is used to check tacotron for being a real model
#[derive(Clone)]
pub struct TacotronModelCheckCommand {
  /// Where the Tacotron code lives
  tacotron_root_code_directory: String,
  
  /// eg. `source python/bin/activate`
  maybe_virtual_env_activation_command: Option<String>,
  
  tacotron_model_check_script_name: String,

  /// If this is run under Docker (eg. in development), these are the options.
  maybe_docker_options: Option<DockerOptions>,
}

impl TacotronModelCheckCommand {
  pub fn new(
    tacotron_root_code_directory: &str,
    maybe_virtual_env_activation_command: Option<&str>,
    tacotron_model_check_script_name: &str,
    maybe_docker_options: Option<DockerOptions>,
  ) -> Self {
    Self {
      tacotron_root_code_directory: tacotron_root_code_directory.to_string(),
      maybe_virtual_env_activation_command: maybe_virtual_env_activation_command.map(|s| s.to_string()),
      tacotron_model_check_script_name: tacotron_model_check_script_name.to_string(),
      maybe_docker_options,
    }
  }

  pub fn execute<P: AsRef<Path>>(
    &self,
    synthesizer_checkpoint_path: P,
    output_metadata_filename: P,
    spawn_process: bool
  ) -> AnyhowResult<()> {
    let mut command = String::new();

    command.push_str("echo 'test'");
    command.push_str(" && ");
    command.push_str(&format!("cd {}", self.tacotron_root_code_directory));

    if let Some(venv_command) = self.maybe_virtual_env_activation_command.as_deref() {
      command.push_str(" && ");
      command.push_str(venv_command);
      command.push_str(" ");
    }

    command.push_str(" && ");
    command.push_str("python ");
    command.push_str(&self.tacotron_model_check_script_name);
    command.push_str(" --synthesizer_checkpoint_path ");
    command.push_str(&synthesizer_checkpoint_path.as_ref().display().to_string());
    command.push_str(" --output_metadata_filename ");
    command.push_str(&output_metadata_filename.as_ref().display().to_string());

    if let Some(docker_options) = self.maybe_docker_options.as_ref() {
      command = docker_options.to_command_string(&command);
    }

    info!("Command: {:?}", command);

    let command_parts = [
      "bash",
      "-c",
      &command
    ];

    if spawn_process {
      // NB: This forks and returns immediately.
      //let _child_pid = command_builder.spawn()?;

      let stdout_file = OpenOptions::new()
          .read(true)
          .write(true)
          .create(true)
          .truncate(true)
          .open("/tmp/tacotron_upload_stdout.txt")?;

      let stderr_file = OpenOptions::new()
          .read(true)
          .write(true)
          .create(true)
          .truncate(true)
          .open("/tmp/tacotron_upload_stderr.txt")?;

      let mut p = Popen::create(&command_parts, PopenConfig {
        //stdout: Redirection::Pipe,
        //stderr: Redirection::Pipe,
        stdout: Redirection::File(stdout_file),
        stderr: Redirection::File(stderr_file),
        ..Default::default()
      })?;

      info!("Pid : {:?}", p.pid());

      p.detach();

    } else {
      // NB: This is a blocking call.
      /*let output = command_builder.output()?;

      info!("Output status: {}", output.status);
      info!("Stdout: {:?}", String::from_utf8(output.stdout));
      error!("Stderr: {:?}", String::from_utf8(output.stderr));

      if !output.status.success() {
        bail!("Bad error code: {:?}", output.status);
      }*/

      let mut p = Popen::create(&command_parts, PopenConfig {
        //stdout: Redirection::Pipe,
        //stderr: Redirection::Pipe,
        ..Default::default()
      })?;

      info!("Pid : {:?}", p.pid());

      let exit_status = p.wait()?;

      info!("Exit status: {:?}", exit_status);
    }

    Ok(())
  }
}
