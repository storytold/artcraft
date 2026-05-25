use crate::certs::jwk_to_public_key::jwk_to_public_key;
use crate::certs::key_map::KeyMap;
use crate::error::google_sign_in_error::GoogleSignInError;

/// https://developers.google.com/identity/gsi/web/guides/verify-google-id-token
/// "These keys are regularly rotated; examine the Cache-Control header in
///  the response to determine when you should retrieve them again."
const GOOGLE_CERTS_URL : &str = "https://www.googleapis.com/oauth2/v3/certs";

pub async fn download_cert_key_set() -> Result<KeyMap, GoogleSignInError> {
  let certs = download_certs().await?;
  let key_map = jwk_to_public_key(&certs)?;
  Ok(key_map)
}

pub async fn download_certs() -> Result<String, GoogleSignInError> {
  let response = reqwest::get(GOOGLE_CERTS_URL)
    .await
    .map_err(GoogleSignInError::CertDownloadHttpError)?;

  if !response.status().is_success() {
    return Err(GoogleSignInError::CertDownloadBadStatus(response.status()));
  }

  let body = response.text()
    .await
    .map_err(GoogleSignInError::CertDownloadHttpError)?;

  Ok(body)
}
