use anyhow::bail;
use log::{error, info};
use std::io::Write;
use std::path::Path;
use std::process::Command;

use errors::AnyhowResult;

pub struct FfmpegVideoFirstFrameToJpgThumbnailArgs<I: AsRef<Path>, O: AsRef<Path>> {
  pub input_video_path: I,
  pub output_jpg_path: O,
}

/// Extract a single JPG frame from a video file, scaled down to fit within
/// 320x320 while preserving aspect ratio.
///
/// Uses `-sseof -1` to seek 1 second before the end of the file, which avoids
/// potentially-black first frames.
pub fn ffmpeg_video_first_frame_to_jpg_thumbnail<I: AsRef<Path>, O: AsRef<Path>>(
  args: FfmpegVideoFirstFrameToJpgThumbnailArgs<I, O>,
) -> AnyhowResult<()> {
  let mut command = Command::new("ffmpeg");

  command
      .arg("-nostdin")
      .arg("-y")
      .arg("-sseof").arg("-1")
      .arg("-i").arg(args.input_video_path.as_ref())
      .arg("-vf").arg("scale=320:320:force_original_aspect_ratio=decrease")
      .arg("-vframes").arg("1")
      .arg(args.output_jpg_path.as_ref());

  info!("Calling ffmpeg (jpg thumbnail)...");

  let output = command.output()?;

  if !output.status.success() {
    error!("bad exit status: {}", output.status);

    let _r = std::io::stdout().write_all(&output.stdout);
    let _r = std::io::stderr().write_all(&output.stderr);

    bail!("ffmpeg jpg thumbnail failed: {:?}", output.status.to_string());
  }

  Ok(())
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::ffprobe::ffprobe_get_dimensions::ffprobe_get_dimensions;
  use tempdir::TempDir;
  use testing::test_file_path::test_file_path;

  #[test]
  fn test_extract_jpg_thumbnail_from_mp4() {
    let input_path = test_file_path("test_data/video/mp4/golden_sun_garoh.mp4")
        .expect("test video should exist");

    let temp_dir = TempDir::new_in("/tmp", "ffmpeg_jpg_thumb_test")
        .expect("should create temp dir");

    let output_path = temp_dir.path().join("thumbnail.jpg");

    ffmpeg_video_first_frame_to_jpg_thumbnail(FfmpegVideoFirstFrameToJpgThumbnailArgs {
      input_video_path: &input_path,
      output_jpg_path: &output_path,
    }).expect("ffmpeg should succeed");

    assert!(output_path.exists(), "output jpg should exist");

    // The input video is 640x480. scale=320:320:force_original_aspect_ratio=decrease
    // should produce 320x240 (maintaining 4:3 aspect ratio).
    let dimensions = ffprobe_get_dimensions(&output_path)
        .expect("ffprobe should succeed")
        .expect("dimensions should not be empty");

    assert_eq!(dimensions.width, 320);
    assert_eq!(dimensions.height, 240);
  }
}
