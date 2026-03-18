use std::path::Path;

use filesys::path_to_string::path_to_string;
use subprocess_common::command_runner::command_args::CommandArgs;

pub struct FfmpegAudioTruncateArgs<'a> {
  pub input_audio_file: &'a Path,
  pub output_audio_file: &'a Path,
  pub truncate_seconds: usize,
}

impl CommandArgs for FfmpegAudioTruncateArgs<'_> {

  // eg. ffmpeg -i input-audio.aac -t 15 -c copy output.aac
  // time is in seconds
  fn to_command_string(&self) -> String {
    let mut command = String::new();

    command.push_str(" -i ");
    command.push_str(&path_to_string(self.input_audio_file));

    command.push_str(" -t ");
    command.push_str(format!(" {} ", self.truncate_seconds).as_str());

    command.push_str(" -c copy ");

    command.push_str(&path_to_string(self.output_audio_file));

    command
  }
}
