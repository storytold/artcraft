use crate::util::get_filtered_env_vars::get_filtered_env_vars_hashmap;
use errors::AnyhowResult;
use filesys::path_to_string::path_to_string;
use log::{debug, info, warn};
use std::path::{Path, PathBuf};
use std::process::Stdio;
use std::time::Duration;
use subprocess_common::command_exit_status::CommandExitStatus;
use subprocess_common::docker_options::DockerOptions;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::process::Command;

#[derive(Clone)]
pub struct StableAnimatorCommand {
  /// Where the code lives
  root_code_directory: PathBuf,

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

#[derive(Debug)]
pub struct InferenceArgs<'s> {
  pub stderr_output_file: &'s Path,
  pub stdout_output_file: &'s Path,

  pub start_image_path: &'s Path,
  pub pose_images_dir: &'s Path,
  pub pre_pose_video_path: Option<&'s Path>,

  pub frame_output_dir: &'s Path,

  pub video_output_path: &'s Path,

  pub pretrained_model_name_or_path: &'s Path,
  pub posenet_model_name_or_path: &'s Path,
  pub face_encoder_model_name_or_path: &'s Path,
  pub unet_model_name_or_path: &'s Path,

  pub output_width: Option<u64>,
  pub output_height: Option<u64>,
  pub output_fps: Option<u64>,
}

impl StableAnimatorCommand {
  pub fn new_from_env() -> AnyhowResult<Self> {
    Ok(Self {
      root_code_directory: easyenv::get_env_pathbuf_or_default("STABLE_ANIMATOR_ROOT_CODE_DIRECTORY", PathBuf::from("/model_code")),
      executable_or_command: ExecutableOrCommand::Command("python inference_advanced.py".to_string()),
      // TODO(bt,2025-02-02): The default should be None, not Some(str).
      maybe_virtual_env_activation_command: Some(easyenv::get_env_string_or_default(
        "STABLE_ANIMATOR_VENV_ACTIVATION_COMMAND", "source /python_install/python/bin/activate")),
      maybe_docker_options: None,
      maybe_execution_timeout: None,
    })
  }

  pub async fn execute_inference<'a, 'b>(
    &'a self,
    args: InferenceArgs<'b>,
  ) -> AnyhowResult<CommandExitStatus> {
    info!("InferenceArgs: {:?}", &args);

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

    // TODO: Build command

    command.push_str(" --start_image_path ");
    command.push_str(&path_to_string(&args.start_image_path));
    command.push_str(" ");

    command.push_str(" --pose_images_dir ");
    command.push_str(&path_to_string(&args.pose_images_dir));
    command.push_str(" ");

    if let Some(path) = args.pre_pose_video_path {
      command.push_str(" --pre_pose_video_path ");
      command.push_str(&path_to_string(path));
      command.push_str(" ");
    }

    command.push_str(" --frame_output_dir ");
    command.push_str(&path_to_string(&args.frame_output_dir));
    command.push_str(" ");

    command.push_str(" --video_output_path ");
    command.push_str(&path_to_string(&args.video_output_path));
    command.push_str(" ");

    command.push_str(" --pretrained_model_name_or_path ");
    command.push_str(&path_to_string(&args.pretrained_model_name_or_path));
    command.push_str(" ");

    command.push_str(" --posenet_model_name_or_path ");
    command.push_str(&path_to_string(&args.posenet_model_name_or_path));
    command.push_str(" ");

    command.push_str(" --face_encoder_model_name_or_path ");
    command.push_str(&path_to_string(&args.face_encoder_model_name_or_path));
    command.push_str(" ");

    command.push_str(" --unet_model_name_or_path ");
    command.push_str(&path_to_string(&args.unet_model_name_or_path));
    command.push_str(" ");

    if let Some(width) = args.output_width {
      command.push_str(" --width ");
      command.push_str(&width.to_string());
      command.push_str(" ");
    }

    if let Some(height) = args.output_height {
      command.push_str(" --height ");
      command.push_str(&height.to_string());
      command.push_str(" ");
    }

    if let Some(fps) = args.output_fps {
      command.push_str(" --fps ");
      command.push_str(&fps.to_string());
      command.push_str(" ");
    }

    // TODO(bt,2025-01-24): These should maybe be set as defaults upstream. These are from an
    //  inference shell script and are not the defaults in the python arg parser.
    command.push_str(" --guidance_scale=3.0 ");
    command.push_str(" --num_inference_steps=25 ");
    command.push_str(" --tile_size=16 ");
    command.push_str(" --overlap=4 ");
    command.push_str(" --noise_aug_strength=0.02 ");
    command.push_str(" --frames_overlap=4 ");
    command.push_str(" --decode_chunk_size=4 ");
    command.push_str(" --gradient_checkpointing ");;

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
              info!("Killed Studio Gen2 process");
            }
            Err(e) => {
              info!("Error killing Studio Gen2 process: {:?}, this might leak resources", e);
            }
          }
          status = Some(CommandExitStatus::Timeout);
          break;
        }
      }

      //// Check if the process has been cancelled
      //match cancellation_receiver.try_recv() {
      //  Ok(_) => {
      //    info!("Cancelling Comfy process");
      //    let res = c.kill().await;
      //    match res {
      //      Ok(_) => {
      //        info!("Killed Comfy process");
      //      }
      //      Err(e) => {
      //        info!("Error killing Comfy process: {:?}, this might leak resources", e);
      //      }
      //    }
      //    status = Some(CommandExitStatus::Timeout);
      //    break;
      //  }
      //  Err(tokio::sync::oneshot::error::TryRecvError::Empty) => {
      //    // Do nothing
      //  }
      //  Err(tokio::sync::oneshot::error::TryRecvError::Closed) => {
      //    info!("Cancellation channel closed");
      //    break;
      //  }
      //}

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
          debug!("Studio Gen2 process is still running");
        }
        Err(e) => {
          info!("Error attempting to wait: {:?}", e);
          break;
        }
      }

      if status.is_some() {
        break;
      }

      tokio::time::sleep(Duration::from_secs(5)).await;
    }

    Ok(status.unwrap())
  }
}
