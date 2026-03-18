use std::io::Write;
use std::path::{Path, PathBuf};
use std::process::Command;

use anyhow::bail;
use log::{error, info};

use errors::AnyhowResult;
use filesys::path_to_string::path_to_string;
use ffmpeg_utils::ffprobe::ffprobe_get_info::{ffprobe_get_info, VideoDimensions, VideoDuration};

use crate::http_server::endpoints::media_files::upload::upload_studio_shot::frame_type::FrameType;

pub struct OutputFile {
  pub path: PathBuf,
  pub dimensions: Option<VideoDimensions>,
  pub duration: Option<VideoDuration>,
}

pub fn ffmpeg_frames_to_mp4(frame_input_directory: &Path, frame_type: FrameType, frame_rate: u8) -> AnyhowResult<OutputFile> {
  let glob_pattern = match frame_type {
    FrameType::Png => format!("{}/*.png", path_to_string(frame_input_directory)),
    FrameType::Jpg => format!("{}/*.jpg", path_to_string(frame_input_directory)),
  };

  let output_file_path = frame_input_directory.join("output.mp4");

  info!("Calling ffmpeg to convert frames to mp4...");

  // ffmpeg -framerate 30 -pattern_type glob -i '*.png' \
  // -c:v libx264 -pix_fmt yuv420p out.mp4
  let output = Command::new("ffmpeg")
      .arg("-framerate")
      .arg(format!("{}", frame_rate))
      .arg("-pattern_type")
      .arg("glob")
      .arg("-i")
      .arg(glob_pattern)
      .arg("-c:v")
      .arg("libx264")
      .arg("-pix_fmt")
      .arg("yuv420p")
      .arg(&output_file_path)
      .output()?;

  if !output.status.success() {
    error!("bad exit status: {}", output.status);

    let _r = std::io::stdout().write_all(&output.stdout);
    let _r = std::io::stderr().write_all(&output.stderr);

    bail!("ffmpeg failed: {:?}", output.status.to_string());
  }

  let info = ffprobe_get_info(&output_file_path)?;

  Ok(OutputFile {
    path: output_file_path,
    duration: info.duration,
    dimensions: info.dimensions,
  })
}
