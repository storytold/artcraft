/// Error from processing a single job
#[derive(Debug)]
pub enum ProcessSingleJobError {
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
 
  /// We hit a feature or a path for this job that has not yet been implemented.
  /// Permanently fail the job.
  NotYetImplemented
}
