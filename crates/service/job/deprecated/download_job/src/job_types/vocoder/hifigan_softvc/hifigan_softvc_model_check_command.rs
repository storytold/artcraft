use std::path::Path;

use log::info;
use subprocess::{Popen, PopenConfig};

use errors::AnyhowResult;
use subprocess_common::docker_options::DockerOptions;

/// This command is used to check hifigan (softvc) for being a real model
#[derive(Clone)]
pub struct HifiGanSoftVcModelCheckCommand {
  /// Where the HifiGan (softvc version) code lives
  hifigan_softvc_root_code_directory: String,
  
  /// eg. `source python/bin/activate`
  maybe_virtual_env_activation_command: Option<String>,
  
  hifigan_softvc_model_check_script_name: String,

  /// If this is run under Docker (eg. in development), these are the options.
  maybe_docker_options: Option<DockerOptions>,
}

impl HifiGanSoftVcModelCheckCommand {
  pub fn new(
    hifigan_softvc_root_code_directory: &str,
    maybe_virtual_env_activation_command: Option<&str>,
    hifigan_softvc_model_check_script_name: &str,
    maybe_docker_options: Option<DockerOptions>,
  ) -> Self {
    Self {
      hifigan_softvc_root_code_directory: hifigan_softvc_root_code_directory.to_string(),
      maybe_virtual_env_activation_command: maybe_virtual_env_activation_command.map(|s| s.to_string()),
      hifigan_softvc_model_check_script_name: hifigan_softvc_model_check_script_name.to_string(),
      maybe_docker_options,
    }
  }

  pub fn execute<P: AsRef<Path>>(
    &self,
    checkpoint_path: P,
    output_metadata_filename: P,
  ) -> AnyhowResult<()> {

    let mut command = String::new();
    command.push_str(&format!("cd {}", self.hifigan_softvc_root_code_directory));

    if let Some(venv_command) = self.maybe_virtual_env_activation_command.as_deref() {
      command.push_str(" && ");
      command.push_str(venv_command);
      command.push_str(" ");
    }

    command.push_str(" && ");
    command.push_str("python ");
    command.push_str(&self.hifigan_softvc_model_check_script_name);
    command.push_str(" --checkpoint_path ");
    command.push_str(&checkpoint_path.as_ref().display().to_string());
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

    let mut p = Popen::create(&command_parts, PopenConfig {
      ..Default::default()
    })?;

    info!("Pid : {:?}", p.pid());

    let exit_status = p.wait()?;

    info!("Exit status: {:?}", exit_status);

    Ok(())
  }
}
