use std::fs::File;
use std::path::{Path, PathBuf};
use std::time::Duration;

use anyhow::anyhow;
use log::info;
use subprocess::{Popen, PopenConfig, Redirection};

use errors::AnyhowResult;
use filesys::path_to_string::path_to_string;
use subprocess_common::command_exit_status::CommandExitStatus;
use subprocess_common::docker_options::{DockerFilesystemMount, DockerGpu, DockerOptions};

use crate::util::get_filtered_env_vars::get_filtered_env_vars;

#[derive(Clone)]
pub struct MocapnetInferenceCommand {
    /// Where the code lives
    pub(crate) mocapnet_root_code_directory: PathBuf,

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

pub struct InferenceArgs<'s, P: AsRef<Path>> {
    pub video_file: &'s P,
    pub maybe_ik1: &'s Option<f32>,
    pub maybe_ik2: &'s Option<i32>,
    pub maybe_ik3: &'s Option<i32>,
    pub maybe_smoothing1: &'s Option<f32>,
    pub maybe_smoothing2: &'s Option<f32>,
    pub maybe_size1: &'s Option<i32>,
    pub maybe_size2: &'s Option<i32>,
    pub stderr_output_file: &'s Path,
}

impl MocapnetInferenceCommand {
    pub fn from_env() -> AnyhowResult<Self> {
        let mocapnet_root_code_directory = easyenv::get_env_pathbuf_required(
            "MOCAPNET_INFERENCE_ROOT_DIRECTORY")?;

        let executable_or_command = match easyenv::get_env_string_optional(
            "MOCAPNET_INFERENCE_EXECUTABLE_OR_COMMAND") {
            None => {
                return Err(anyhow!("MOCAPNET_INFERENCE_EXECUTABLE_OR_COMMAND is required"));
            }
            Some(executable_or_command) => {
                if executable_or_command.contains(" ") {
                    ExecutableOrCommand::Command(executable_or_command)
                } else {
                    ExecutableOrCommand::Executable(PathBuf::from(executable_or_command))
                }
            }
        };

        let maybe_virtual_env_activation_command = easyenv::get_env_string_optional(
            "MOCAPNET_INFERENCE_MAYBE_VENV_COMMAND");

        let maybe_execution_timeout =
            easyenv::get_env_duration_seconds_optional("MOCAPNET_TIMEOUT_SECONDS");

        let maybe_docker_options = easyenv::get_env_string_optional(
            "MOCAPNET_INFERENCE_MAYBE_DOCKER_IMAGE")
            .map(|image_name| {
                DockerOptions {
                    image_name,
                    maybe_bind_mount: Some(DockerFilesystemMount::tmp_to_tmp()),
                    maybe_environment_variables: None,
                    maybe_gpu: Some(DockerGpu::All),
                }
            });

        Ok(Self {
            mocapnet_root_code_directory,
            executable_or_command,
            maybe_virtual_env_activation_command,
            maybe_docker_options,
            maybe_execution_timeout,
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
        command.push_str(&format!("cd {}", path_to_string(&self.mocapnet_root_code_directory)));

        if let Some(venv_command) = self.maybe_virtual_env_activation_command.as_deref() {
            command.push_str(" && ");
            command.push_str(venv_command);
            command.push_str(" ");
        }

        command.push_str(" && ");

        match self.executable_or_command {
            ExecutableOrCommand::Executable(ref executable) => {
                command.push_str(&path_to_string(executable));
                command.push_str(" ");
            }
            ExecutableOrCommand::Command(ref cmd) => {
                command.push_str(cmd);
                command.push_str(" ");
            }
        }

        // ===== Begin Python Args =====

        command.push_str(" -m mediapipeHolisticWebcamMocapNET ");

        let video_path = args.video_file.as_ref();
        command.push_str(&format!(" --from {}", path_to_string(video_path)));
        if let Some(ik1) = args.maybe_ik1 {
            command.push_str(&format!(" --ik {} {} {}", ik1, args.maybe_ik2.unwrap(), args.maybe_ik3.unwrap()));
        }
        if let Some(smooth1) = args.maybe_smoothing1 {
            command.push_str(&format!(" --smooth {} {}", smooth1, args.maybe_smoothing2.unwrap()));
        }
        if let Some(size1) = args.maybe_size1 {
            command.push_str(&format!(" --size {} {}", size1, args.maybe_size2.unwrap()));
        }
        command.push_str(" --all --save --headless 2");

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
