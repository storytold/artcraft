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

/*
python inference_cli.py \
    --cfg configs/Animate_X_infer.yaml \
    --image_file data_test_copy/images/man.png \
    --pose_directory data_test_copy/saved_pose/dance_2 \
    --frame_directory data_test_copy/saved_frames/dance_2 \
    --pickle_data_file data_test_copy/saved_pkl/dance_2.pkl \
    --model_checkpoints_directory checkpoints \
    --generate_comparison_video \
    --max_frames 4 \
    --height 768 \
    --width 512
 */

#[derive(Clone)]
pub struct AnimateXInferenceCommand {
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
pub struct AnimateXInferenceArgs<'s> {
  pub stderr_output_file: &'s Path,
  pub stdout_output_file: &'s Path,

  pub model_directory: &'s Path,
  
  pub result_filename: &'s Path,

  pub image_file: &'s Path,

  pub saved_pose_frames_dir: &'s Path,
  
  pub saved_original_frames_dir: &'s Path,

  pub saved_pose_pkl_file: &'s Path,

  pub width: Option<u64>,
  
  pub height: Option<u64>,
  
  pub max_frames: Option<u64>,

}

impl AnimateXInferenceCommand {
  pub fn new_from_env() -> AnyhowResult<Self> {
    Ok(Self {
      root_code_directory: easyenv::get_env_pathbuf_or_default("ANIMATE_X_ROOT_CODE_DIRECTORY", PathBuf::from("/model_code")),
      executable_or_command: ExecutableOrCommand::Command("python inference_cli.py".to_string()),
      maybe_virtual_env_activation_command: easyenv::get_env_string_optional("ANIMATE_X_VENV_ACTIVATION_COMMAND"),
      maybe_docker_options: None,
      maybe_execution_timeout: None,
    })
  }

  pub async fn execute_inference<'a, 'b>(
    &'a self,
    args: AnimateXInferenceArgs<'b>,
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

    // NB: Hardcoded for now
    command.push_str(" --cfg configs/Animate_X_infer.yaml ");

    command.push_str(" --model_checkpoints_directory ");
    command.push_str(&path_to_string(&args.model_directory));
    command.push_str(" ");
    
    command.push_str(" --image_file ");
    command.push_str(&path_to_string(&args.image_file));
    command.push_str(" ");

    command.push_str(" --pose_directory ");
    command.push_str(&path_to_string(&args.saved_pose_frames_dir));
    command.push_str(" ");

    command.push_str(" --frame_directory ");
    command.push_str(&path_to_string(&args.saved_original_frames_dir));
    command.push_str(" ");

    command.push_str(" --pickle_data_file ");
    command.push_str(&path_to_string(&args.saved_pose_pkl_file));
    command.push_str(" ");

    if let Some(width) = args.width {
      command.push_str(" --width ");
      command.push_str(&width.to_string());
      command.push_str(" ");
    }

    if let Some(height) = args.height {
      command.push_str(" --height ");
      command.push_str(&height.to_string());
      command.push_str(" ");
    }

    if let Some(max_frames) = args.max_frames {
      command.push_str(" --max_frames ");
      command.push_str(&max_frames.to_string());
      command.push_str(" ");
    }

    command.push_str(" --result_filename ");
    command.push_str(&path_to_string(&args.result_filename));
    command.push_str(" ");

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
