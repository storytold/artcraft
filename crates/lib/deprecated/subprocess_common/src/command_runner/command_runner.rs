use std::env;
use std::ffi::OsString;
use std::fs::File;
use std::path::PathBuf;
use std::time::Duration;

use log::info;
use subprocess::{Popen, PopenConfig, Redirection};

use errors::AnyhowResult;
use filesys::path_to_string::path_to_string;

use crate::command_exit_status::CommandExitStatus;
use crate::command_runner::command_args::CommandArgs;
use crate::command_runner::command_runner_args::{FileOrCreate, RunAsSubprocessArgs, StreamRedirection};
use crate::command_runner::env_var_policy::EnvVarPolicy;
use crate::docker_options::DockerOptions;
use crate::executable_or_command::ExecutableOrShellCommand;

#[derive(Clone)]
pub struct CommandRunner {
  /// The script, executable, or command to run.
  pub executable_or_command: ExecutableOrShellCommand,

  /// The directory to change to before running the command.
  /// The parent process won't change directory here - only the subprocess will.
  pub maybe_execution_directory: Option<PathBuf>,

  /// How to treat the env vars when spinning up the subprocess.
  pub env_var_policy: EnvVarPolicy,

  /// If the command needs to run with a Python virtual env, this can be run.
  /// eg. `source python/bin/activate`
  pub maybe_virtual_env_activation_command: Option<String>,

  /// If this is run under Docker (eg. in development), these are the options.
  /// Typically, this is not done in production.
  pub maybe_docker_options: Option<DockerOptions>,

  /// If the execution should be ended after a certain point.
  pub maybe_execution_timeout: Option<Duration>,
}

impl CommandRunner {

  /// Run the command with the `subprocess` crate utilities
  pub fn run_with_subprocess(&self, args: RunAsSubprocessArgs<'_>) -> CommandExitStatus {
    self.do_run_with_subprocess(args)
        .unwrap_or_else(|err| {
          CommandExitStatus::FailureWithReason { reason: format!("error: {:?}", err) }
        })
  }

  fn do_run_with_subprocess(&self, args: RunAsSubprocessArgs<'_>) -> AnyhowResult<CommandExitStatus> {
    let command = self.build_command_string(&args.args);

    info!("Command: {:?}", command);

    let shell = match self.executable_or_command {
      ExecutableOrShellCommand::BashShellCommand(_) | ExecutableOrShellCommand::Executable(_) => "bash",
      ExecutableOrShellCommand::ShShellCommand(_) => "sh",
    };

    let command_parts = [
      shell,
      "-c",
      &command
    ];

    let mut env_vars = Vec::new();

    // Copy all environment variables from the parent process.
    // This is necessary to send all the kubernetes settings for Nvidia / CUDA.
    for (env_key, env_value) in env::vars() {
      // TODO(bt,2024-01-27): Env var sanitization
      //if IGNORED_ENVIRONMENT_VARS.contains(&env_key) {
      //  continue;
      //}
      env_vars.push((
        OsString::from(env_key),
        OsString::from(env_value),
      ));
    }

    let mut config = PopenConfig::default();

    if !env_vars.is_empty() {
      config.env = Some(env_vars);
    }

    match args.stderr {
      StreamRedirection::None => {} // Inherit defaults.
      StreamRedirection::Pipe => {
        config.stderr = Redirection::Pipe;
      }
      StreamRedirection::File(FileOrCreate::NewFileWithName(stderr_output_file)) => {
        info!("stderr will be written to file: {:?}", stderr_output_file);

        let stderr_file = File::create(stderr_output_file)?;
        config.stderr = Redirection::File(stderr_file);
      }
    }

    match args.stdout {
      StreamRedirection::None => {} // Inherit defaults.
      StreamRedirection::Pipe => {
        config.stdout = Redirection::Pipe;
      }
      StreamRedirection::File(FileOrCreate::NewFileWithName(stdout_output_file)) => {
        info!("stdout will be written to file: {:?}", stdout_output_file);

        let stdout_file = File::create(stdout_output_file)?;
        config.stdout = Redirection::File(stdout_file);
      }
    }

    let mut popen_handle = Popen::create(&command_parts, config)?;

    info!("Subprocess PID: {:?}", popen_handle.pid());

    let maybe_exit_status = match self.maybe_execution_timeout {
      None => {
        let exit_status = popen_handle.wait()?;
        info!("Subprocess exit status: {:?}", exit_status);
        return Ok(CommandExitStatus::from_exit_status(exit_status));
      }
      Some(timeout) => {
        info!("Executing with timeout: {:?}", &timeout);
        popen_handle.wait_timeout(timeout)?
      }
    };

    match maybe_exit_status {
      None => {
        // NB: If the program didn't successfully terminate, kill it.
        info!("Subprocess didn't end after timeout; terminating...");
        let _r = popen_handle.terminate()?;
        Ok(CommandExitStatus::Timeout)
      }
      Some(exit_status) => {
        info!("Subprocess timed wait exit status: {:?}", exit_status);
        Ok(CommandExitStatus::from_exit_status(exit_status))
      }
    }
  }

  fn build_command_string(&self, command_args: &Box<&dyn CommandArgs>) -> String {
    let mut command = String::new();

    if let Some(execution_directory) = self.maybe_execution_directory.as_deref() {
      command.push_str("cd ");
      command.push_str(&path_to_string(execution_directory));
      command.push_str(" && ");
    }

    if let Some(venv_command) = self.maybe_virtual_env_activation_command.as_deref() {
      command.push_str(venv_command);
      command.push_str(" && ");
    }

    match self.executable_or_command {
      ExecutableOrShellCommand::Executable(ref executable) => {
        command.push_str(&path_to_string(executable));
        command.push_str(" ");
      }
      ExecutableOrShellCommand::ShShellCommand(ref cmd) => {
        command.push_str(cmd);
        command.push_str(" ");
      }
      ExecutableOrShellCommand::BashShellCommand(ref cmd) => {
        command.push_str(cmd);
        command.push_str(" ");
      }
    }

    let command_arguments = command_args.to_command_string();
    command.push_str(&command_arguments);

    if let Some(docker_options) = self.maybe_docker_options.as_ref() {
      command = docker_options.to_command_string(&command);
    }

    command
  }
}

#[cfg(test)]
mod tests {
  use std::path::PathBuf;

  use crate::command_runner::command_args::CommandArgs;
  use crate::command_runner::command_runner::CommandRunner;
  use crate::command_runner::env_var_policy::EnvVarPolicy;
  use crate::docker_options::{DockerGpu, DockerOptions};
  use crate::executable_or_command::ExecutableOrShellCommand;

  struct BlenderArgs;

  impl CommandArgs for BlenderArgs {
    fn to_command_string(&self) -> String {
      "-a --foo --bar=baz --bin=\"blah blah\"".to_string()
    }
  }

  #[test]
  fn simple_executable() {
    let runner = CommandRunner {
      executable_or_command: ExecutableOrShellCommand::Executable(PathBuf::from("blender")),
      maybe_execution_directory: None,
      env_var_policy: EnvVarPolicy::CopyNone,
      maybe_virtual_env_activation_command: None,
      maybe_docker_options: None,
      maybe_execution_timeout: None,
    };

    let ptr : Box<&dyn CommandArgs> = Box::new(&BlenderArgs {});
    let result = runner.build_command_string(&ptr);

    assert_eq!(&result, r#"blender -a --foo --bar=baz --bin="blah blah""#);
  }

  #[test]
  fn simple_command() {
    let runner = CommandRunner {
      executable_or_command: ExecutableOrShellCommand::BashShellCommand("python3.6 inference.py".to_string()),
      maybe_execution_directory: None,
      env_var_policy: EnvVarPolicy::CopyNone,
      maybe_virtual_env_activation_command: None,
      maybe_docker_options: None,
      maybe_execution_timeout: None,
    };

    let ptr : Box<&dyn CommandArgs> = Box::new(&BlenderArgs {});
    let result = runner.build_command_string(&ptr);

    assert_eq!(&result, r#"python3.6 inference.py -a --foo --bar=baz --bin="blah blah""#);
  }

  #[test]
  fn executable_with_directory() {
    let runner = CommandRunner {
      executable_or_command: ExecutableOrShellCommand::Executable(PathBuf::from("blender")),
      maybe_execution_directory: Some(PathBuf::from("/usr/local/bin")),
      env_var_policy: EnvVarPolicy::CopyNone,
      maybe_virtual_env_activation_command: None,
      maybe_docker_options: None,
      maybe_execution_timeout: None,
    };

    let ptr : Box<&dyn CommandArgs> = Box::new(&BlenderArgs {});
    let result = runner.build_command_string(&ptr);

    assert_eq!(&result, r#"cd /usr/local/bin && blender -a --foo --bar=baz --bin="blah blah""#);
  }

  #[test]
  fn command_with_venv() {
    let runner = CommandRunner {
      executable_or_command: ExecutableOrShellCommand::BashShellCommand("python3.6 inference.py".to_string()),
      maybe_execution_directory: None,
      env_var_policy: EnvVarPolicy::CopyNone,
      maybe_virtual_env_activation_command: Some("source venv/bin/activate".to_string()),
      maybe_docker_options: None,
      maybe_execution_timeout: None,
    };

    let ptr : Box<&dyn CommandArgs> = Box::new(&BlenderArgs {});
    let result = runner.build_command_string(&ptr);

    assert_eq!(&result, r#"source venv/bin/activate && python3.6 inference.py -a --foo --bar=baz --bin="blah blah""#);
  }

  // TODO(bt, 2024-01-27): The quotes are broken. Fix this!!
  #[test]
  fn execute_with_docker() {
    let runner = CommandRunner {
      executable_or_command: ExecutableOrShellCommand::Executable(PathBuf::from("blender")),
      maybe_execution_directory: None,
      env_var_policy: EnvVarPolicy::CopyNone,
      maybe_virtual_env_activation_command: None,
      maybe_docker_options: Some(DockerOptions {
        image_name: "ABCDE".to_string(),
        maybe_bind_mount: None,
        maybe_environment_variables: None,
        maybe_gpu: Some(DockerGpu::All),
      }),
      maybe_execution_timeout: None,
    };

    let ptr : Box<&dyn CommandArgs> = Box::new(&BlenderArgs {});
    let result = runner.build_command_string(&ptr);

    // TODO(bt, 2024-01-27): The quotes are broken. Fix this!!
    assert_eq!(&result, r#"docker run --rm    --gpus all  ABCDE /bin/bash -c "blender -a --foo --bar=baz --bin="blah blah"""#);
  }
}
