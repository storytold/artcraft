use log::warn;

use errors::AnyhowResult;
use subprocess_common::command_exit_status::CommandExitStatus;
use subprocess_common::command_runner::command_runner::CommandRunner;
use subprocess_common::command_runner::command_runner_args::RunAsSubprocessArgs;
use subprocess_common::command_runner::env_var_policy::EnvVarPolicy;
use subprocess_common::executable_or_command::ExecutableOrShellCommand;

/// This is meant to run any generic ffprobe workload.
/// It should use better typing to enforce that only FFPROBE commands can be run.
#[derive(Clone)]
pub struct FfprobeCommandRunner {
  command_runner: CommandRunner,
}

impl FfprobeCommandRunner {
  pub fn from_env() -> AnyhowResult<Self> {
    let maybe_command = easyenv::get_env_string_optional(
      "FFPROBE_COMMAND");

    let maybe_executable = easyenv::get_env_pathbuf_optional(
      "FFPROBE_EXECUTABLE");

    let executable_or_command = match maybe_command {
      Some(command) => ExecutableOrShellCommand::BashShellCommand(command),
      None => match maybe_executable {
        Some(executable) => ExecutableOrShellCommand::Executable(executable),
        None => {
          warn!("Neither executable or command supplied, using bash command `ffprobe`.");
          ExecutableOrShellCommand::BashShellCommand("ffprobe".to_string())
        }
      },
    };

    Ok(Self {
      command_runner: CommandRunner {
        executable_or_command,
        maybe_execution_directory: None,
        env_var_policy: EnvVarPolicy::CopyNone,
        maybe_virtual_env_activation_command: None,
        maybe_docker_options: None,
        maybe_execution_timeout: None,
      },
    })
  }

  // TODO(bt,2024-04-17): Actual type bounds, eg. where F: FfmpegCommand + CommandArgs
  pub fn run_with_subprocess<'a>(&self, args: RunAsSubprocessArgs<'a>) -> CommandExitStatus {
    self.command_runner.run_with_subprocess(args)
  }
}
