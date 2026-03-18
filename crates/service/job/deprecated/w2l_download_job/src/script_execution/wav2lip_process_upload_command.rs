use std::error::Error;
use std::fmt;
use std::fmt::Formatter;

use log::{info, warn};
use subprocess::{ExitStatus, Popen, PopenConfig};

use errors::AnyhowResult;

/// The python script uses this exit code when face detection fails.
const FACE_DETECT_FAILURE_CODE : u32 = 5;

/// This command is used to preprocess the face detection frames from user-submitted video.
/// This should only ever need to run once. The frames can then be uploaded to Buckets and saved.
#[derive(Clone)]
pub struct Wav2LipPreprocessClient {
  w2l_directory: String,
  script_name: String,
  checkpoint_path: String,
}

/// Command failure
#[derive(Debug, Copy, Clone)]
pub enum Wav2LipPreprocessError {
  /// Permanent failure
  NoFacesDetected,
  /// Unknown. Retry allowed.
  UnknownError,
}

impl Error for Wav2LipPreprocessError {}

impl fmt::Display for Wav2LipPreprocessError {
  fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
    match self {
      Wav2LipPreprocessError::NoFacesDetected => write!(f, "NoFacesDetected"),
      Wav2LipPreprocessError::UnknownError => write!(f, "UnknownError"),
    }
  }
}

impl Wav2LipPreprocessClient {
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

  pub fn execute(&self,
                 image_or_video_filename: &str,
                 output_cached_faces_filename: &str,
                 output_metadata_filename: &str,
                 is_image: bool,
                 spawn_process: bool) -> Result<(), Wav2LipPreprocessError>
  {
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
    command.push_str(&self.checkpoint_path);
    command.push_str(" --image_or_video_filename ");
    command.push_str(image_or_video_filename);
    command.push_str(" --output_cached_faces_filename ");
    command.push_str(output_cached_faces_filename);
    command.push_str(" --output_metadata_filename ");
    command.push_str(output_metadata_filename);

    if is_image {
      command.push_str(" --is_image ");
    }

    info!("Command: {:?}", command);

    // NB: Got rid of the previous (unused) child process spawning

    let exit_status = match self.do_execute(&command) {
      Err(e) => {
        warn!("Unknown execution error: {:?}", e);
        return Err(Wav2LipPreprocessError::UnknownError);
      },
      Ok(exit_status) => exit_status,
    };

    info!("Exit status: {:?}", exit_status);

    if !exit_status.success() {
      if let ExitStatus::Exited(code) = exit_status {
        if code == FACE_DETECT_FAILURE_CODE {
          // We want to permanently fail retries.
          warn!("Failure to detect faces error code returned. This is a permanent failure.");
          return Err(Wav2LipPreprocessError::NoFacesDetected);
        }
      }
      warn!("Unknown failure reason.");
      return Err(Wav2LipPreprocessError::UnknownError);
    }

    Ok(())
  }

  fn do_execute(&self, command: &str) -> AnyhowResult<ExitStatus> {
    let command_parts = [
      "bash",
      "-c",
      command
    ];

    let mut p = Popen::create(&command_parts, PopenConfig {
      //stdout: Redirection::Pipe,
      //stderr: Redirection::Pipe,
      ..Default::default()
    })?;

    info!("Pid : {:?}", p.pid());

    let exit_status = p.wait()?;

    info!("Exit status: {:?}", exit_status);

    Ok(exit_status)
  }
}
