use std::path::Path;

use filesys::path_to_string::path_to_string;
use subprocess_common::command_runner::command_args::CommandArgs;

pub struct FfmpegExtractAudioArgs<'a> {
    pub input_video_file: &'a Path,
    pub output_file: &'a Path,
}

impl CommandArgs for FfmpegExtractAudioArgs<'_> {
    fn to_command_string(&self) -> String {
        let mut command = String::new();
        command.push_str(" -y ");

        // Kasisnu(2021-09-29): inspiration - https://stackoverflow.com/a/63237888/1250138
        // ffmpeg -i input.mov -map 0:a -c copy output.mov
        command.push_str(" -i ");
        command.push_str(&path_to_string(self.input_video_file));

        command.push_str(" -map 0:a ");

        command.push_str(&path_to_string(self.output_file));

        command
    }
}
