use crate::creds::sora_credential_set::SoraCredentialSet;
use crate::creds::sora_jwt_bearer_token::SoraJwtBearerToken;
use crate::error::sora_client_error::SoraClientError;
use crate::error::sora_error::SoraError;
use crate::error::sora_specific_api_error::SoraSpecificApiError;
use crate::requests::auth_bearer::generate_bearer_jwt_with_cookie::generate_bearer_jwt_with_cookie;
use anyhow::anyhow;
use log::{error, info, warn};

// TODO: Make other APIs work with this.

pub async fn maybe_refresh_credentials_on_sora_error(creds: &SoraCredentialSet, error: SoraError) -> Result<SoraCredentialSet, SoraError> {

  match error {
    SoraError::Client(SoraClientError::NoBearerTokenForRequest) => {
      error!("Previous request failed due to missing bearer token.");
    }
    SoraError::ApiSpecific(SoraSpecificApiError::UnauthorizedCookieOrBearerExpired) => {
      error!("Previous request failed due to invalid bearer token.");
    }
    _ => {
      error!("Previous request failed due to the following error: {:?}", error);
      return Err(error)
    }
  }

  info!("Generating new JWT bearer token...");

  let cookies = creds.cookies.as_str();
  let response = generate_bearer_jwt_with_cookie(cookies).await;

  let new_bearer = match response {
    Err(err) => {
      error!("Error generating new JWT bearer token: {}", err);
      return Err(err);
    }
    Ok(bearer) => {
      match SoraJwtBearerToken::new(bearer) {
        Err(err) => {
          error!("Error parsing new JWT bearer token: {}", err);
          return Err(err);
        }
        Ok(bearer) => bearer,
      }
    }
  };

  let mut new_creds = creds.clone();

  new_creds.jwt_bearer_token = Some(new_bearer);

  Ok(new_creds)
}
