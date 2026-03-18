
#[derive(Copy, Clone, Debug)]
pub enum ProcessSingleJobSuccessCase {
  /// Job was successfully completed.
  JobCompleted,

  /// Processing the job was temporarily skipped over due to model file dependencies
  /// not being present on the filesystem of this worker. Another worker might pick
  /// up the job, or we might return to it later ourselves.
  JobTemporarilySkippedFilesAbsent,

  /// The job has a routing tag that doesn't match this container.
  /// This job will never execute on this container.
  JobSkippedForRoutingTagMismatch,

  /// The lock for the job could not be obtained. Another worker might have it.
  /// If that workload fails, we could conceivably pick it up again in the future.
  LockNotObtained,
}
