use crate::creds::sora_credential_set::SoraCredentialSet;
use crate::creds::sora_jwt_bearer_token::SoraJwtBearerToken;
use crate::error::sora_error::SoraError;
use crate::requests::auth_bearer::generate_bearer_jwt_with_cookie::generate_bearer_jwt_with_cookie;
use chrono::{TimeDelta, Utc};
use log::{info, warn};
use std::io::Write;
use std::ops::Sub;

const EXPIRATION_DEADLINE : TimeDelta = TimeDelta::hours(12);

/// Returns a new set of credentials if they were updated, or None if no update was needed.
pub async fn maybe_renew_session_jwt(creds: &SoraCredentialSet) -> Result<Option<SoraCredentialSet>, SoraError> {
  let mut refresh_jwt = false;
  
  match creds.jwt_bearer_token.as_ref() {
    None => {
      info!("JWT not set. It needs to be generated...");
      refresh_jwt = true;
    }
    Some(jwt) => {
      let now = Utc::now();
      let refresh_deadline = now.sub(EXPIRATION_DEADLINE);
      if jwt.jwt_claims().expiration.lt(&now) {
        info!("JWT expiration time has elapsed. It needs to be renewed...");
        refresh_jwt = true;
      } else if jwt.jwt_claims().expiration.lt(&refresh_deadline) {
        info!("JWT expiration time is under the expiration deadline. It needs to be renewed...");
        refresh_jwt = true;
      }
    }
  }
  
  if !refresh_jwt {
    return Ok(None);
  }

  info!("Refreshing JWT...");
  let token = generate_bearer_jwt_with_cookie(creds.cookies.as_str()).await?;

  info!("Parsing JWT bearer token...");
  let token = SoraJwtBearerToken::new(token)?;

  let mut updated_creds = creds.clone();
  updated_creds.jwt_bearer_token = Some(token);
  
  Ok(Some(updated_creds))
}
