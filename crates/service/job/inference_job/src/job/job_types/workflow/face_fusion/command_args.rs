use std::path::Path;

use filesys::path_to_string::path_to_string;
use subprocess_common::command_runner::command_args::CommandArgs;

#[derive(Debug)]
pub struct FaceFusionCommandArgs<'a> {
  pub audio_file: &'a Path,

  /// This file can be either an image or a video
  pub image_or_video_file: &'a Path,

  /// If true, the input file is an image. If false, the input file is a video.
  pub input_is_image: bool,

  pub tempdir: &'a Path,
  pub output_file: &'a Path,

  pub stderr_output_file: &'a Path,
  pub stdout_output_file: &'a Path,
}

impl CommandArgs for FaceFusionCommandArgs<'_> {
  fn to_command_string(&self) -> String {
    let mut command = String::new();

    command.push_str(" --input_audio ");
    command.push_str(&path_to_string(self.audio_file));

    command.push_str(" --input_video ");
    command.push_str(&path_to_string(self.image_or_video_file));

    command.push_str(" --tmpdir ");
    command.push_str(&path_to_string(self.tempdir));

    command.push_str(" --output ");
    command.push_str(&path_to_string(self.output_file));

    // if self.input_is_image {
    //   command.push_str(" --input-is-image ");
    // }

    command.push_str(" ");

    command
  }
}
