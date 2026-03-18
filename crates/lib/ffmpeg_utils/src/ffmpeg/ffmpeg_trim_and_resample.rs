use anyhow::bail;
use log::{error, info};
use std::io::Write;
use std::path::Path;
use std::process::Command;
use std::time::Duration;

use errors::AnyhowResult;
use crate::ffmpeg::ffmpeg_timestamp_from_duration::ffmpeg_timestamp_from_duration;

pub struct Args<'a> {
  pub video_input_path: &'a Path,
  pub video_output_path: &'a Path,
  pub maybe_new_frame_rate: Option<u8>,
  pub maybe_start_offset: Option<Duration>,
  pub maybe_end_offset: Option<Duration>,
}

pub fn ffmpeg_trim_and_resample(args: Args<'_>) -> AnyhowResult<()> {

  let maybe_start_offset = args.maybe_start_offset
      .map(|duration| ffmpeg_timestamp_from_duration(duration));

  let maybe_end_offset = args.maybe_end_offset
      .map(|duration| ffmpeg_timestamp_from_duration(duration));

  let maybe_new_frame_rate = args.maybe_new_frame_rate
      .map(|fps| format!("{}", fps));

  let mut command= Command::new("ffmpeg");

  command.arg("-i").arg(&args.video_input_path);

  if let Some(start_offset) = maybe_start_offset.as_deref() {
    // ffmpeg -ss 00:01:00 -to 00:02:00 -i input.mp4 -c copy output.mp4
    // ffmpeg -i movie.mp4 -ss 00:00:03 -t 00:00:08 -async 1 cut.mp4

    command.arg("-ss").arg(start_offset);

    if let Some(end_offset) = maybe_end_offset.as_deref() {
      command.arg("-to").arg(end_offset);
    }
  }

  if let Some(frame_rate) = maybe_new_frame_rate.as_deref() {
    // ffmpeg -i input.mov -r 24 -y output.mov
    // See also: https://stackoverflow.com/questions/45462731/using-ffmpeg-to-change-framerate
    // See also: https://trac.ffmpeg.org/wiki/ChangingFrameRate
    // We might also want to use video filter, eg:
    //     ffmpeg -i input -vf fps=14,crop=480:360:20:0,scale=256:-1 output
    command.arg("-r").arg(frame_rate);
  }

  info!("Calling ffmpeg...");

  let output = command
      .arg(&args.video_output_path)
      .output()?;

  if !output.status.success() {
    error!("bad exit status: {}", output.status);

    let _r = std::io::stdout().write_all(&output.stdout);
    let _r = std::io::stderr().write_all(&output.stderr);

    bail!("ffmpeg failed: {:?}", output.status.to_string());
  }

  Ok(())
}
