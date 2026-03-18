use std::path::PathBuf;

use errors::AnyhowResult;
use subprocess_common::command_runner::command_runner::CommandRunner;
use subprocess_common::command_runner::env_var_policy::EnvVarPolicy;
use subprocess_common::docker_options::{DockerFilesystemMount, DockerOptions};
use subprocess_common::executable_or_command::ExecutableOrShellCommand;

pub struct FbxToGltfDependencies {
  pub command_runner: CommandRunner,
}

impl FbxToGltfDependencies {
  pub fn setup() -> AnyhowResult<Self> {
    let maybe_execution_directory = easyenv::get_env_pathbuf_optional("FBX2GLTF_DIRECTORY");

    let executable_or_command = easyenv::get_env_string_required("FBX2GLTF_EXECUTABLE_OR_COMMAND")?;

    let executable_or_command = if executable_or_command.contains(" ") {
      ExecutableOrShellCommand::BashShellCommand(executable_or_command)
    } else {
      ExecutableOrShellCommand::Executable(PathBuf::from(executable_or_command))
    };

    let maybe_execution_timeout = easyenv::get_env_duration_seconds_optional("FBX2GLTF_TIMEOUT_SECONDS");

    let maybe_docker_options = easyenv::get_env_string_optional("FBX2GLTF_DOCKER_IMAGE")
        .map(|image_name| DockerOptions {
            image_name,
            maybe_bind_mount: Some(DockerFilesystemMount::tmp_to_tmp()),
            maybe_environment_variables: None,
            maybe_gpu: None,
        });

    Ok(Self {
      command_runner: CommandRunner {
        executable_or_command,
        maybe_execution_directory,
        env_var_policy: EnvVarPolicy::CopyNone,
        maybe_virtual_env_activation_command: None,
        maybe_docker_options,
        maybe_execution_timeout,
      }
    })
  }
}
