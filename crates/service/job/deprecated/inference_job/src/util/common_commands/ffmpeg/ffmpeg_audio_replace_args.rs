use std::path::Path;

use filesys::path_to_string::path_to_string;
use subprocess_common::command_runner::command_args::CommandArgs;

pub struct FfmpegAudioReplaceArgs<'a> {
  pub input_video_file: &'a Path,
  pub input_audio_file: &'a Path,
  pub output_video_file: &'a Path,
}

impl CommandArgs for FfmpegAudioReplaceArgs<'_> {
  fn to_command_string(&self) -> String {
    let mut command = String::new();

    command.push_str(" -i ");
    command.push_str(&path_to_string(self.input_video_file));

    command.push_str(" -i ");
    command.push_str(&path_to_string(self.input_audio_file));

    command.push_str(" -c copy ");
    command.push_str(" -map 0:v ");
    command.push_str(" -map 1:a ");

    // NB: Reading on the "shortest" flag:
    //  - https://stackoverflow.com/a/55804507
    //  - https://stackoverflow.com/a/64927381
    //  - https://video.stackexchange.com/a/34928
    //  - https://superuser.com/a/801595
    //command.push_str(" -fflags +shortest ");

    // NB(bt): Actually, +shortest left 4 seconds of trailing audio.
    command.push_str(" -shortest ");

    command.push_str(&path_to_string(self.output_video_file));

    command
  }
}
