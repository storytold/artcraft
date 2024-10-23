use anyhow::anyhow;
use log::{error, info};

use subprocess_common::command_runner::command_runner_args::{RunAsSubprocessArgs, StreamRedirection};

use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job::job_types::workflow::comfy_ui_dependencies::ComfyDependencies;
use crate::job::job_types::workflow::video_style_transfer::util::video_pathing::VideoPathing;
use crate::util::common_commands::ffmpeg::ffmpeg_extract_audio_args::FfmpegExtractAudioArgs;

pub struct ProcessSaveAudioArgs<'a> {
    pub comfy_deps: &'a ComfyDependencies,
    pub videos: &'a mut VideoPathing,
}

pub fn preprocess_save_audio(
    args: ProcessSaveAudioArgs<'_>
) -> Result<(), ProcessSingleJobError> {
    info!("Extracting audio...");

    // Use the original downloaded video if we didn't trim and resample it.
    let input_video_file = args.videos.primary_video.input_video();

    let command_exit_status = args
        .comfy_deps
        .ffmpeg_command_runner
        .run_with_subprocess(RunAsSubprocessArgs {
            args: Box::new(&FfmpegExtractAudioArgs {
                input_video_file,
                output_file: &args.videos.primary_video.trimmed_wav_audio_path
            }),
            stderr: StreamRedirection::None,
            stdout: StreamRedirection::None,
        });

    if !command_exit_status.is_success() {
        error!("Audio extraction failed: {:?}", command_exit_status);
        return Err(ProcessSingleJobError::Other(anyhow!("Command failed: {:?}", command_exit_status)));
    }
    Ok(())
}
