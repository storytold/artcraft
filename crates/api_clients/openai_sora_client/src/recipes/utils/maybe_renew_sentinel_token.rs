use crate::creds::sora_credential_set::SoraCredentialSet;
use crate::creds::sora_sentinel_token::SoraSentinelToken;
use crate::error::sora_error::SoraError;
use crate::requests::auth_sentinel_2::generate_sentinel_token_2::generate_sentinel_token_2;
use log::info;

/// Returns a new sentinel token if one was generated, or None if no update was needed.
pub async fn maybe_renew_sentinel_token(creds: &SoraCredentialSet) -> Result<Option<SoraCredentialSet>, SoraError> {
  let mut refresh_sentinel = false;
  
  match creds.sora_sentinel_token.as_ref() {
    None => {
      info!("Sentinel token not set. It needs to be generated...");
      refresh_sentinel = true;
    }
    Some(sentinel) => {
      let expired = sentinel.is_expired();
      if expired {
        info!("Sentinel token is expired. It needs to be renewed...");
        refresh_sentinel = true;
      }
    }
  }
  
  if !refresh_sentinel {
    return Ok(None);
  }

  let sentinel = generate_sentinel_token_2().await?;
  
  let mut new_creds = creds.clone();
  new_creds.sora_sentinel_token = Some(sentinel);
  
  Ok(Some(new_creds))
}
