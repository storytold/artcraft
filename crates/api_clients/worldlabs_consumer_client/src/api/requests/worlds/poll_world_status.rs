use crate::api::api_types::run_object_id::RunObjectId;
use crate::api::api_types::upload_mime_type::UploadMimeType;
use crate::api::api_types::upload_object_id::UploadObjectId;
use crate::api::api_types::world_id::WorldObjectId;
use crate::api::common::common_header_values::{ORIGIN_VALUE, REFERER_VALUE};
use crate::credentials::world_labs_bearer_token::WorldLabsBearerToken;
use crate::credentials::world_labs_cookies::WorldLabsCookies;
use crate::error::world_labs_client_error::WorldLabsClientError;
use crate::error::world_labs_error::WorldLabsError;
use crate::error::world_labs_generic_api_error::WorldLabsGenericApiError;
use chrono::Utc;
use http_headers::names::{PRIORITY, SEC_FETCH_DEST, SEC_FETCH_MODE, SEC_FETCH_SITE, SEC_GPC};
use http_headers::values::accept::ACCEPT_ALL;
use http_headers::values::cache_control::CACHE_CONTROL_NO_CACHE;
use http_headers::values::connection::CONNECTION_KEEP_ALIVE;
use http_headers::values::content_type::CONTENT_TYPE_APPLICATION_JSON;
use http_headers::values::pragma::PRAGMA_NO_CACHE;
use http_headers::values::priority::PRIORITY_4;
use http_headers::values::sec::{SEC_FETCH_DEST_EMPTY, SEC_FETCH_MODE_CORS, SEC_FETCH_SITE_CROSS_SITE};
use http_headers::values::te::TE_TRAILERS;
use log::{debug, error, info};
use serde::{Deserialize, Serialize};
use std::time::Duration;
use uuid::Uuid;
use wreq::header::{ACCEPT, ACCEPT_ENCODING, ACCEPT_LANGUAGE, AUTHORIZATION, CACHE_CONTROL, CONNECTION, CONTENT_LENGTH, CONTENT_TYPE, ORIGIN, PRAGMA, REFERER, TE};
use wreq::Client;
use wreq_util::Emulation;

const BASE_URL : &str = "https://api.worldlabs.ai/api/v1/worlds";

// Note: WorldLabs is phasing out the old URL scheme:
// const BASE_URL : &str = "https://marble2-kgw-prod-iac1.wlt-ai.art/api/v1/worlds";

fn get_url(world_id: &WorldObjectId) -> String {
  format!("{}/{}", BASE_URL, world_id.0)
}

pub struct PollWorldStatusArgs<'a> {
  pub cookies: &'a WorldLabsCookies,
  pub bearer_token: &'a WorldLabsBearerToken,
  pub world_id: &'a WorldObjectId,
  pub request_timeout: Option<Duration>,
}

pub struct PollWorldStatusResponse {
  pub is_complete: bool,
  pub spz_splat_url: Option<String>,
}

/// Marble Image-to-World
/// Poll the world generation status
/// Request #10 (of ~10)
pub async fn poll_world_status(args: PollWorldStatusArgs<'_>) -> Result<PollWorldStatusResponse, WorldLabsError> {
  let client = Client::builder()
      .emulation(Emulation::Firefox143)
      .build()
      .map_err(|err| WorldLabsClientError::WreqClientError(err))?;

  let url = get_url(args.world_id);

  info!("Polling World: {}", url);

  let mut request_builder = client.get(url)
      .header(ACCEPT, ACCEPT_ALL)
      .header(ACCEPT_LANGUAGE, "en-US,en;q=0.5")
      .header(ACCEPT_ENCODING, "gzip, deflate, br, zstd")
      .header(REFERER, REFERER_VALUE)
      .header(AUTHORIZATION, args.bearer_token.to_bearer_token_header_string())
      .header(ORIGIN, ORIGIN_VALUE)
      .header(SEC_GPC, "1")
      .header(CONNECTION, CONNECTION_KEEP_ALIVE)
      .header(SEC_FETCH_DEST, SEC_FETCH_DEST_EMPTY)
      .header(SEC_FETCH_MODE, SEC_FETCH_MODE_CORS)
      .header(SEC_FETCH_SITE, SEC_FETCH_SITE_CROSS_SITE)
      .header(PRIORITY, PRIORITY_4)
      .header(PRAGMA, PRAGMA_NO_CACHE)
      .header(CACHE_CONTROL, CACHE_CONTROL_NO_CACHE)
      .header(CONTENT_LENGTH, 0)
      .header(TE, TE_TRAILERS);

  if let Some(timeout) = args.request_timeout {
    request_builder = request_builder.timeout(timeout);
  }

  let http_request = request_builder
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

  // TODO: Handle errors (Cloudflare, Grok, etc.)
  if !status.is_success() {
    error!("Request returned an error (code {}) : {:?}", status.as_u16(), response_body);
    //return Err(classify_general_http_status_code_and_body(status, response_body));
    return Err(WorldLabsGenericApiError::UncategorizedBadResponseWithStatusAndBody { status_code: status, body: response_body}.into())
  }

  debug!("Response body (200): {}", response_body);

  let response : RawResponse = serde_json::from_str(&response_body)
      .map_err(|err| WorldLabsGenericApiError::SerdeResponseParseErrorWithBody(err, response_body.to_string()))?;

  debug!("World status: {}", response.status);
  
  let maybe_spz_url = response.generation_output
      .map(|out| out.spz_urls.full_res);
  
  Ok(PollWorldStatusResponse {
    is_complete: maybe_spz_url.is_some(),
    spz_splat_url: maybe_spz_url,
  })
}

#[derive(Deserialize)]
struct RawResponse {
  /// eg. "INITIALIZING", "SUCCEEDED", etc.
  pub status: String,
  
  pub generation_output: Option<GenerationOutput>,
}

#[derive(Deserialize)]
struct GenerationOutput {
  pub spz_urls: SpzUrls,
  
}

#[derive(Deserialize)]
struct SpzUrls {
  // eg. https://cdn.marble.worldlabs.ai/d60cfa21-5506-43de-9a9c-0707fc17a5ec/1002dd35-fcad-4eeb-ba15-0d113c1778d8_ceramic.spz
  pub full_res: String,
}

#[cfg(test)]
mod tests {
  use crate::api::api_types::world_id::WorldObjectId;
  use crate::api::requests::worlds::poll_world_status::{get_url, poll_world_status, PollWorldStatusArgs};
  use crate::test_utils::get_test_bearer_token::get_test_bearer_token;
  use crate::test_utils::get_test_cookies::get_typed_test_cookies;
  use crate::test_utils::setup_test_logging::setup_test_logging;
  use log::LevelFilter;

  #[test]
  fn test_get_url() {
    let world_id = WorldObjectId("d60cfa21-5506-43de-9a9c-0707fc17a5ec".to_string());
    let expected = "https://marble2-kgw-prod-iac1.wlt-ai.art/api/v1/worlds/d60cfa21-5506-43de-9a9c-0707fc17a5ec";
    assert_eq!(get_url(&world_id), expected);
  }

  #[tokio::test]
  #[ignore] // Client side tests only
  async fn test_requests() {
    setup_test_logging(LevelFilter::Debug);

    let cookies = get_typed_test_cookies().unwrap();
    let bearer_token = get_test_bearer_token().unwrap();

    let world_id = WorldObjectId("403c379b-b7d2-4449-8f1e-ebdb56142604".to_string());

    let response = poll_world_status(PollWorldStatusArgs {
      cookies: &cookies,
      bearer_token: &bearer_token,
      world_id: &world_id,
      request_timeout: None,
    }).await.unwrap();

    println!("Is complete: {}", response.is_complete);
    println!("Spz Url: {}", response.spz_splat_url.unwrap_or_else(|| "incomplete".to_string()));

    assert_eq!(1, 2);
  }

  #[tokio::test]
  #[ignore] // Client side tests only
  async fn test_request_2() {
    setup_test_logging(LevelFilter::Debug);

    let cookies = get_typed_test_cookies().unwrap();
    let bearer_token = get_test_bearer_token().unwrap();

    let world_id = WorldObjectId("e739b11e-6039-49c7-b73d-b79e1b28e295".to_string());

    let response = poll_world_status(PollWorldStatusArgs {
      cookies: &cookies,
      bearer_token: &bearer_token,
      world_id: &world_id,
      request_timeout: None,
    }).await.unwrap();

    println!("Is complete: {}", response.is_complete);
    println!("Spz Url: {}", response.spz_splat_url.unwrap_or_else(|| "incomplete".to_string()));

    assert_eq!(1, 2);
  }
}
