use std::path::Path;

use filesys::path_to_string::path_to_string;
use subprocess_common::command_runner::command_args::CommandArgs;

pub struct FbxToGltfCommandArgs<'a> {
  pub input_file: &'a Path,
  pub output_directory: &'a Path,

  /// If true, output as one `.glb` binary file. If false, output two files: one `.gltf` and one `.bin` file.
  pub binary: bool,
}

impl CommandArgs for FbxToGltfCommandArgs<'_> {
  fn to_command_string(&self) -> String {
    let mut command = String::new();

    // Verbose flag
    command.push_str(" -v ");

    command.push_str(" -i ");
    command.push_str(&path_to_string(self.input_file));

    command.push_str(" -o ");
    command.push_str(&path_to_string(self.output_directory));

    if self.binary {
      command.push_str(" --binary ");
    }

    command
  }
}
