use anyhow::bail;
use log::{error, info};
use std::io::Write;
use std::path::Path;
use std::process::Command;

use errors::AnyhowResult;

pub struct FfmpegVideoGifPreviewArgs<I: AsRef<Path>, O: AsRef<Path>> {
  pub input_video_path: I,
  pub output_gif_path: O,
}

/// Extract a short animated GIF preview from a video file.
///
/// Takes the first 5 seconds, resampled to 10 fps, scaled to 360px wide
/// (preserving aspect ratio), with an optimized color palette.
pub fn ffmpeg_video_gif_preview<I: AsRef<Path>, O: AsRef<Path>>(
  args: FfmpegVideoGifPreviewArgs<I, O>,
) -> AnyhowResult<()> {
  let mut command = Command::new("ffmpeg");

  command
      .arg("-nostdin")
      .arg("-y")
      .arg("-ss").arg("0")
      .arg("-to").arg("5")
      .arg("-i").arg(args.input_video_path.as_ref())
      .arg("-filter_complex")
      .arg("fps=10,scale=360:-1[s]; [s]split[a][b]; [a]palettegen[palette]; [b][palette]paletteuse")
      .arg(args.output_gif_path.as_ref());

  info!("Calling ffmpeg (gif preview)...");

  let output = command.output()?;

  if !output.status.success() {
    error!("bad exit status: {}", output.status);

    let _r = std::io::stdout().write_all(&output.stdout);
    let _r = std::io::stderr().write_all(&output.stderr);

    bail!("ffmpeg gif preview failed: {:?}", output.status.to_string());
  }

  Ok(())
}

#[cfg(test)]
mod tests {
  use super::*;
  use tempdir::TempDir;
  use testing::test_file_path::test_file_path;

  #[test]
  fn test_extract_gif_preview_from_mp4() {
    let input_path = test_file_path("test_data/video/mp4/golden_sun_garoh.mp4")
        .expect("test video should exist");

    let temp_dir = TempDir::new_in("/tmp", "ffmpeg_gif_preview_test")
        .expect("should create temp dir");

    let output_path = temp_dir.path().join("preview.gif");

    ffmpeg_video_gif_preview(FfmpegVideoGifPreviewArgs {
      input_video_path: &input_path,
      output_gif_path: &output_path,
    }).expect("ffmpeg should succeed");

    assert!(output_path.exists(), "output gif should exist");

    // The input video is 640x480. scale=360:-1 should produce 360x270
    // (maintaining 4:3 aspect ratio).
    // Use ffprobe to verify the GIF dimensions.
    let result = ffprobe::ffprobe(&output_path)
        .expect("ffprobe should succeed");

    let video_stream = result.streams.iter()
        .find(|s| s.codec_type.as_deref() == Some("video"))
        .expect("should have a video stream");

    assert_eq!(video_stream.width, Some(360));
    assert_eq!(video_stream.height, Some(270));
  }
}
