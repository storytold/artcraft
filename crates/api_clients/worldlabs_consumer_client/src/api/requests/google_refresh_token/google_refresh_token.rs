use crate::api::api_types::upload_mime_type::UploadMimeType;
use crate::api::common::common_header_values::{ORIGIN_VALUE, REFERER_VALUE};
use crate::credentials::world_labs_bearer_token::WorldLabsBearerToken;
use crate::credentials::world_labs_cookies::WorldLabsCookies;
use crate::credentials::worldlabs_refresh_token::WorldLabsRefreshToken;
use crate::error::world_labs_client_error::WorldLabsClientError;
use crate::error::world_labs_error::WorldLabsError;
use crate::error::world_labs_generic_api_error::WorldLabsGenericApiError;
use crate::error::world_labs_specific_api_error::WorldLabsSpecificApiError;
use http_headers::names::{PRIORITY, SEC_FETCH_DEST, SEC_FETCH_MODE, SEC_FETCH_SITE, SEC_GPC};
use http_headers::values::accept::ACCEPT_ALL;
use http_headers::values::accept_encoding::ACCEPT_ENCODING_GZIP_ETC;
use http_headers::values::accept_language::ACCEPT_LANGUAGE_EN_US;
use http_headers::values::cache_control::CACHE_CONTROL_NO_CACHE;
use http_headers::values::connection::CONNECTION_KEEP_ALIVE;
use http_headers::values::pragma::PRAGMA_NO_CACHE;
use http_headers::values::priority::{PRIORITY_4, PRIORITY_6};
use http_headers::values::sec::{SEC_FETCH_DEST_EMPTY, SEC_FETCH_MODE_CORS, SEC_FETCH_SITE_CROSS_SITE};
use http_headers::values::te::TE_TRAILERS;
use log::{debug, error};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::Duration;
use wreq::header::{ACCEPT, ACCEPT_ENCODING, ACCEPT_LANGUAGE, AUTHORIZATION, CACHE_CONTROL, CONNECTION, CONTENT_LENGTH, CONTENT_TYPE, ORIGIN, PRAGMA, REFERER, TE};
use wreq::multipart::Form;
use wreq::Client;
use wreq_util::Emulation;

/// NB: key is the public API key for WorldLabs
/// https://docs.cloud.google.com/identity-platform/docs/use-rest-api
const URL : &str = "https://securetoken.googleapis.com/v1/token?key=AIzaSyAA88yObUN-0pnXAxcgOrT2exZxFWLW1BI";
pub struct GoogleRefreshTokenArgs<'a> {
  pub refresh_token: &'a WorldLabsRefreshToken,
  pub request_timeout: Option<Duration>,
}

pub struct GoogleRefreshTokenResponse {
  pub bearer_token: WorldLabsBearerToken,
  pub refresh_token: WorldLabsRefreshToken,
}

/// Refresh Access Token for WorldLabs using Google.
pub async fn google_refresh_token(args: GoogleRefreshTokenArgs<'_>) -> Result<GoogleRefreshTokenResponse, WorldLabsError> {
  let client = Client::builder()
      .emulation(Emulation::Firefox143)
      .build()
      .map_err(|err| WorldLabsClientError::WreqClientError(err))?;


  debug!("Requesting URL: {}", URL);

  let mut request_builder = client.post(URL)
      .header(ACCEPT, ACCEPT_ALL)
      .header(ACCEPT_LANGUAGE, ACCEPT_LANGUAGE_EN_US)
      .header(ACCEPT_ENCODING, ACCEPT_ENCODING_GZIP_ETC)
      .header(REFERER, REFERER_VALUE)
      .header(CONNECTION, CONNECTION_KEEP_ALIVE)
      .header(SEC_FETCH_DEST, SEC_FETCH_DEST_EMPTY)
      .header(SEC_FETCH_MODE, SEC_FETCH_MODE_CORS)
      .header(SEC_FETCH_SITE, SEC_FETCH_SITE_CROSS_SITE)
      .header(PRIORITY, PRIORITY_4)
      .header(TE, TE_TRAILERS);

  let mut form = HashMap::new();
  form.insert("grant_type", "refresh_token".to_string());
  form.insert("refresh_token", args.refresh_token.to_raw_string());

  if let Some(timeout) = args.request_timeout {
    request_builder = request_builder.timeout(timeout);
  }

  let http_request = request_builder
      .form(&form)
      .build()
      .map_err(|err| {
        error!("Error building request: {:?}", err);
        WorldLabsClientError::WreqClientError(err)
      })?;

  let response = client.execute(http_request)
      .await
      .map_err(|err| {
        error!("Error during request execution: {:?}", err);
        WorldLabsGenericApiError::WreqError(err)
      })?;

  let status = response.status();

  let response_body = response.text()
      .await
      .map_err(|err| {
        error!("Error reading response body: {:?}", err);
        WorldLabsGenericApiError::WreqError(err)
      })?;

  if !status.is_success() {
    error!("Request returned an error (code {}) : {:?}", status.as_u16(), response_body);

    if response_body.contains("SignatureDoesNotMatch") || response_body.contains("does not match the signature") {
      return Err(WorldLabsSpecificApiError::GoogleUploadSignatureDoesNotMatch.into());
    } else {
      return Err(WorldLabsGenericApiError::GoogleUploadFailed { status_code: status, body: response_body }.into());
    }
  }

  debug!("Response body (200): {}", response_body);

  let response : RawResponse = serde_json::from_str(&response_body)
      .map_err(|err| WorldLabsGenericApiError::SerdeResponseParseErrorWithBody(err, response_body.to_string()))?;

  let bearer_token = WorldLabsBearerToken::new(response.access_token);
  let refresh_token = WorldLabsRefreshToken::new(response.refresh_token);

  Ok(GoogleRefreshTokenResponse {
    bearer_token,
    refresh_token,
  })
}

#[derive(Deserialize)]
struct RawResponse {
  pub access_token: String,
  pub refresh_token: String,

  // eg. "3600"
  pub expires_in: Option<String>,
  pub id_token: Option<String>,
  pub user_id: Option<String>,
}

#[cfg(test)]
mod tests {
  use crate::api::requests::google_refresh_token::google_refresh_token::{google_refresh_token, GoogleRefreshTokenArgs};
  use crate::credentials::worldlabs_refresh_token::WorldLabsRefreshToken;
  use crate::test_utils::setup_test_logging::setup_test_logging;
  use errors::AnyhowResult;
  use log::LevelFilter;

  #[tokio::test]
  #[ignore] // Client side tests only
  async fn test_requests() -> AnyhowResult<()> {
    setup_test_logging(LevelFilter::Debug);

    let refresh_token = "AMf-vByUgA0J9S93vULECe-sD50cbR85AFVYF60gKAmLFF1MBYwXlKRJCsv7z3oSpLtP0ApyOU5fAl52qHWM2U0yKgEu5gQ5UCUDt5SEG4UBRHWvHEmLLcu-Zl04Fq4ljocSEO3qJzuX1wyshmptZxlDPRkjdLYgyn-Kp03woI2yRPKLuQF5hQtABHabsNUh9Zhs129sgxuUlOuw4zsFI4L8UdE3bEuF3k6Mic7KlE3440YwyQ8Qtmk9zHtXIx2ob56N-1WTGSqwMUuQ1mX4OOvLve9bw2zDW3UzchomTWkh732886RPrP-DNRkPbO3FejUEMxuYQFWYX3EEeIEdfNGXFNGPL1dNniSXlSaKadpX699Ishjviv-x9o-pPQa3zoAj3NzWLyd8mn5rDBh9qAO_iDETaeo01Sjhb4mGYfAWZ-g4S6nW778";
    let refresh_token = WorldLabsRefreshToken::new(refresh_token.to_string());

    let result = google_refresh_token(GoogleRefreshTokenArgs {
      refresh_token: &refresh_token,
      request_timeout: None,
    }).await?;

    Ok(())
  }
}
