use std::path::{Path, PathBuf};

use log::info;
use subprocess::{Popen, PopenConfig};

use errors::AnyhowResult;
use filesys::path_to_string::path_to_string;
use subprocess_common::docker_options::DockerOptions;

/// This command is used to check tacotron for being a real model
#[derive(Clone)]
pub struct VitsModelCheckCommand {
  /// Where the VITS code lives
  vits_root_code_directory: PathBuf,

  /// The name of the check/process script, eg. `export_ts.py`
  check_script_name: PathBuf,

  /// eg. `source python/bin/activate`
  maybe_virtual_env_activation_command: Option<String>,

  /// eg. `python3`
  maybe_override_python_interpreter: Option<String>,

  /// If this is run under Docker (eg. in development), these are the options.
  maybe_docker_options: Option<DockerOptions>,
}

pub enum Device {
  Cuda,
  Cpu,
}

pub struct CheckArgs<'a, P: AsRef<Path>> {
  /// --out-path: output path of the traced model
  pub traced_model_output_path: P,

  /// --checkpoint: input path of the model checkpoint
  pub model_checkpoint_path: P,

  /// --config: path of the hparams json file
  pub config_path: P,

  /// --device: cpu or cuda
  pub device: Device,

  /// --test-string: string to infer when tracing (I think)
  pub test_string: &'a str,
}

impl VitsModelCheckCommand {
  pub fn new<P: AsRef<Path>>(
    vits_root_code_directory: P,
    check_script_name: P,
    maybe_override_python_interpreter: Option<&str>,
    maybe_virtual_env_activation_command: Option<&str>,
    maybe_docker_options: Option<DockerOptions>,
  ) -> Self {
    Self {
      vits_root_code_directory: vits_root_code_directory.as_ref().to_path_buf(),
      check_script_name: check_script_name.as_ref().to_path_buf(),
      maybe_virtual_env_activation_command: maybe_virtual_env_activation_command.map(|s| s.to_string()),
      maybe_override_python_interpreter: maybe_override_python_interpreter.map(|s| s.to_string()),
      maybe_docker_options,
    }
  }

  pub fn execute_check<P: AsRef<Path>>(
    &self,
    args: CheckArgs<'_, P>,
  ) -> AnyhowResult<()> {

    let mut command = String::new();
    command.push_str(&format!("cd {}", path_to_string(&self.vits_root_code_directory)));

    if let Some(venv_command) = self.maybe_virtual_env_activation_command.as_deref() {
      command.push_str(" && ");
      command.push_str(venv_command);
      command.push_str(" ");
    }

    let python_binary = self.maybe_override_python_interpreter
        .as_deref()
        .unwrap_or("python");

    command.push_str(" && ");
    command.push_str(python_binary);
    command.push_str(" ");
    command.push_str(&path_to_string(&self.check_script_name));

    // ===== Begin Python Args =====

    command.push_str(" --out-path ");
    command.push_str(&path_to_string(args.traced_model_output_path));

    command.push_str(" --checkpoint ");
    command.push_str(&path_to_string(args.model_checkpoint_path));

    command.push_str(" --config ");
    command.push_str(&path_to_string(args.config_path));

    let device = match args.device {
      Device::Cuda => "cuda",
      Device::Cpu => "cpu",
    };

    command.push_str(" --device ");
    command.push_str(&path_to_string(device));

    command.push_str(" --test-string ");
    command.push_str("'");
    command.push_str(&path_to_string(args.test_string));
    command.push_str("'");

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

    let mut p = Popen::create(&command_parts, PopenConfig {
      ..Default::default()
    })?;

    info!("Subprocess PID: {:?}", p.pid());

    let exit_status = p.wait()?;

    info!("Subprocess exit status: {:?}", exit_status);

    Ok(())
  }
}
