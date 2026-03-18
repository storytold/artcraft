use log::{error, info};

use filesys::check_file_exists::check_file_exists;

use crate::job::job_types::workflow::comfy_ui_dependencies::ComfyDependencies;
use crate::job::job_types::workflow::video_style_transfer::util::video_pathing::VideoPathing;
use crate::util::common_commands::ffmpeg::old::ffmpeg_logo_watermark_command::WatermarkArgs;

pub struct PostProcessAddWatermarkArgs<'a> {
  pub comfy_deps: &'a ComfyDependencies,
  pub videos: &'a mut VideoPathing,
}

/// NB: Purposefully infallible.
pub fn post_process_add_watermark(
  args: PostProcessAddWatermarkArgs<'_>
) -> () {
  // TODO(bt, 2024-03-01): Interrogate account for premium
  // TODO(bt, 2024-04-21): Combine this ffmpeg processing with the previous step

  info!("Adding watermark...");

  let output_video_fs_path_watermark = args.videos
      .primary_video
      .comfy_output_video_path
      .with_extension("_watermark.mp4");

  let command_exit_status = args.comfy_deps
      .ffmpeg_watermark_command
      .execute(WatermarkArgs {
        video_path: args.videos.primary_video.video_to_watermark(),
        maybe_override_logo_path: None,
        alpha: 0.6,
        scale: 0.1, // NB: 0.1 is good for the Storyteller logo @ 2653x512 placed on 1024x576 output.
        output_path: &output_video_fs_path_watermark,
      });

  let mut use_watermarked_file = true;

  // NB: Don't fail the entire command if watermarking fails.
  if let Err(err) = check_file_exists(&output_video_fs_path_watermark) {
    use_watermarked_file = false;
    error!("Watermarking failed: {:?}", err);
  }

  if !command_exit_status.is_success() {
    use_watermarked_file = false;
    error!("Watermark failed: {:?} ; we'll save the non-watermarked copy.", command_exit_status);
  }

  if use_watermarked_file {
    info!("Success generating watermarked file: {:?}", output_video_fs_path_watermark);
    args.videos.primary_video.watermarked_video_path = Some(output_video_fs_path_watermark);
  }
}
