use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::users::google_sso::google_sso_handler::GoogleCreateAccountRequest;
use crate::state::certs::google_sign_in_cert::GoogleSignInCert;
use google_sign_in::claims::claims::Claims;
use google_sign_in::decode_and_verify_token_claims::decode_and_verify_token_claims;
use google_sign_in::VerificationOptions;
use log::warn;
use std::collections::HashSet;

pub async fn check_claims(
  request: &GoogleCreateAccountRequest,
  google_sign_in_cert: &GoogleSignInCert,
) -> Result<Claims, CommonWebError> {
  let keys = google_sign_in_cert.fetch_key_map(false)
      .await
      .map_err(|e| {
        warn!("error downloading google certs: {:?}", e);
        CommonWebError::from_anyhow_error(e)
      })?;

  let verification_options = Some(build_options());

  let claims = match decode_and_verify_token_claims(&keys, &request.google_credential, verification_options) {
    Ok(claims) => claims,
    Err(err) => {
      warn!("error decoding google token claims (will retry certs): {:?}", err);

      let keys = google_sign_in_cert.fetch_key_map(true) // NB: REFRESH
          .await
          .map_err(|e| {
            warn!("error refreshing google certs: {:?}", e);
            CommonWebError::from_anyhow_error(e)
          })?;

      let verification_options = Some(build_options());

      let claims = decode_and_verify_token_claims(&keys, &request.google_credential, verification_options)
          .map_err(|e| {
            warn!("error decoding google token claims: {:?}", e);
            // The detailed error is logged above; the user-facing message is intentionally
            // generic so we don't leak JWT internals.
            CommonWebError::BadInputWithSimpleMessage("invalid google credential".to_string())
          })?;

      claims
    },
  };

  Ok(claims)
}

// TODO(bt,2024-09-22): Make this configurable via env vars.
fn build_options() -> VerificationOptions {
  VerificationOptions {
    allowed_issuers: Some(HashSet::from([
      "https://accounts.google.com".to_string(),
      "accounts.google.com".to_string(),
    ])),
    allowed_audiences: Some(HashSet::from([
      "788843034237-uqcg8tbgofrcf1to37e1bqphd924jaf6.apps.googleusercontent.com".to_string(),
    ])),
    ..Default::default()
  }
}
