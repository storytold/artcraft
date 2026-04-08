use anyhow::bail;
use log::{error, info};
use std::io::Write;
use std::path::Path;
use std::process::Command;

use errors::AnyhowResult;

pub struct FfmpegTranscodeToMp4Args<'a> {
  pub video_input_path: &'a Path,
  pub video_output_path: &'a Path,
}

/// Transcode an arbitrary input video into a streaming-friendly H.264 / AAC
/// MP4 file.
///
/// Output container: MP4 (faststart-enabled so the moov atom lives at the
/// front, which makes the file usable by HTTP range-request video players
/// before the whole thing has downloaded).
///
/// Output streams:
///   - video: H.264 (libx264), yuv420p, CRF 23, "fast" preset
///   - audio: AAC (libfdk-aac unavailable in stock ffmpeg → libmp3lame? no →
///     plain `aac`), 128 kbps
///
/// Audio is transcoded rather than copied so the output is consistent
/// regardless of the input container's audio codec.
pub fn ffmpeg_transcode_to_mp4(args: FfmpegTranscodeToMp4Args) -> AnyhowResult<()> {
  let mut command = Command::new("ffmpeg");

  command
      .arg("-nostdin")
      .arg("-y")
      .arg("-i").arg(args.video_input_path)
      // Video: H.264, broadly compatible chroma subsampling.
      .arg("-c:v").arg("libx264")
      .arg("-preset").arg("fast")
      .arg("-crf").arg("23")
      .arg("-pix_fmt").arg("yuv420p")
      // Audio: AAC at 128 kbps.
      .arg("-c:a").arg("aac")
      .arg("-b:a").arg("128k")
      // MP4 container with the moov atom moved to the front for fast HTTP streaming.
      .arg("-movflags").arg("+faststart")
      .arg(args.video_output_path);

  info!("Calling ffmpeg (transcode to mp4)...");

  let output = command.output()?;

  if !output.status.success() {
    error!("bad exit status: {}", output.status);

    let _r = std::io::stdout().write_all(&output.stdout);
    let _r = std::io::stderr().write_all(&output.stderr);

    bail!("ffmpeg transcode to mp4 failed: {:?}", output.status.to_string());
  }

  Ok(())
}

#[cfg(test)]
mod tests {
  use super::*;
  use tempdir::TempDir;
  use test_utils::test_file_path::test_file_path;

  #[test]
  fn test_transcode_mov_to_mp4() {
    let input_path = test_file_path("test_data/video/mov/majoras_mask_intro.mov")
        .expect("test video should exist");

    let temp_dir = TempDir::new_in("/tmp", "ffmpeg_transcode_to_mp4_test")
        .expect("should create temp dir");

    let output_path = temp_dir.path().join("transcoded.mp4");

    ffmpeg_transcode_to_mp4(FfmpegTranscodeToMp4Args {
      video_input_path: &input_path,
      video_output_path: &output_path,
    }).expect("ffmpeg should succeed");

    // ── Output file exists and is non-empty ───────────────────────────────
    assert!(output_path.exists(), "output mp4 should exist");
    let metadata = std::fs::metadata(&output_path).expect("should stat output");
    assert!(metadata.len() > 0, "output mp4 should be non-empty");

    // ── ffprobe the output and assert codecs / container ──────────────────
    let probe = ffprobe::ffprobe(&output_path)
        .expect("ffprobe should succeed on the transcoded file");

    // Container is mp4 — ffprobe reports it as either "mov,mp4,m4a,3gp,3g2,mj2"
    // or "mp4" depending on version. Both contain "mp4".
    let format_name = &probe.format.format_name;
    assert!(
      format_name.contains("mp4"),
      "expected mp4 container, got format_name = {:?}",
      format_name,
    );

    // Video stream is H.264.
    let video_stream = probe.streams.iter()
        .find(|s| s.codec_type.as_deref() == Some("video"))
        .expect("should have a video stream");
    assert_eq!(
      video_stream.codec_name.as_deref(),
      Some("h264"),
      "expected H.264 video, got {:?}",
      video_stream.codec_name,
    );
    assert_eq!(
      video_stream.pix_fmt.as_deref(),
      Some("yuv420p"),
      "expected yuv420p pixel format, got {:?}",
      video_stream.pix_fmt,
    );

    // Audio stream is AAC (if the source has audio — Majora's Mask intro does).
    let audio_stream = probe.streams.iter()
        .find(|s| s.codec_type.as_deref() == Some("audio"))
        .expect("should have an audio stream");
    assert_eq!(
      audio_stream.codec_name.as_deref(),
      Some("aac"),
      "expected AAC audio, got {:?}",
      audio_stream.codec_name,
    );

    // Sanity-check that the video has non-zero dimensions / duration.
    assert!(video_stream.width.unwrap_or(0) > 0, "video should have width > 0");
    assert!(video_stream.height.unwrap_or(0) > 0, "video should have height > 0");
  }
}
