use filesys::path_to_string::path_to_string;
use log::debug;
use std::path::Path;
use subprocess_common::command_runner::command_args::CommandArgs;

/// Resample a video's frame rate
/// See: https://trac.ffmpeg.org/wiki/ChangingFrameRate
pub struct FfmpegResampleFpsArgs<'a> {
  pub input_video_file: &'a Path,
  pub output_video_file: &'a Path,
  pub fps: usize,
}

impl CommandArgs for FfmpegResampleFpsArgs<'_> {
  fn to_command_string(&self) -> String {
    let mut command = String::new();

    command.push_str(" -i ");
    command.push_str(&path_to_string(self.input_video_file));

    command.push_str(" -filter:v fps=");
    command.push_str(&self.fps.to_string());
    command.push_str(" ");

    command.push_str(&path_to_string(self.output_video_file));
    
    debug!("ffmpeg arguments: {:?}", &command);

    command
  }
}
