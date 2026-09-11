use crate::creds::sora_credential_set::SoraCredentialSet;
use crate::error::sora_error::SoraError;
use crate::error::sora_specific_api_error::SoraSpecificApiError;
use crate::recipes::maybe_refresh_credentials_on_sora_error::maybe_refresh_credentials_on_sora_error;
use crate::requests::upload::upload_media_from_file::sora_media_upload_from_file;
use crate::requests::upload::upload_media_http_request::upload_media_http_request;
use crate::requests::upload::upload_media_http_response::SoraMediaUploadResponse;
use log::{info, warn};
use std::path::Path;
use std::time::Duration;

pub struct ImageUploadFromFileAutoRenewRequest<'a, P: AsRef<Path>> {
  pub file_path: P,
  pub credentials: &'a SoraCredentialSet,
  
  /// This function can try to upload several times. This is the timeout for *individual* requests.
  pub request_timeout: Option<Duration>,
}

/// Image upload with retry and session auto-renewal.
/// If a new sora credential is returned, replace the old one with the new one.
pub async fn image_upload_from_file_with_session_auto_renew<P: AsRef<Path>>(
  request: ImageUploadFromFileAutoRenewRequest<'_, P>
) -> Result<(SoraMediaUploadResponse, Option<SoraCredentialSet>), SoraError> {

  let result = sora_media_upload_from_file(
    request.file_path.as_ref().clone(), // FIXME(bt): This is horrible, but the client needs to take ownership. :(
    request.credentials,
    /// This function can try to upload several times. This is the timeout for *individual* requests.
    request.request_timeout,
  ).await;

  let err = match result {
    Ok(response) => return Ok((response, None)),
    // We can't retry some errors.
    Err(err @ SoraError::ApiSpecific(SoraSpecificApiError::SoraUsernameNotYetCreated)) => return Err(err),
    // Retry all other errors.
    Err(err) => err,
  };

  warn!("Image upload failed: {:?}", err);

  let new_creds = maybe_refresh_credentials_on_sora_error(request.credentials, err).await?;

  info!("Retrying image upload with new credentials...");

  let result = sora_media_upload_from_file(
    request.file_path,
    &new_creds,
    request.request_timeout,
  ).await?;

  Ok((result, Some(new_creds)))
}

