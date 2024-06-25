use std::collections::HashSet;
use std::env;
use std::ffi::OsString;
use std::fs::File;
use std::path::{Path, PathBuf};
use std::time::Duration;

use anyhow::anyhow;
use log::info;
use once_cell::sync::Lazy;
use subprocess::{Popen, PopenConfig};

use enums::no_table::style_transfer::style_transfer_name::StyleTransferName;
use errors::AnyhowResult;
use filesys::path_to_string::path_to_string;
use subprocess_common::command_exit_status::CommandExitStatus;
use subprocess_common::docker_options::{DockerFilesystemMount, DockerGpu, DockerOptions};

// These environment vars are not copied over to the subprocess
// TODO/FIXME(bt, 2023-05-28): This is horrific security!
static IGNORED_ENVIRONMENT_VARS : Lazy<HashSet<String>> = Lazy::new(|| {
    let env_var_names= [
        "MYSQL_URL",
        "ACCESS_KEY",
        "SECRET_KEY",
        "NEWRELIC_API_KEY",
    ];

    env_var_names.iter()
        .map(|value| value.to_string())
        .collect::<HashSet<String>>()
});

#[derive(Clone)]
pub struct ComfyInferenceCommand {
    /// Where the code lives
    pub(crate) comfy_root_code_directory: PathBuf,

    /// A single executable script or a much larger bash command.
    executable_or_command: ExecutableOrCommand,

    // Where to mount the filesystem
    pub(crate) mounts_directory: PathBuf,

    // Video processing script
    pub(crate) processing_script: PathBuf,

    pub(crate) comfy_setup_script: PathBuf,

    pub(crate) comfy_launch_command: PathBuf,

    pub(crate) styles_directory: PathBuf,

    pub(crate) workflows_directory: PathBuf,

    pub(crate) mappings_directory: PathBuf,

    pub(crate) comfy_startup_healthcheck_enabled: bool,

    /// Config file to use
    config_path: Option<PathBuf>,

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

    pub inference_details: InferenceDetails<'s>,

    pub face_detailer_enabled: bool,

    pub upscaler_enabled: bool,

    pub lipsync_enabled: bool,

    pub disable_lcm: bool,

    pub use_cinematic: bool,

    pub maybe_strength: Option<f32>,

    pub global_ipa_image_filename: Option<String>,
    pub global_ipa_strength: Option<f32>,
}

#[derive(Debug)]
pub enum InferenceDetails<'s> {
    OldRustArgs {
        /// Location of the prompt JSON file
        /// Optional: This is used if the Rust side controls this prompt JSON construction.
        prompt_location: PathBuf,
    },
    NewPythonArgs {
        /// Positive prompt file.
        /// Optional: If set, Python will be in charge of overwriting the prompt JSON file
        /// with the correct workflow args.
        maybe_positive_prompt_filename: Option<&'s Path>,

        /// Negative prompt file.
        /// Optional: If set, Python will be in charge of overwriting the prompt JSON file
        /// with the correct workflow args.
        maybe_negative_prompt_filename: Option<&'s Path>,

        /// Style name
        /// Optional: If set, Python will be in charge of overwriting the prompt JSON file
        /// with the correct workflow args.
        maybe_style: Option<StyleTransferName>,
    },
}

impl ComfyInferenceCommand {
    pub fn from_env() -> AnyhowResult<Self> {
        let comfy_root_code_directory = easyenv::get_env_pathbuf_required(
            "COMFY_INFERENCE_ROOT_DIRECTORY")?;

        let config_path = easyenv::get_env_pathbuf_optional(
            "COMFY_INFERENCE_CONFIG_PATH");

        let executable_or_command = match easyenv::get_env_string_optional(
            "COMFY_INFERENCE_EXECUTABLE_OR_COMMAND") {
            None => {
                return Err(anyhow!("COMFY_INFERENCE_EXECUTABLE_OR_COMMAND is required"));
            }
            Some(executable_or_command) => {
                if executable_or_command.contains(" ") {
                    ExecutableOrCommand::Command(executable_or_command)
                } else {
                    ExecutableOrCommand::Executable(PathBuf::from(executable_or_command))
                }
            }
        };

        let comfy_setup_script = easyenv::get_env_pathbuf_required(
            "COMFY_SETUP_SCRIPT")?;

        let comfy_launch_command = easyenv::get_env_pathbuf_required(
            "COMFY_LAUNCH_COMMAND")?;

        let comfy_startup_healthcheck_enabled =  easyenv::get_env_bool_or_default(
            "COMFY_STARTUP_HEALTHCHECK_ENABLED", true);

        let maybe_virtual_env_activation_command = easyenv::get_env_string_optional(
            "COMFY_INFERENCE_MAYBE_VENV_COMMAND");

        let maybe_execution_timeout =
            easyenv::get_env_duration_seconds_optional("COMFY_TIMEOUT_SECONDS");

        let maybe_docker_options = easyenv::get_env_string_optional(
            "COMFY_INFERENCE_MAYBE_DOCKER_IMAGE")
            .map(|image_name| {
                DockerOptions {
                    image_name,
                    maybe_bind_mount: Some(DockerFilesystemMount::tmp_to_tmp()),
                    maybe_environment_variables: None,
                    maybe_gpu: Some(DockerGpu::All),
                }
            });

        let mounts_directory = easyenv::get_env_pathbuf_required(
            "COMFY_MOUNTS_DIRECTORY")?;

        let processing_script = easyenv::get_env_pathbuf_required(
            "COMFY_VIDEO_PROCESSING_SCRIPT")?;

        let styles_directory = easyenv::get_env_pathbuf_required(
            "COMFY_STYLES_DIRECTORY")?;

        let workflows_directory = easyenv::get_env_pathbuf_required(
            "COMFY_WORKFLOWS_DIRECTORY")?;

        let mappings_directory = easyenv::get_env_pathbuf_required(
            "COMFY_MAPPINGS_DIRECTORY")?;

        Ok(Self {
            comfy_root_code_directory,
            executable_or_command,
            config_path,
            mounts_directory,
            processing_script,
            comfy_setup_script,
            comfy_launch_command,
            comfy_startup_healthcheck_enabled,
            maybe_virtual_env_activation_command,
            maybe_docker_options,
            maybe_execution_timeout,
            styles_directory,
            workflows_directory,
            mappings_directory,
        })
    }

    pub fn execute_inference(
        &self,
        args: InferenceArgs,
    ) -> CommandExitStatus {
        self.do_execute_inference(args).unwrap_or_else(|error| CommandExitStatus::FailureWithReason { reason: format!("error: {:?}", error) })
    }

    fn do_execute_inference(
        &self,
        args: InferenceArgs,
    ) -> AnyhowResult<CommandExitStatus> {

        info!("InferenceArgs: {:?}", &args);

        let mut command = String::new();
        command.push_str(&format!("cd {}", path_to_string(&self.comfy_root_code_directory)));

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

        match args.inference_details {
            InferenceDetails::OldRustArgs { ref prompt_location } => {
                command.push_str(" --prompt ");
                command.push_str(&path_to_string(prompt_location));
                command.push_str(" ");
            }
            InferenceDetails::NewPythonArgs {
                maybe_positive_prompt_filename,
                maybe_negative_prompt_filename,
                maybe_style
            } => {
                if let Some(positive_prompt_filename) = maybe_positive_prompt_filename {
                    command.push_str(" --positive_prompt_filename ");
                    command.push_str(&path_to_string(positive_prompt_filename));
                    command.push_str(" ");
                }

                if let Some(negative_prompt_filename) = maybe_negative_prompt_filename {
                    command.push_str(" --negative_prompt_filename ");
                    command.push_str(&path_to_string(negative_prompt_filename));
                    command.push_str(" ");
                }

                if let Some(style) = maybe_style {
                    command.push_str(" --style ");
                    command.push_str(style.to_str());
                    command.push_str(" ");
                }
            }
        }

        if args.face_detailer_enabled {
            command.push_str(" --face-detailer-enabled ");
        }

        if args.upscaler_enabled {
            command.push_str(" --upscaler-enabled ");
        }

        if args.lipsync_enabled {
            command.push_str(" --lipsync-enabled ");
        }

        if args.disable_lcm {
            command.push_str(" --disable-lcm ");
        }

        if args.use_cinematic {
            command.push_str(" --enable-cinematic ");
        }

        if let Some(strength) = args.maybe_strength {
            command.push_str(" --strength ");
            command.push_str(&strength.to_string());
            command.push_str(" ");
        }

        if let Some(global_ipa_image_filename) = &args.global_ipa_image_filename {
            // NB: This is very dangerous. We're not handling escaping well.
            command.push_str(" --global_ipa_image_filename ");
            command.push_str(&format!("'{}'", global_ipa_image_filename));
            command.push_str(" ");
        }

        if let Some(global_ipa_strength) = &args.global_ipa_strength {
            command.push_str(" --global_ipa_strength ");
            command.push_str(&format!("{}", global_ipa_strength));
            command.push_str(" ");
        }


        if let Some(docker_options) = self.maybe_docker_options.as_ref() {
            command = docker_options.to_command_string(&command);
        }

        info!("Command: {:?}", command);

        let command_parts = [
            "bash",
            "-c",
            &command
        ];

        let mut env_vars = Vec::new();

        // Copy all environment variables from the parent process.
        // This is necessary to send all the kubernetes settings for Nvidia / CUDA.
        for (env_key, env_value) in env::vars() {
            if IGNORED_ENVIRONMENT_VARS.contains(&env_key) {
                continue;
            }
            env_vars.push((
                OsString::from(env_key),
                OsString::from(env_value),
            ));
        }

        let mut config = PopenConfig::default();

        info!("stderr will be written to file: {:?}", args.stderr_output_file.as_os_str());

        let _stderr_file = File::create(&args.stderr_output_file)?;
        let _stdout_file = File::create(&args.stdout_output_file)?;

        // NB(bt, 2024-03-01): Let's actually emit these lots to the rust logs so we can see what happens.
        //config.stderr = Redirection::File(stderr_file);
        //config.stdout = Redirection::File(stdout_file);

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
