use errors::AnyhowResult;
use crate::job_dependencies::JobDependencies;

/// Download the completed splat, upload to bucket, create media file record, and mark job done.
pub async fn process_successful_job(
  _deps: &JobDependencies,
) -> AnyhowResult<()> {
  // TODO: Implement WorldLabs splat download and processing.
  todo!("WorldLabs process_successful_job not yet implemented")
}
