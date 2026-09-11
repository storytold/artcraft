use crate::creds::sora_credential_set::SoraCredentialSet;
use crate::creds::sora_jwt_bearer_token::SoraJwtBearerToken;
use crate::creds::sora_sentinel::SoraSentinel;
use crate::error::sora_error::SoraError;
use crate::requests::auth_bearer::generate_bearer_jwt_with_cookie::generate_bearer_jwt_with_cookie;
use crate::requests::auth_sentinel::generate_sentinel_token::generate_sentinel_token;
use crate::requests::auth_sentinel_2::generate_sentinel_token_2::generate_sentinel_token_2;
use chrono::{DateTime, TimeDelta, Utc};
use errors::AnyhowResult;
use log::info;
use std::ops::Sub;

const JWT_EXPIRATION_DEADLINE: TimeDelta = TimeDelta::hours(12);

/// Call this at session startup to generate the tokens for the first time.
/// Call this periodically to refresh the JWT as it nears its expiration date.
/// This will not refresh the sentinel token once it's been generated - we can use other flows to accomplish that.
#[deprecated(note="The sentinel appears to be going away. Use `maybe_renew_session_jwt` instead for newer '2.0' code.")]
pub async fn maybe_upgrade_or_renew_session(sora_credentials: &mut SoraCredentialSet) -> Result<bool, SoraError> {
  let mut refresh_jwt = !sora_credentials.jwt_bearer_token.is_some();
  
  if let Some(jwt) = &sora_credentials.jwt_bearer_token {
    let now = Utc::now();
    let refresh_deadline = now.sub(JWT_EXPIRATION_DEADLINE);
    if jwt.jwt_claims().expiration.lt(&now) {
      info!("JWT expiration time has elapsed.");
      refresh_jwt = true;
    } else if jwt.jwt_claims().expiration.lt(&refresh_deadline) {
      info!("JWT expiration time is under the expiration deadline.");
      refresh_jwt = true;
    }
  }

  let mut credential_updated = false;

  if refresh_jwt {
    info!("Refreshing JWT...");
    let cookies = sora_credentials.cookies.as_str();
    let token = generate_bearer_jwt_with_cookie(cookies).await?;

    info!("Parsing JWT bearer token.");
    let token = SoraJwtBearerToken::new(token)?;
    sora_credentials.jwt_bearer_token = Some(token);
    credential_updated = true;
  }

  //let refresh_sentinel = !sora_credentials.sora_sentinel.is_some();
  //if refresh_sentinel {
  //  info!("Generating new sentinel...");
  //  let token = generate_sentinel_token().await?;
  //  let token = SoraSentinel::new(token);
  //  sora_credentials.sora_sentinel = Some(token);
  //  credential_updated = true;
  //}

  let refresh_sentinel_token = sora_credentials.sora_sentinel_token
      .as_ref()
      .map(|t| t.is_expired())
      .unwrap_or(true);
  
  if refresh_sentinel_token {
    info!("Refreshing sentinel token...");
    let token = generate_sentinel_token_2().await?;
    sora_credentials.sora_sentinel = Some(SoraSentinel::new(token.to_request_header_json()?)); // Legacy
    sora_credentials.sora_sentinel_token = Some(token); // New
    credential_updated = true;
  }

  Ok(credential_updated)
}
