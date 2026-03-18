use std::path::Path;

use filesys::path_to_string::path_to_string;
use subprocess_common::command_runner::command_args::CommandArgs;

/// Get the dimensions of a video
/// Outputs JSON to the stdout.
pub struct FfprobeGetDimensionsArgs<'a> {
  pub input_video_file: &'a Path,
}

impl CommandArgs for FfprobeGetDimensionsArgs<'_> {
  fn to_command_string(&self) -> String {
    let mut command = String::new();

    command.push_str(" -v error ");
    command.push_str(" -select_streams v:0 ");
    command.push_str(" -show_entries stream=width,height ");
    command.push_str(" -of json ");

    command.push_str(&path_to_string(self.input_video_file));

    command
  }
}
