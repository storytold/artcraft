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
pub enum ExecutableOrCommand {
    /// Eg. `inference.py`
    Executable(PathBuf),
    /// Eg. `python3 inference.py`
    Command(String),
}

// The inference command assumes everything has been setup to run inference
// so we have all the files downloaded for the inputs.
pub struct InferenceArgs<P: AsRef<Path>> {
    /// --driven_audio: path to the input audio
    pub input_embedding_path: P, // name of the embedding.npz in the work dir
    pub input_embedding_name: String,
    pub input_text: String, // name of the text
    pub output_file_name: String, // output file name in the output folder
    pub stderr_output_file: P,
}

pub struct CreateVoiceInferenceArgs<P: AsRef<Path>> {
  pub output_embedding_path: P,
  pub output_embedding_name: P,
  pub audio_files: String,
  pub stderr_output_file: P,
}

#[derive(Clone)]
pub struct VallEXInferenceCommand {
    /// Where the code lives
    root_code_directory: PathBuf,
    /// A single executable script or a much larger bash command.
    executable_or_command: ExecutableOrCommand,
    /// eg. `source python/bin/activate`
    maybe_virtual_env_activation_command: Option<String>,
    /// Optional default config file to use
    maybe_default_config_path: Option<PathBuf>,
    /// If this is run under Docker (eg. in development), these are the options.
    maybe_docker_options: Option<DockerOptions>,
    /// If the execution should be ended after a certain point.
    maybe_execution_timeout: Option<Duration>,
    /// Inference arg.
    /// --checkpoint_dir: optional location for checkpoints directory
    pub alternate_checkpoint_dir: Option<PathBuf>,
}


impl VallEXInferenceCommand {
    pub fn new<P: AsRef<Path>>(
        root_code_directory: P,
        executable_or_command: ExecutableOrCommand,
        maybe_virtual_env_activation_command: Option<&str>,
        maybe_default_config_path: Option<P>,
        maybe_docker_options: Option<DockerOptions>,
        maybe_execution_timeout: Option<Duration>,
        alternate_checkpoint_dir: Option<PathBuf>
    ) -> Self {
        Self {
            root_code_directory: root_code_directory.as_ref().to_path_buf(),
            executable_or_command,
            maybe_virtual_env_activation_command: maybe_virtual_env_activation_command.map(|s|
                s.to_string()
            ),
            maybe_default_config_path: maybe_default_config_path.map(|p| p.as_ref().to_path_buf()),
            maybe_docker_options,
            maybe_execution_timeout,
            alternate_checkpoint_dir,
        }
    }

    pub fn from_env() -> AnyhowResult<Self> {
        let root_code_directory = easyenv::get_env_pathbuf_required(
            "VALL_E_X_INFERENCE_ROOT_DIRECTORY"
        )?;

        let maybe_inference_command = easyenv::get_env_string_optional(
            "VALL_E_X_INFERENCE_COMMAND"
        );

        // EVENTUALLY should remove the check
        // Optional, eg. `./infer.py`. Typically we'll use the command form instead.
        let maybe_inference_executable = easyenv::get_env_pathbuf_optional(
            "VALL_E_X_INFERENCE_EXECUTABLE"
        );

        let executable_or_command = match maybe_inference_command {
            Some(command) => ExecutableOrCommand::Command(command),
            None =>
                match maybe_inference_executable {
                    Some(executable) => ExecutableOrCommand::Executable(executable),
                    None => {
                        return Err(anyhow!("neither command nor executable passed"));
                    }
                }
        };

        let maybe_virtual_env_activation_command = easyenv::get_env_string_optional(
            "VALL_E_X_INFERENCE_MAYBE_VENV_COMMAND"
        );

        let maybe_default_config_path = easyenv::get_env_pathbuf_optional(
            "VALL_E_X_INFERENCE_MAYBE_DEFAULT_CONFIG_PATH"
        );

        let maybe_execution_timeout = easyenv::get_env_duration_seconds_optional("TIMEOUT_SECONDS");

        // Probably for local
        let maybe_docker_options = easyenv
            ::get_env_string_optional("VALL_E_X_INFERENCE_MAYBE_DOCKER_IMAGE")
            .map(|image_name| {
                DockerOptions {
                    image_name,
                    maybe_bind_mount: Some(DockerFilesystemMount::tmp_to_tmp()),
                    maybe_environment_variables: None,
                    maybe_gpu: Some(DockerGpu::All),
                }
            });

        // Override for --checkpoint_dir at inference time
        let alternate_checkpoint_dir = easyenv::get_env_pathbuf_optional(
            "VALL_E_X_ALTERNATE_CHECKPOINT_PATH"
        );

        Ok(Self {
            root_code_directory,
            executable_or_command,
            maybe_virtual_env_activation_command,
            maybe_default_config_path,
            maybe_docker_options,
            maybe_execution_timeout,
            alternate_checkpoint_dir,
        })
    }

    pub fn execute_inference<P: AsRef<Path>>(&self, args: InferenceArgs<P>) -> CommandExitStatus {
        match self.do_execute_inference(args) {
            Ok(exit_status) => exit_status,
            Err(error) =>
                CommandExitStatus::FailureWithReason { reason: format!("error: {:?}", error) },
        }
    }

    fn do_execute_inference<P: AsRef<Path>>(
        &self,
        args: InferenceArgs<P>
    ) -> AnyhowResult<CommandExitStatus> {
        let mut command = String::new();
        command.push_str(&format!("cd {}", path_to_string(&self.root_code_directory)));

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

        command.push_str(" --text ");
        command.push_str(&format!("\"{}\"", &args.input_text));

        command.push_str(" --prompt-name ");
        command.push_str(&path_to_string(args.input_embedding_name));

        command.push_str(" --prompt-path ");
        command.push_str(&path_to_string(&args.input_embedding_path));

        command.push_str(" --audio-name ");
        command.push_str(&path_to_string(args.output_file_name));

        command.push_str(" --audio-path ");
        command.push_str(&path_to_string(&args.input_embedding_path));

        command.push_str(" --mode ");
        command.push_str(&path_to_string("0"));
        // TODO improve and use a better model for premium users
        command.push_str(" --whisper-model ");
        command.push_str(&path_to_string(Path::new("medium")));

        command.push_str(" --whisper-folder-path ");
        command.push_str(
            &path_to_string(Path::new("/tmp/downloads/zero_shot_tts/vall-e-x_1.0/whisper/"))
        );

        command.push_str(" --vocos-folder-path ");
        command.push_str(
            &path_to_string(Path::new("/tmp/downloads/zero_shot_tts/vall-e-x_1.0/vocos-encodec/"))
        );

        command.push_str(" --vallex-path ");
        command.push_str(
            &path_to_string(
                Path::new("/tmp/downloads/zero_shot_tts/vall-e-x_1.0/vallex-checkpoint.pt")
            )
        );

        command.push_str(" --tmp-work-dir ");
        command.push_str(&path_to_string(Path::new("/tmp/downloads/zero_shot_tts/")));

        // ===== End Python Args =====

        if let Some(docker_options) = self.maybe_docker_options.as_ref() {
            command = docker_options.to_command_string(&command);
        }

        info!("Command: {:?}", command);

        let command_parts = ["bash", "-c", &command];

        let env_vars = get_filtered_env_vars();

        let mut config = PopenConfig::default();

        info!("stderr will be written to file: {:?}", args.stderr_output_file.as_ref());

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
                        info!(
                            "Subprocess didn't end after timeout: {:?}; terminating...",
                            &timeout
                        );
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

#[derive(Clone)]
pub struct VallEXCreateEmbeddingCommand {
    /// Where the code lives
    root_code_directory: PathBuf,
    /// A single executable script or a much larger bash command.
    executable_or_command: ExecutableOrCommand,
    /// eg. `source python/bin/activate`
    maybe_virtual_env_activation_command: Option<String>,
    /// Optional default config file to use
    maybe_default_config_path: Option<PathBuf>,
    /// If this is run under Docker (eg. in development), these are the options.
    maybe_docker_options: Option<DockerOptions>,
    /// If the execution should be ended after a certain point.
    maybe_execution_timeout: Option<Duration>,
    /// Inference arg.
    /// --checkpoint_dir: optional location for checkpoints directory
    pub alternate_checkpoint_dir: Option<PathBuf>,
}

impl VallEXCreateEmbeddingCommand {
    pub fn new<P: AsRef<Path>>(
        root_code_directory: P,
        executable_or_command: ExecutableOrCommand,
        maybe_virtual_env_activation_command: Option<&str>,
        maybe_default_config_path: Option<P>,
        maybe_docker_options: Option<DockerOptions>,
        maybe_execution_timeout: Option<Duration>,
        alternate_checkpoint_dir: Option<PathBuf>
    ) -> Self {
        Self {
            root_code_directory: root_code_directory.as_ref().to_path_buf(),
            executable_or_command,
            maybe_virtual_env_activation_command: maybe_virtual_env_activation_command.map(|s|
                s.to_string()
            ),
            maybe_default_config_path: maybe_default_config_path.map(|p| p.as_ref().to_path_buf()),
            maybe_docker_options,
            maybe_execution_timeout,
            alternate_checkpoint_dir,
        }
    }

    // helper funciton to set up env
    pub fn from_env() -> AnyhowResult<Self> {
        // TODO: fix for now just for compilation
        let root_code_directory = easyenv::get_env_pathbuf_required(
            "VALL_E_X_INFERENCE_ROOT_DIRECTORY"
        )?;

        let maybe_inference_command = easyenv::get_env_string_optional(
            "VALL_E_X_INFERENCE_COMMAND"
        );

        // EVENTUALLY should remove the check
        // Optional, eg. `./infer.py`. Typically we'll use the command form instead.
        let maybe_inference_executable = easyenv::get_env_pathbuf_optional(
            "VALL_E_X_INFERENCE_EXECUTABLE"
        );

        let executable_or_command = match maybe_inference_command {
            Some(command) => ExecutableOrCommand::Command(command),
            None =>
                match maybe_inference_executable {
                    Some(executable) => ExecutableOrCommand::Executable(executable),
                    None => {
                        return Err(anyhow!("neither command nor executable passed"));
                    }
                }
        };

        let maybe_virtual_env_activation_command = easyenv::get_env_string_optional(
            "VALL_E_X_INFERENCE_MAYBE_VENV_COMMAND"
        );

        let maybe_default_config_path = easyenv::get_env_pathbuf_optional(
            "VALL_E_X_INFERENCE_MAYBE_DEFAULT_CONFIG_PATH"
        );

        let maybe_execution_timeout = easyenv::get_env_duration_seconds_optional("TIMEOUT_SECONDS");

        // Probably for local
        let maybe_docker_options = easyenv
            ::get_env_string_optional("VALL_E_X_INFERENCE_MAYBE_DOCKER_IMAGE")
            .map(|image_name| {
                DockerOptions {
                    image_name,
                    maybe_bind_mount: Some(DockerFilesystemMount::tmp_to_tmp()),
                    maybe_environment_variables: None,
                    maybe_gpu: Some(DockerGpu::All),
                }
            });

        // Override for --checkpoint_dir at inference time
        let alternate_checkpoint_dir = easyenv::get_env_pathbuf_optional(
            "VALL_E_X_CHECKPOINT_PATH"
        );

        Ok(Self {
            root_code_directory,
            executable_or_command,
            maybe_virtual_env_activation_command,
            maybe_default_config_path,
            maybe_docker_options,
            maybe_execution_timeout,
            alternate_checkpoint_dir,
        })
    }

    pub fn execute_inference<P: AsRef<Path>>(&self, args: CreateVoiceInferenceArgs<P>) -> CommandExitStatus {
        match self.do_execute_inference(args) {
            Ok(exit_status) => exit_status,
            Err(error) =>
                CommandExitStatus::FailureWithReason { reason: format!("error: {:?}", error) },
        }
    }

    fn do_execute_inference<P: AsRef<Path>>(
        &self,
        args: CreateVoiceInferenceArgs<P>
    ) -> AnyhowResult<CommandExitStatus> {
        let mut command = String::new();
        command.push_str(&format!("cd {}", path_to_string(&self.root_code_directory)));

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
        
        command.push_str(" --prompt-name ");
        command.push_str(&path_to_string(args.output_embedding_name));

        command.push_str(" --prompt-path ");
        command.push_str(&path_to_string(&args.output_embedding_path));
        
        command.push_str(" --audio-wav-files ");
        command.push_str(&args.audio_files); 

        command.push_str(" --mode ");
        command.push_str(&path_to_string("1"));
        // TODO improve and use a better model for premium users
        command.push_str(" --whisper-model ");
        command.push_str(&path_to_string(Path::new("medium")));

        command.push_str(" --whisper-folder-path ");
        command.push_str(
            &path_to_string(Path::new("/tmp/downloads/zero_shot_tts/vall-e-x_1.0/whisper/"))
        );

        command.push_str(" --vocos-folder-path ");
        command.push_str(
            &path_to_string(Path::new("/tmp/downloads/zero_shot_tts/vall-e-x_1.0/vocos-encodec/"))
        );

        command.push_str(" --vallex-path ");
        command.push_str(
            &path_to_string(
                Path::new("/tmp/downloads/zero_shot_tts/vall-e-x_1.0/vallex-checkpoint.pt")
            )
        );

        command.push_str(" --tmp-work-dir ");
        command.push_str(&path_to_string(Path::new("/tmp/downloads/zero_shot_tts/")));

        // ===== End Python Args =====

        if let Some(docker_options) = self.maybe_docker_options.as_ref() {
            command = docker_options.to_command_string(&command);
        }

        info!("Command: {:?}", command);

        let command_parts = ["bash", "-c", &command];

        let env_vars = get_filtered_env_vars();

        let mut config = PopenConfig::default();

        info!("stderr will be written to file: {:?}", args.stderr_output_file.as_ref());

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
                        info!(
                            "Subprocess didn't end after timeout: {:?}; terminating...",
                            &timeout
                        );
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
