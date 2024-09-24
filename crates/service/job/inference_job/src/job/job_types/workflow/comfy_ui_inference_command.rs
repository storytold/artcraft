use std::collections::{HashMap, HashSet};
use std::env;
use std::ffi::OsString;
use std::fs::File;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::process::Stdio;
use std::time::Duration;

use anyhow::anyhow;
// These environment vars are not copied over to the subprocess
use log::{debug, info, warn};
use once_cell::sync::Lazy;
// TODO/FIXME(bt, 2023-05-28): This is horrific security!
use r2d2_redis::r2d2::PooledConnection;
use r2d2_redis::redis::Commands;
use r2d2_redis::RedisConnectionManager;
use subprocess::{Popen, PopenConfig};
use tokio::fs::OpenOptions;
use tokio::io::{AsyncBufReadExt, AsyncRead, AsyncReadExt, AsyncWriteExt, BufReader, Stdout};
use tokio::process::Command;
use tokio_util::codec::{FramedRead, FramedWrite, LinesCodec};

use crate::job::job_types::workflow::face_fusion::command_args::FaceFusionCommandArgs;
use crate::job::job_types::workflow::live_portrait::command_args::LivePortraitCommandArgs;
use crate::util::get_filtered_env_vars::{get_filtered_env_vars, get_filtered_env_vars_hashmap};
use enums::no_table::style_transfer::style_transfer_name::StyleTransferName;
use errors::AnyhowResult;
use filesys::path_to_string::path_to_string;
use subprocess_common::command_exit_status::CommandExitStatus;
use subprocess_common::command_runner::command_args::CommandArgs;
use subprocess_common::docker_options::{DockerFilesystemMount, DockerGpu, DockerOptions};

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

    pub frame_skip: Option<u8>,

    pub generate_previews: bool,

    pub preview_frames_directory: Option<&'s Path>,

    pub global_ipa_image_filename: Option<String>,
    pub global_ipa_strength: Option<f32>,

    pub depth_video_path: Option<&'s Path>,
    pub normal_video_path: Option<&'s Path>,
    pub outline_video_path: Option<&'s Path>,
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

        /// Travel prompt file.
        /// Optional: If set, Python will be in charge of overwriting the prompt JSON file
        /// with the correct workflow args.
        maybe_travel_prompt_filename: Option<&'s Path>,

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

    pub async fn execute_inference<'a, 'b>(
        &'a self,
        frames_tx: tokio::sync::mpsc::Sender<Result<PathBuf,()>>,
        cancellation_receiver: &mut tokio::sync::oneshot::Receiver<()>,
        args: InferenceArgs<'b>,
    ) -> CommandExitStatus {
        self.do_execute_inference(frames_tx, cancellation_receiver, args).await.unwrap_or_else(|error| CommandExitStatus::FailureWithReason { reason: format!("error: {:?}", error) })
    }

    async fn do_execute_inference<'a, 'b>(
        &'a self,
        frames_tx: tokio::sync::mpsc::Sender<Result<PathBuf,()>>,
        cancellation_receiver: &mut tokio::sync::oneshot::Receiver<()>,
        args: InferenceArgs<'b>,
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
                maybe_travel_prompt_filename,
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

                if let Some(travel_prompt_filename) = maybe_travel_prompt_filename {
                    command.push_str(" --travel_prompt_filename ");
                    command.push_str(&path_to_string(travel_prompt_filename));
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

        if let Some(frame_skip) = args.frame_skip {
            command.push_str(" --frame_skip ");
            command.push_str(&frame_skip.to_string());
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

        if let Some(depth_video_path) = args.depth_video_path {
            command.push_str(" --depth_video_filename ");
            command.push_str(&path_to_string(depth_video_path));
            command.push_str(" ");
        }

        if let Some(normal_video_path) = args.normal_video_path {
            command.push_str(" --normals_video_filename ");
            command.push_str(&path_to_string(normal_video_path));
            command.push_str(" ");
        }

        if let Some(outline_video_path) = args.outline_video_path {
            command.push_str(" --outline_video_filename ");
            command.push_str(&path_to_string(outline_video_path));
            command.push_str(" ");
        }

        if args.generate_previews {
            command.push_str(" --generate-previews ");
            if let Some(preview_frames_directory) = args.preview_frames_directory {
                command.push_str(" --preview-frames-directory ");
                command.push_str(&path_to_string(preview_frames_directory));
            }
        }

        if let Some(docker_options) = self.maybe_docker_options.as_ref() {
            command = docker_options.to_command_string(&command);
        }

        info!("Command: {:?}", command);

        let env_vars = get_filtered_env_vars_hashmap();

        info!("stderr will be written to file: {:?}", args.stderr_output_file.as_os_str());

        let mut stderr_file = tokio::fs::OpenOptions::new()
          .create(true)
          .read(true)
          .write(true)
          .open(&args.stderr_output_file)
          .await?;

        let mut stdout_file = tokio::fs::OpenOptions::new()
          .create(true)
          .read(true)
          .write(true)
          .open(&args.stdout_output_file)
          .await?;

        let mut c = Command::new("bash")
          .arg("-c")
          .arg(&command)
          .stdout(Stdio::piped())
          .stderr(Stdio::piped())
          .envs(env_vars)
          .spawn()
          .expect("failed to execute process");

        let stdout = c.stdout.take();
        // (Kasisnu, 9/08/24) these are safe to leave dangling, when stdout is dropped,
        // the reader will be dropped and the pipe will be closed
        tokio::spawn(async move {
            match stdout {
                Some(stdout) => {
                    let mut reader = BufReader::new(stdout);
                    let mut line = String::new();
                    loop {
                        let bytes_read = reader.read_line(&mut line).await;
                        match bytes_read {
                            Ok(bytes_read) => {
                                if bytes_read == 0 {
                                    break;
                                }
                                let write_result = stdout_file.write_all(line.as_bytes()).await;
                                match write_result {
                                    Ok(_) => {}
                                    Err(e) => {
                                        warn!("Error writing stdout: {:?}", e);
                                        break;
                                    }
                                }
                                print!("{}", line);
                                line.clear();
                            }
                            Err(e) => {
                                warn!("Error reading stdout: {:?}", e);
                                break;
                            }
                        }
                    }
                }
                None => {
                    warn!("No stdout available to read");
                }
            }
        });

        let stderr = c.stderr.take();
        tokio::spawn(async move {
            match stderr {
                Some(stderr) => {
                    let mut reader = BufReader::new(stderr);
                    let mut line = String::new();
                    loop {
                        let bytes_read = reader.read_line(&mut line).await;
                        match bytes_read {
                            Ok(bytes_read) => {
                                if bytes_read == 0 {
                                    break;
                                }
                                let write_result = stderr_file.write_all(line.as_bytes()).await;
                                match write_result {
                                    Ok(_) => {}
                                    Err(e) => {
                                        warn!("Error writing stderr: {:?}", e);
                                        break;
                                    }
                                }
                                println!("here: {}", line);
                                line.clear();
                            }
                            Err(e) => {
                                warn!("Error reading stderr: {:?}", e);
                                break;
                            }
                        }
                    }
                }
                None => {
                    warn!("No stderr available to read");
                }
            }
        });

        let mut status = None;
        let execution_start_time = std::time::Instant::now();

        loop {

            if let Some(execution_timeout) = self.maybe_execution_timeout {
                let now = std::time::Instant::now();
                if now.duration_since(execution_start_time) > execution_timeout {
                    info!("Execution timeout reached");
                    let res = c.kill().await;
                    match res {
                        Ok(_) => {
                            info!("Killed Comfy process");
                        }
                        Err(e) => {
                            info!("Error killing Comfy process: {:?}, this might leak resources", e);
                        }
                    }
                    status = Some(CommandExitStatus::Timeout);
                    break;
                }
            }

            // Check if the process has been cancelled
            match cancellation_receiver.try_recv() {
                Ok(_) => {
                    info!("Cancelling Comfy process");
                    let res = c.kill().await;
                    match res {
                        Ok(_) => {
                            info!("Killed Comfy process");
                        }
                        Err(e) => {
                            info!("Error killing Comfy process: {:?}, this might leak resources", e);
                        }
                    }
                    status = Some(CommandExitStatus::Timeout);
                    break;
                }
                Err(tokio::sync::oneshot::error::TryRecvError::Empty) => {
                    // Do nothing
                }
                Err(tokio::sync::oneshot::error::TryRecvError::Closed) => {
                    info!("Cancellation channel closed");
                    break;
                }
            }

            match c.try_wait() {
                Ok(Some(exit_status)) => {
                    match exit_status.success() {
                        true => {
                            status = Some(CommandExitStatus::Success);
                        }
                        false => {
                            status = Some(CommandExitStatus::Failure);
                        }
                    }
                }
                Ok(None) => {
                    debug!("ComfyUI process is still running");
                }
                Err(e) => {
                    info!("Error attempting to wait: {:?}", e);
                    break;
                }
            }

            //  Check if preview_frames_directory has any files
            if let Some(preview_frames_directory) = args.preview_frames_directory {
                let dir = std::fs::read_dir(preview_frames_directory);
                match dir {
                    Ok(dir) => {
                        if dir.count() > 0 {
                            for entry in std::fs::read_dir(preview_frames_directory).unwrap() {
                                let entry = entry.unwrap();
                                let path = entry.path();
                                if path.is_dir() {
                                    for entry in std::fs::read_dir(&path).unwrap() {
                                        let entry = entry.unwrap();
                                        let path = entry.path();

                                        let tx = frames_tx.clone();
                                        tokio::spawn(async move {
                                            tx.send(Ok(path)).await.unwrap();
                                        });
                                    }
                                }
                            }
                        }
                    },
                    Err(e) => {
                        info!("Error reading preview frames directory: {:?}", e);
                    }
                }
            }
            if status.is_some() {
                break;
            }

            tokio::time::sleep(Duration::from_secs(5)).await;
        }

        return Ok(status.unwrap());
    }

    // TODO(bt,2024-07-16): This belongs in another module / runner, and all of these need to be consolidated
    pub async fn execute_live_portrait_inference<'a, 'b>(
        &'a self,
        args: LivePortraitCommandArgs<'b>,
    ) -> CommandExitStatus {
        self.do_execute_live_portrait_inference(args).await.unwrap_or_else(|error| CommandExitStatus::FailureWithReason { reason: format!("error: {:?}", error) })
    }

    async fn do_execute_live_portrait_inference<'a, 'b>(
        &'a self,
        args: LivePortraitCommandArgs<'b>,
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

        let arguments = args.to_command_string();

        command.push_str(&arguments);

        if let Some(docker_options) = self.maybe_docker_options.as_ref() {
            command = docker_options.to_command_string(&command);
        }

        info!("Command: {:?}", command);


        let env_vars = get_filtered_env_vars_hashmap();


        info!("stderr will be written to file: {:?}", args.stderr_output_file.as_os_str());

        let mut stderr_file = tokio::fs::OpenOptions::new()
          .create(true)
          .read(true)
          .write(true)
          .open(&args.stderr_output_file)
          .await?;

        let mut stdout_file = tokio::fs::OpenOptions::new()
          .create(true)
          .read(true)
          .write(true)
          .open(&args.stdout_output_file)
          .await?;

        let mut c = Command::new("bash")
          .arg("-c")
          .arg(&command)
          .stdout(Stdio::piped())
          .stderr(Stdio::piped())
          .envs(env_vars)
          .spawn()
          .expect("failed to execute process");

        let stdout = c.stdout.take();
        // (Kasisnu, 9/08/24) these are safe to leave dangling, when stdout is dropped,
        // the reader will be dropped and the pipe will be closed
        tokio::spawn(async move {
            match stdout {
                Some(stdout) => {
                    let mut reader = BufReader::new(stdout);
                    let mut line = String::new();
                    loop {
                        let bytes_read = reader.read_line(&mut line).await;
                        match bytes_read {
                            Ok(bytes_read) => {
                                if bytes_read == 0 {
                                    break;
                                }
                                let write_result = stdout_file.write_all(line.as_bytes()).await;
                                match write_result {
                                    Ok(_) => {}
                                    Err(e) => {
                                        warn!("Error writing stdout: {:?}", e);
                                        break;
                                    }
                                }
                                print!("{}", line);
                                line.clear();
                            }
                            Err(e) => {
                                warn!("Error reading stdout: {:?}", e);
                                break;
                            }
                        }
                    }
                }
                None => {
                    warn!("No stdout available to read");
                }
            }
        });

        let stderr = c.stderr.take();
        tokio::spawn(async move {
            match stderr {
                Some(stderr) => {
                    let mut reader = BufReader::new(stderr);
                    let mut line = String::new();
                    loop {
                        let bytes_read = reader.read_line(&mut line).await;
                        match bytes_read {
                            Ok(bytes_read) => {
                                if bytes_read == 0 {
                                    break;
                                }
                                let write_result = stderr_file.write_all(line.as_bytes()).await;
                                match write_result {
                                    Ok(_) => {}
                                    Err(e) => {
                                        warn!("Error writing stderr: {:?}", e);
                                        break;
                                    }
                                }
                                println!("here: {}", line);
                                line.clear();
                            }
                            Err(e) => {
                                warn!("Error reading stderr: {:?}", e);
                                break;
                            }
                        }
                    }
                }
                None => {
                    warn!("No stderr available to read");
                }
            }
        });

        let mut status = None;
        let execution_start_time = std::time::Instant::now();

        loop {
            if let Some(execution_timeout) = self.maybe_execution_timeout {
                let now = std::time::Instant::now();
                if now.duration_since(execution_start_time) > execution_timeout {
                    info!("Execution timeout reached");
                    let res = c.kill().await;
                    match res {
                        Ok(_) => {
                            info!("Killed Comfy process");
                        }
                        Err(e) => {
                            info!("Error killing Comfy process: {:?}, this might leak resources", e);
                        }
                    }
                    status = Some(CommandExitStatus::Timeout);
                    break;
                }
            }

            match c.try_wait() {
                Ok(Some(exit_status)) => {
                    match exit_status.success() {
                        true => {
                            status = Some(CommandExitStatus::Success);
                        }
                        false => {
                            status = Some(CommandExitStatus::Failure);
                        }
                    }
                }
                Ok(None) => {
                    debug!("ComfyUI process is still running");
                }
                Err(e) => {
                    info!("Error attempting to wait: {:?}", e);
                    break;
                }
            }
            if status.is_some() {
                break;
            }

            tokio::time::sleep(Duration::from_secs(2)).await;
        }

        return Ok(status.unwrap());
    }


    // TODO(bt,2024-07-16): This belongs in another module / runner, and all of these need to be consolidated
    pub async fn execute_face_fusion_inference<'a, 'b>(
        &'a self,
        args: FaceFusionCommandArgs<'b>,
    ) -> CommandExitStatus {
        self.do_execute_face_fusion_inference(args).await.unwrap_or_else(|error| CommandExitStatus::FailureWithReason { reason: format!("error: {:?}", error) })
    }

    async fn do_execute_face_fusion_inference<'a, 'b>(
        &'a self,
        args: FaceFusionCommandArgs<'b>,
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

        let arguments = args.to_command_string();

        command.push_str(&arguments);

        if let Some(docker_options) = self.maybe_docker_options.as_ref() {
            command = docker_options.to_command_string(&command);
        }

        info!("Command: {:?}", command);


        let env_vars = get_filtered_env_vars_hashmap();

        info!("stderr will be written to file: {:?}", args.stderr_output_file.as_os_str());

        let mut stderr_file = tokio::fs::OpenOptions::new()
            .create(true)
            .read(true)
            .write(true)
            .open(&args.stderr_output_file)
            .await?;

        let mut stdout_file = tokio::fs::OpenOptions::new()
            .create(true)
            .read(true)
            .write(true)
            .open(&args.stdout_output_file)
            .await?;

        let mut c = Command::new("bash")
            .arg("-c")
            .arg(&command)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .envs(env_vars)
            .spawn()
            .expect("failed to execute process");

        let stdout = c.stdout.take();
        // (Kasisnu, 9/08/24) these are safe to leave dangling, when stdout is dropped,
        // the reader will be dropped and the pipe will be closed
        tokio::spawn(async move {
            match stdout {
                Some(stdout) => {
                    let mut reader = BufReader::new(stdout);
                    let mut line = String::new();
                    loop {
                        let bytes_read = reader.read_line(&mut line).await;
                        match bytes_read {
                            Ok(bytes_read) => {
                                if bytes_read == 0 {
                                    break;
                                }
                                let write_result = stdout_file.write_all(line.as_bytes()).await;
                                match write_result {
                                    Ok(_) => {}
                                    Err(e) => {
                                        warn!("Error writing stdout: {:?}", e);
                                        break;
                                    }
                                }
                                print!("{}", line);
                                line.clear();
                            }
                            Err(e) => {
                                warn!("Error reading stdout: {:?}", e);
                                break;
                            }
                        }
                    }
                }
                None => {
                    warn!("No stdout available to read");
                }
            }
        });

        let stderr = c.stderr.take();
        tokio::spawn(async move {
            match stderr {
                Some(stderr) => {
                    let mut reader = BufReader::new(stderr);
                    let mut line = String::new();
                    loop {
                        let bytes_read = reader.read_line(&mut line).await;
                        match bytes_read {
                            Ok(bytes_read) => {
                                if bytes_read == 0 {
                                    break;
                                }
                                let write_result = stderr_file.write_all(line.as_bytes()).await;
                                match write_result {
                                    Ok(_) => {}
                                    Err(e) => {
                                        warn!("Error writing stderr: {:?}", e);
                                        break;
                                    }
                                }
                                println!("here: {}", line);
                                line.clear();
                            }
                            Err(e) => {
                                warn!("Error reading stderr: {:?}", e);
                                break;
                            }
                        }
                    }
                }
                None => {
                    warn!("No stderr available to read");
                }
            }
        });

        let mut status = None;
        let execution_start_time = std::time::Instant::now();

        loop {
            if let Some(execution_timeout) = self.maybe_execution_timeout {
                let now = std::time::Instant::now();
                if now.duration_since(execution_start_time) > execution_timeout {
                    info!("Execution timeout reached");
                    let res = c.kill().await;
                    match res {
                        Ok(_) => {
                            info!("Killed Comfy process");
                        }
                        Err(e) => {
                            info!("Error killing Comfy process: {:?}, this might leak resources", e);
                        }
                    }
                    status = Some(CommandExitStatus::Timeout);
                    break;
                }
            }

            match c.try_wait() {
                Ok(Some(exit_status)) => {
                    match exit_status.success() {
                        true => {
                            status = Some(CommandExitStatus::Success);
                        }
                        false => {
                            status = Some(CommandExitStatus::Failure);
                        }
                    }
                }
                Ok(None) => {
                    debug!("ComfyUI process is still running");
                }
                Err(e) => {
                    info!("Error attempting to wait: {:?}", e);
                    break;
                }
            }
            if status.is_some() {
                break;
            }

            tokio::time::sleep(Duration::from_secs(2)).await;
        }

        return Ok(status.unwrap());
    }
}
