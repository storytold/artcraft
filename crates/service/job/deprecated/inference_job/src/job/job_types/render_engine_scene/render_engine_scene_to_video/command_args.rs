use std::path::Path;

use filesys::path_to_string::path_to_string;
use subprocess_common::command_runner::command_args::CommandArgs;

pub struct RenderEngineSceneToVideoCommandArgs<'a> {
    pub input_file: &'a Path,
    pub output_directory: &'a Path,
    pub maybe_camera: Option<&'a str>,
    pub maybe_camera_speed: Option<f32>,
    pub maybe_skybox: Option<&'a str>,
}

impl CommandArgs for RenderEngineSceneToVideoCommandArgs<'_> {
    fn to_command_string(&self) -> String {
        let mut command = String::new();

        command.push_str(" -i ");
        command.push_str(&path_to_string(self.input_file));

        command.push_str(" -o ");
        command.push_str(&path_to_string(self.output_directory));

        if let Some(camera) = self.maybe_camera {
            command.push_str(" -c ");
            command.push_str(camera);
            command.push_str(" ");
        }

        if let Some(camera_speed) = self.maybe_camera_speed {
            command.push_str(" -s ");
            command.push_str(&camera_speed.to_string());
            command.push_str(" ");
        }

        if let Some(skybox) = self.maybe_skybox {
            command.push_str(" -b ");
            command.push_str(skybox);
            command.push_str(" ");
        }

        command
    }
}
