use log::{error, info};

use filesys::check_file_exists::check_file_exists;
use subprocess_common::command_runner::command_runner_args::{RunAsSubprocessArgs, StreamRedirection};

use crate::job::job_types::workflow::comfy_ui_dependencies::ComfyDependencies;
use crate::job::job_types::workflow::video_style_transfer::util::video_pathing::VideoPathing;
use crate::util::common_commands::ffmpeg::ffmpeg_audio_replace_args::FfmpegAudioReplaceArgs;

pub struct PostProcessRestoreVideoArgs<'a> {
  pub comfy_deps: &'a ComfyDependencies,
  pub videos: &'a mut VideoPathing,
}

/// NB: Purposefully infallible.
pub fn post_process_restore_audio(
  args: PostProcessRestoreVideoArgs<'_>
) -> () {
  info!("Restoring audio...");

  // Use the original downloaded video if we didn't trim and resample it.
  let input_video_file = args.videos.primary_video.input_video();

  let output_video_fs_path_restored = args.videos
      .primary_video
      .comfy_output_video_path
      .with_extension("_restored.mp4");

  let command_exit_status = args
      .comfy_deps
      .ffmpeg_command_runner
      .run_with_subprocess(RunAsSubprocessArgs {
        args: Box::new(&FfmpegAudioReplaceArgs {
          input_video_file: &args.videos.primary_video.comfy_output_video_path,
          input_audio_file: &input_video_file,
          output_video_file: &output_video_fs_path_restored,
        }),
        stderr: StreamRedirection::None,
        stdout: StreamRedirection::None,
      });

  let mut use_restored_audio = true;

  // NB: Don't fail the entire command if audio restoration fails
  if let Err(err) = check_file_exists(&output_video_fs_path_restored) {
    use_restored_audio = false;
    error!("Audio copy failed: {:?}", err);
  }

  if !command_exit_status.is_success() {
    use_restored_audio = false;
    error!("Audio copy failed: {:?} ; we'll save the non-audio copy.", command_exit_status);
  }

  if use_restored_audio {
    info!("Success generating restored audio file: {:?}", output_video_fs_path_restored);
    args.videos.primary_video.audio_restored_video_path = Some(output_video_fs_path_restored);
  }
}
