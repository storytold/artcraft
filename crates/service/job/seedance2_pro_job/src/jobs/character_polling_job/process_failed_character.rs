use log::{error, info, warn};

use mysql_queries::queries::generic_inference::job::mark_job_failed_by_token::{mark_job_failed_by_token, MarkJobFailedByTokenArgs};
use mysql_queries::queries::generic_inference::seedance2pro::list_pending_seedance2pro_character_jobs::PendingSeedance2ProCharacterJob;
use seedance2pro_client::requests::poll_characters::poll_characters::CharacterStatus;

use crate::job_dependencies::JobDependencies;

pub async fn process_failed_character(
  deps: &JobDependencies,
  job: &PendingSeedance2ProCharacterJob,
  character: &CharacterStatus,
) {
  let reason = character.fail_reason
      .as_deref()
      .unwrap_or("unknown failure reason");

  warn!(
    "Character {} (job {}) failed: {}",
    character.character_id, job.job_token.as_str(), reason,
  );

  let internal_reason = format!(
    "Kinovi character creation failed. character_id={}, raw_task_status={}, raw_asset_status={:?}, fail_reason={:?}",
    character.character_id,
    character.raw_task_status,
    character.raw_asset_status,
    character.fail_reason,
  );

  if let Err(err) = mark_job_failed_by_token(MarkJobFailedByTokenArgs {
    pool: &deps.mysql_pool,
    job_token: &job.job_token,
    maybe_public_failure_reason: Some(reason),
    internal_debugging_failure_reason: &internal_reason,
    maybe_frontend_failure_category: None,
  }).await {
    error!(
      "Error marking character job {} as failed: {:?}",
      job.job_token.as_str(), err,
    );
  } else {
    info!("Marked character job {} as failed.", job.job_token.as_str());
  }
}
