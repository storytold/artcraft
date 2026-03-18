use std::fs::OpenOptions;

use log::info;
use subprocess::{Popen, PopenConfig, Redirection};

use errors::AnyhowResult;

/// This command is used to generate ffmpeg previews for videos.
#[derive(Clone)]
pub struct FfmpegGeneratePreviewVideoCommand;

impl FfmpegGeneratePreviewVideoCommand {
  pub fn new() -> Self {
    Self {
    }
  }

  pub fn execute(&self,
                 input_video_filename: &str,
                 output_video_filename: &str,
                 output_width: u32,
                 output_height: u32,
                 looping: bool,
                 spawn_process: bool) -> AnyhowResult<()>
  {
    let mut command = String::new();

    let dimensions = format!("{}x{}", output_width, output_height);

    command.push_str("echo 'test'");
    command.push_str(" && ");
    command.push_str("ffmpeg");
    command.push_str(" -i ");
    command.push_str(&input_video_filename);
    command.push_str(" -lossless 0 ");
    command.push_str(" -ss 00:00:00 ");
    command.push_str(" -t 00:00:03 ");
    command.push_str(" -s ");
    command.push_str(&dimensions);

    if looping {
      command.push_str(" -loop 0 "); // NB: -loop 1 disables looping
    }

    command.push_str(" "); // NB: no arg flag for output filename
    command.push_str(&output_video_filename);

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
        .open("/tmp/ffmpeg_stdout.txt")?;

      let stderr_file = OpenOptions::new()
        .read(true)
        .write(true)
        .create(true)
        .truncate(true)
        .open("/tmp/ffmpeg_stderr.txt")?;

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
