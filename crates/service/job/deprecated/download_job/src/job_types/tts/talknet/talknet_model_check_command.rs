use std::fs::OpenOptions;
use std::path::Path;

use log::info;
use subprocess::{Popen, PopenConfig, Redirection};

use errors::AnyhowResult;

/// This command is used to check talknet for being a real model
#[derive(Clone)]
pub struct TalknetModelCheckCommand {
  talknet_directory: String,
  check_model_script_name: String,
}

impl TalknetModelCheckCommand {
  pub fn new(
    talknet_directory: &str,
    check_model_script_name: &str,
  ) -> Self {
    Self {
      talknet_directory: talknet_directory.to_string(),
      check_model_script_name: check_model_script_name.to_string(),
    }
  }

  pub fn execute<P: AsRef<Path>>(
    &self,
    synthesizer_checkpoint_path: P,
    output_metadata_filename: P,
    spawn_process: bool
  ) -> AnyhowResult<()> {
    let mut command = String::new();

    command.push_str("echo 'test'");
    command.push_str(" && ");
    command.push_str(&format!("cd {}", self.talknet_directory));
    command.push_str(" && ");
    command.push_str("source python/bin/activate");
    command.push_str(" && ");
    command.push_str("python ");
    command.push_str(&self.check_model_script_name);
    command.push_str(" --synthesizer_checkpoint_path ");
    command.push_str(&synthesizer_checkpoint_path.as_ref().display().to_string());
    command.push_str(" --output_metadata_filename ");
    command.push_str(&output_metadata_filename.as_ref().display().to_string());

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
          .open("/tmp/talknet_upload_stdout.txt")?;

      let stderr_file = OpenOptions::new()
          .read(true)
          .write(true)
          .create(true)
          .truncate(true)
          .open("/tmp/talknet_upload_stderr.txt")?;

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
