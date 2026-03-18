use filesys::path_to_string::path_to_string;
use log::debug;
use std::path::Path;
use std::time::Duration;
use subprocess_common::command_runner::command_args::CommandArgs;
use ffmpeg_utils::ffmpeg::ffmpeg_timestamp_from_duration::ffmpeg_timestamp_from_duration;

/// Resample a video's frame rate
/// See: https://trac.ffmpeg.org/wiki/ChangingFrameRate
/// 
/// Trim a video's duration
/// See: https://shotstack.io/learn/use-ffmpeg-to-trim-video/
pub struct FfmpegResampleFpsAndDurationArgs<'a> {
  pub input_video_file: &'a Path,
  pub output_video_file: &'a Path,
  pub fps: usize,
  pub trim_to_duration: Duration,
}

impl CommandArgs for FfmpegResampleFpsAndDurationArgs<'_> {
  fn to_command_string(&self) -> String {
    let mut command = String::new();

    command.push_str(" -i ");
    command.push_str(&path_to_string(self.input_video_file));

    command.push_str(" -t ");
    command.push_str(&ffmpeg_timestamp_from_duration(self.trim_to_duration));
    command.push_str(" ");

    command.push_str(" -filter:v fps=");
    command.push_str(&self.fps.to_string());
    command.push_str(" ");

    command.push_str(&path_to_string(self.output_video_file));

    debug!("ffmpeg arguments: {:?}", &command);

    command
  }
}
