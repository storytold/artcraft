use std::fs::OpenOptions;
use std::path::Path;

use log::info;
use subprocess::{Popen, PopenConfig, Redirection};

use errors::AnyhowResult;

/// This command is used to run inference.
/// It uses preprocessed face files so that it's much faster.
#[derive(Clone)]
pub struct Wav2LipInferenceCommand {
  w2l_directory: String,
  script_name: String,
  checkpoint_path: String,
}

impl Wav2LipInferenceCommand {
  pub fn new(
    w2l_directory: &str,
    script_name: &str,
    checkpoint_path: &str,
  ) -> Self {
    Self {
      w2l_directory: w2l_directory.to_string(),
      script_name: script_name.to_string(),
      checkpoint_path: checkpoint_path.to_string(),
    }
  }

  pub fn execute<P: AsRef<Path>>(
    &self,
    checkpoint_path: P,
    audio_filename: P,
    end_bump_video_filename: P,
    media_template_filename: P,
    cached_faces_filename: P,
    output_metadata_filename: P,
    output_video_filename: P,
    is_image: bool,
    spawn_process: bool
  ) -> AnyhowResult<()> {
    let mut command = String::new();

    command.push_str("echo 'test'");
    command.push_str(" && ");
    command.push_str(&format!("cd {}", self.w2l_directory));
    command.push_str(" && ");
    command.push_str("source python/bin/activate");
    command.push_str(" && ");
    command.push_str("python ");
    command.push_str(&self.script_name);
    command.push_str(" --checkpoint_path ");
    command.push_str(&checkpoint_path.as_ref().display().to_string());
    command.push_str(" --image_or_video_filename ");
    command.push_str(&media_template_filename.as_ref().display().to_string());
    command.push_str(" --audio_filename ");
    command.push_str(&audio_filename.as_ref().display().to_string());
    command.push_str(" --end_bump_file ");
    command.push_str(&end_bump_video_filename.as_ref().display().to_string());
    command.push_str(" --cached_faces_filename ");
    command.push_str(&cached_faces_filename.as_ref().display().to_string());
    command.push_str(" --output_video_filename ");
    command.push_str(&output_video_filename.as_ref().display().to_string());
    command.push_str(" --output_metadata_filename ");
    command.push_str(&output_metadata_filename.as_ref().display().to_string());

    if is_image {
      command.push_str(" --is_image ");
    }

    info!("Command: {:?}", command);

    let command_parts = [
      "bash",
      "-c",
      &command
    ];

    if spawn_process {
      // NB: This forks and returns immediately.
      //let _child_pid = command_builder.spawn()?;

      let stdout_file = OpenOptions::new()
        .read(true)
        .write(true)
        .create(true)
        .truncate(true)
        .open("/tmp/wav2lip_upload_stdout.txt")?;

      let stderr_file = OpenOptions::new()
        .read(true)
        .write(true)
        .create(true)
        .truncate(true)
        .open("/tmp/wav2lip_upload_stderr.txt")?;

      let mut p = Popen::create(&command_parts, PopenConfig {
        //stdout: Redirection::Pipe,
        //stderr: Redirection::Pipe,
        stdout: Redirection::File(stdout_file),
        stderr: Redirection::File(stderr_file),
        ..Default::default()
      })?;

      info!("Pid : {:?}", p.pid());

      p.detach();

    } else {
      // NB: This is a blocking call.
      /*let output = command_builder.output()?;

      info!("Output status: {}", output.status);
      info!("Stdout: {:?}", String::from_utf8(output.stdout));
      error!("Stderr: {:?}", String::from_utf8(output.stderr));

      if !output.status.success() {
        bail!("Bad error code: {:?}", output.status);
      }*/

      let mut p = Popen::create(&command_parts, PopenConfig {
        //stdout: Redirection::Pipe,
        //stderr: Redirection::Pipe,
        ..Default::default()
      })?;

      info!("Pid : {:?}", p.pid());

      let exit_status = p.wait()?;

      info!("Exit status: {:?}", exit_status);
    }

    Ok(())
  }
}
