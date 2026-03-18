use filesys::is_filesystem_full_error::is_filesystem_full_error;

/// Error from processing a single job
#[derive(Debug)]
pub enum ProcessSingleJobError {
  /// For inference jobs that are required to find faces, fail the job
  /// immediately if no face is found. We can also surface the error to
  /// the user in a friendly way.
  /// Example job types: SadTalker, Wav2Lip.
  FaceDetectionFailure,

  /// The filesystem is out of space and we need to free it up.
  FilesystemFull,

  /// The job is invalid (bad state, etc.)
  InvalidJob(anyhow::Error),

  /// The job's keepalive signal has elapsed, so the job needs to be killed.
  /// The keepalive signal is typically for non-premium users only and it
  /// makes sure they're still on the website. It kills jobs they leave
  /// running when they bounce so that we can free up their capacity.
  KeepAliveElapsed,

  /// This is any other kind of error.
  /// It might be important, we just haven't special cased it yet.
  Other(anyhow::Error),

  /// This is a non-special-cased IO Error
  /// It might be important, we just haven't special cased it yet.
  IoError(std::io::Error),

  /// Job underlying resources are missing - model deleted
  ModelDeleted,

  /// The job system is misconfigured.
  /// Retry the job, but mark as a job runner system failure (health check failure).
  JobSystemMisconfiguration(Option<String>),

  /// We hit a feature or a path for this job that has not yet been implemented.
  /// Permanently fail the job.
  NotYetImplemented
}

impl From<std::io::Error> for ProcessSingleJobError {
  fn from(error: std::io::Error) -> Self {
    ProcessSingleJobError::from_io_error(error)
  }
}

impl From<anyhow::Error> for ProcessSingleJobError {
  fn from(error: anyhow::Error) -> Self {
    ProcessSingleJobError::from_anyhow_error(error)
  }
}

impl ProcessSingleJobError {
  pub fn from_io_error(error: std::io::Error) -> Self {
    if is_filesystem_full_error(&error) {
      ProcessSingleJobError::FilesystemFull
    } else {
      ProcessSingleJobError::IoError(error)
    }
  }

  pub fn from_anyhow_error(error: anyhow::Error) -> Self {
    match error.downcast::<std::io::Error>() {
      Ok(io_error) => {
        if is_filesystem_full_error(&io_error) {
          ProcessSingleJobError::FilesystemFull
        } else {
          ProcessSingleJobError::IoError(io_error)
        }
      },
      Err(anyhow_error) => ProcessSingleJobError::Other(anyhow_error),
    }
  }
}
