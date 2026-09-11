use crate::creds::sora_credential_set::SoraCredentialSet;
use crate::error::sora_error::SoraError;
use crate::recipes::image_upload_from_file_with_session_auto_renew::ImageUploadFromFileAutoRenewRequest;
use crate::recipes::maybe_refresh_credentials_on_sora_error::maybe_refresh_credentials_on_sora_error;
use crate::recipes::maybe_upgrade_or_renew_session::maybe_upgrade_or_renew_session;
use crate::requests::common::task_id::TaskId;
use crate::requests::deprecated::job_status::sora_job_status::{get_image_gen_status, StatusRequest, TaskResponse, VideoGenStatusResponse};
use crate::requests::list_classic_tasks::list_classic_tasks::{list_classic_tasks, ListTasksResponse};
use crate::requests::upload::upload_media_from_file::sora_media_upload_from_file;
use anyhow::Error;
use log::{info, warn};
use std::path::Path;

/// Check Sora task statuses with session auto-renewal.
/// If a new sora credential is returned, replace the old one with the new one.
pub async fn list_classic_sora_tasks_with_session_auto_renew(
  credentials: &SoraCredentialSet,
) -> Result<(ListTasksResponse, Option<SoraCredentialSet>), SoraError> {

  let mut maybe_new_creds = maybe_renew_session(&credentials).await?;

  let upgraded_creds = maybe_new_creds.as_ref()
      .unwrap_or_else(|| &credentials);

  let result = list_classic_tasks(&upgraded_creds).await;

  let err = match result {
    Ok(response) => return Ok((response, maybe_new_creds)),
    Err(err) => err,
  };

  warn!("Task status polling failed: {:?}", err);

  // TODO(bt,2025-05-28): This should only be done if the credentials were known to be bad
  let new_creds = maybe_refresh_credentials_on_sora_error(&upgraded_creds, err).await?;

  // TODO(bt,2025-05-28): This should only be done if the credentials were actually refreshed.
  info!("Retrying task polling with new credentials...");

  let result = list_classic_tasks(&new_creds).await?;

  Ok((result, Some(new_creds)))
}

async fn maybe_renew_session(creds: &SoraCredentialSet) -> Result<Option<SoraCredentialSet>, SoraError> {
  if !creds.jwt_bearer_token.is_none() {
    // TODO: Handle JWT expired case as well.
    return Ok(None);
  }
  
  info!("JWT not set. Upgrading credentials...");
  let mut updated_creds = creds.clone();
  
  if let Err(err) = maybe_upgrade_or_renew_session(&mut updated_creds).await {
    warn!("Failed to upgrade or renew session: {:?}", err);
    return Err(err);
  }
  
  Ok(Some(updated_creds))
}
