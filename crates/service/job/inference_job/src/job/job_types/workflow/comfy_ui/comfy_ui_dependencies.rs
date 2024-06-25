use std::path::PathBuf;
use std::time::{Duration, Instant};
use reqwest::StatusCode;

use tokio::process::Command;
use tokio::time::sleep;
use easyenv::get_env_string_optional;

use errors::AnyhowResult;

use crate::job::job_types::workflow::comfy_ui::video_style_transfer::comfy_ui_inference_command::ComfyInferenceCommand;
use crate::util::common_commands::ffmpeg_command_runner::FfmpegCommandRunner;
use crate::util::common_commands::ffmpeg_logo_watermark_command::FfmpegLogoWatermarkCommand;

pub struct ComfyDependencies {
    pub inference_command: ComfyInferenceCommand,
    pub ffmpeg_watermark_command: FfmpegLogoWatermarkCommand,
    pub ffmpeg_command_runner: FfmpegCommandRunner,
    pub configs: ComfyConfigs,
}

/// NB: These are used for logging and debugging by the art team
pub struct ComfyConfigs {
    /// Version of Yae's workflow
    /// Not functional. Used for logging and debugging by the art team.
    pub main_workflow: Option<String>,
    /// Version of Yae's face detailer workflow
    /// Not functional. Used for logging and debugging by the art team.
    pub face_detailer_workflow: Option<String>,
    /// Version of Yae's upscaler workflow
    /// Not functional. Used for logging and debugging by the art team.
    pub upscaler_workflow: Option<String>,
}

impl ComfyDependencies {
    pub async fn setup() -> AnyhowResult<Self> {
        let inference_command = ComfyInferenceCommand::from_env()?;
        let comfy_setup_script = inference_command.clone().comfy_setup_script;
        let output = Command::new("python3")
            .arg(&comfy_setup_script)
            .output()
            .await.expect("failed to run comfyui setup script");
        println!("stdout: {}", String::from_utf8_lossy(&output.stdout));

        // Start the comfy start script as a daemon process
        let launch_command = format!(
            "cd {} && {}",
            inference_command.clone().comfy_root_code_directory.display(),
            inference_command.clone().comfy_launch_command.display()
        );

        match inference_command.clone().comfy_startup_healthcheck_enabled {
            true => {
                let _ = Command::new("sh")
                    .arg("-c")
                    .arg(&launch_command)
                    .stdout(std::process::Stdio::inherit())  // Inherit the stdout to stream the output
                    .spawn()
                    .expect("failed to start comfy start script");

                let mut success = false;

                let client = reqwest::Client::new();
                let start = Instant::now();
                let timeout = Duration::from_secs(60);
                while Instant::now().duration_since(start) < timeout {
                    let response = client.get("http://127.0.0.1:8188/prompt").send().await;
                    match response {
                        Ok(r) if r.status() == StatusCode::OK => {
                            println!("Received 200 response from http://127.0.0.1:8188/prompt");
                            success = true;
                            break;
                        },
                        _ => {
                            println!("Did not receive 200 response, retrying...");
                            sleep(Duration::from_secs(5)).await;
                        }
                    }
                }

                if !success {
                    println!("Timeout reached without receiving a 200 response.");
                    panic!("Comfy start failed");
                }
            },
            false => {
                println!("Skipping Comfy server healthcheck");
            }
        }

        Ok(Self {
            inference_command,
            ffmpeg_watermark_command: FfmpegLogoWatermarkCommand::from_env()?,
            ffmpeg_command_runner: FfmpegCommandRunner::from_env()?,
            configs: ComfyConfigs {
                main_workflow: get_env_string_optional("MAIN_IPA_WORKFLOW"),
                face_detailer_workflow: get_env_string_optional("FACE_DETAILER_WORKFLOW"),
                upscaler_workflow: get_env_string_optional("UPSCALER_WORKFLOW"),
            },
        })
    }
}


pub struct ComfyDependency {
    pub(crate) location: PathBuf,
    pub(crate) url: String,
}