use crate::creds::sora_credential_set::SoraCredentialSet;
use crate::creds::sora_jwt_bearer_token::SoraJwtBearerToken;
use crate::error::sora_error::SoraError;
use crate::requests::auth_bearer::generate_bearer_jwt_with_cookie::generate_bearer_jwt_with_cookie;
use chrono::{DateTime, TimeDelta, Utc};
use log::{info, warn};
use std::io::Write;

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
      if jwt_needs_renewal(jwt.jwt_claims().expiration, Utc::now()) {
        info!("JWT has expired or is about to. It needs to be renewed...");
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

/// True when the JWT has expired, or will expire within `EXPIRATION_DEADLINE`.
fn jwt_needs_renewal(expiration: DateTime<Utc>, now: DateTime<Utc>) -> bool {
  // FIX: the deadline used to be `now - 12h`, so "expires within the deadline" could only be true for a token that had
  // already expired. A token a few minutes from expiry was used as-is and the request could fail with a 401.
  let refresh_deadline = now + EXPIRATION_DEADLINE;
  expiration < refresh_deadline
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn an_expired_token_needs_renewal() {
    let now = Utc::now();
    assert!(jwt_needs_renewal(now - TimeDelta::minutes(1), now));
  }

  #[test]
  fn a_token_about_to_expire_needs_renewal() {
    let now = Utc::now();
    assert!(jwt_needs_renewal(now + TimeDelta::minutes(5), now));
    assert!(jwt_needs_renewal(now + TimeDelta::hours(11), now));
  }

  #[test]
  fn a_token_with_plenty_of_time_left_is_kept() {
    let now = Utc::now();
    assert!(!jwt_needs_renewal(now + TimeDelta::hours(13), now));
    assert!(!jwt_needs_renewal(now + TimeDelta::days(9), now));
  }
}
