use crate::creds::sora_credential_set::SoraCredentialSet;
use crate::creds::sora_jwt_bearer_token::SoraJwtBearerToken;
use crate::creds::sora_sentinel::SoraSentinel;
use crate::error::sora_error::SoraError;
use crate::error::sora_generic_api_error::SoraGenericApiError;
use crate::error::sora_specific_api_error::SoraSpecificApiError;
use crate::requests::auth_bearer::generate_bearer_jwt_with_cookie::generate_bearer_jwt_with_cookie;
use crate::requests::auth_sentinel::generate_sentinel_token::generate_sentinel_token;
use crate::requests::image_gen::common::{ImageSize, NumImages, SoraImageGenResponse};
use crate::requests::image_gen::sora_image_gen_remix::{sora_image_gen_remix, SoraImageGenRemixRequest};
use anyhow::anyhow;
use errors::AnyhowResult;
use log::{error, info, warn};
use std::time::Duration;

pub struct ImageRemixAutoRenewRequest<'a> {
  pub prompt: String,
  pub num_images: NumImages,
  pub image_size: ImageSize,
  pub sora_media_tokens: Vec<String>,
  pub credentials: &'a SoraCredentialSet,
  /// This function can try several different requests. This is the timeout for *individual* requests.
  pub request_timeout: Option<Duration>,
}

/// Image request with retry and session auto-renewal.
/// If a new sora credential is returned, replace the old one with the new one.
pub async fn image_remix_with_session_auto_renew(request: ImageRemixAutoRenewRequest<'_>) -> Result<(SoraImageGenResponse, Option<SoraCredentialSet>), SoraError> {
  let result = sora_image_gen_remix(SoraImageGenRemixRequest {
    prompt: request.prompt.clone(), // NB: Clone because used again
    num_images: request.num_images,
    image_size: request.image_size,
    sora_media_tokens: request.sora_media_tokens.clone(), // NB: Clone because used again
    credentials: request.credentials,
    request_timeout: request.request_timeout,
  }).await;

  let err = match result {
    Ok(response) => return Ok((response, None)),
    Err(err) => err,
  };

  warn!("Image generation failed: {:?}", err);

  let mut refresh_jwt = false;
  let mut refresh_sentinel = false;

  match err {
    // We'll specifically fail these non-retryable requests...

    SoraError::ApiSpecific(SoraSpecificApiError::TooManyConcurrentTasks) |
    SoraError::ApiSpecific(SoraSpecificApiError::SoraUsernameNotYetCreated) => {
      error!("Non-retryable image generation error: {:?}", err);
      return Err(err);
    }

    // We'll retry these requests...

    SoraError::ApiSpecific(SoraSpecificApiError::SentinelBlockError) => {
      warn!("Image generation failed due to sentinel block error: {:?}", err);
      refresh_sentinel = true;
    }
    SoraError::ApiSpecific(SoraSpecificApiError::TokenExpiredError) => {
      warn!("Image generation failed due to token expired error: {:?}", err);
      refresh_sentinel = true; // TODO: Not sure what this error is, actually.
      refresh_jwt = true;
    }
    SoraError::ApiSpecific(SoraSpecificApiError::InvalidJwt) => {
      warn!("Image generation failed due to invalid jwt error: {:?}", err);
      refresh_jwt = true;
    }
    SoraError::ApiSpecific(SoraSpecificApiError::UnauthorizedCookieOrBearerExpired) => {
      warn!("Image generation failed due to auth error (nb: this is a legacy error): {:?}", err);
      refresh_jwt = true;
      refresh_sentinel = true;
    }

    // We'll fail everything else eagerly...

    _ => {
      error!("Image generation error: {:?}", err);
      return Err(err);
    }
  }

  let mut new_bearer = None;

  if refresh_jwt {
    info!("Generating new JWT bearer token...");
    let cookies = request.credentials.cookies.as_str();
    let response = generate_bearer_jwt_with_cookie(cookies).await;
    match response {
      Err(err) => {
        return Err(SoraGenericApiError::UncategorizedBadResponse(format!("failed to generate new JWT bearer token: {:?}", err)).into())
      }
      Ok(bearer) => {
        match SoraJwtBearerToken::new(bearer) {
          Err(err) => {
            return Err(SoraGenericApiError::UncategorizedBadResponse(format!("Failed to parse new JWT bearer token: {:?}", err)).into());
          }
          Ok(bearer) => new_bearer = Some(bearer),
        }
      },
    }
  }

  let mut new_sentinel = None;

  if refresh_sentinel {
    info!("Generating new sentinel...");
    let response = generate_sentinel_token().await;
    match response {
      Err(err) => {
        return Err(SoraGenericApiError::UncategorizedBadResponse(format!("failed to generate new sentinel: {:?}", err)).into())
      }
      Ok(sentinel) => new_sentinel = Some(SoraSentinel::new(sentinel)),
    }
  }

  let mut new_creds = request.credentials.clone();

  if let Some(bearer) = new_bearer {
    new_creds.jwt_bearer_token = Some(bearer);
  }

  if let Some(sentinel) = new_sentinel {
    new_creds.sora_sentinel = Some(sentinel);
  }

  // Now try again...

  let result = sora_image_gen_remix(SoraImageGenRemixRequest {
    prompt: request.prompt,
    num_images: request.num_images,
    image_size: request.image_size,
    sora_media_tokens: request.sora_media_tokens,
    credentials: &new_creds,
    request_timeout: request.request_timeout,
  }).await?;
  
  Ok((result, Some(new_creds)))
}
