use crate::api::api_types::run_object::RunObject;
use crate::api::api_types::run_object_id::RunObjectId;
use crate::api::common::common_header_values::{ORIGIN_VALUE, REFERER_VALUE};
use crate::credentials::world_labs_bearer_token::WorldLabsBearerToken;
use crate::credentials::world_labs_cookies::WorldLabsCookies;
use crate::error::world_labs_client_error::WorldLabsClientError;
use crate::error::world_labs_error::WorldLabsError;
use crate::error::world_labs_generic_api_error::WorldLabsGenericApiError;
use crate::error::world_labs_specific_api_error::WorldLabsSpecificApiError;
use chrono::Utc;
use http_headers::names::{PRIORITY, SEC_FETCH_DEST, SEC_FETCH_MODE, SEC_FETCH_SITE, SEC_GPC};
use http_headers::values::accept::ACCEPT_ALL;
use http_headers::values::cache_control::CACHE_CONTROL_NO_CACHE;
use http_headers::values::connection::CONNECTION_KEEP_ALIVE;
use http_headers::values::content_type::CONTENT_TYPE_APPLICATION_JSON;
use http_headers::values::pragma::PRAGMA_NO_CACHE;
use http_headers::values::priority::PRIORITY_HIGHEST;
use http_headers::values::sec::{SEC_FETCH_DEST_EMPTY, SEC_FETCH_MODE_CORS, SEC_FETCH_SITE_CROSS_SITE};
use http_headers::values::te::TE_TRAILERS;
use log::{debug, error};
use serde::{Deserialize, Serialize};
use std::time::Duration;
use wreq::header::{ACCEPT, ACCEPT_ENCODING, ACCEPT_LANGUAGE, AUTHORIZATION, CACHE_CONTROL, CONNECTION, CONTENT_TYPE, ORIGIN, PRAGMA, REFERER, TE};
use wreq::Client;
use wreq_util::Emulation;

const URL : &str = "https://api.worldlabs.ai/api/v1/objects";

// Note: WorldLabs is phasing out the old URL scheme:
// const URL : &str = "https://marble2-kgw-prod-iac1.wlt-ai.art/api/v1/objects";

pub struct CreateRunObjectArgs<'a> {
  pub cookies: &'a WorldLabsCookies,
  pub bearer_token: &'a WorldLabsBearerToken,
  pub request_timeout: Option<Duration>,
}

pub struct CreateRunObjectResponse {
  pub id: RunObjectId,
  pub run_object: RunObject,
}

/// Marble Image-to-World
/// This request starts the process: it initializes a new world object inference and returns the object id.
/// Request #1 (of ~10)
pub async fn create_run_object(args: CreateRunObjectArgs<'_>) -> Result<CreateRunObjectResponse, WorldLabsError> {
  let client = Client::builder()
      .emulation(Emulation::Firefox143)
      .build()
      .map_err(|err| WorldLabsClientError::WreqClientError(err))?;

  debug!("Requesting URL: {}", URL);

  let mut request_builder = client.post(URL)
      .header(ACCEPT, ACCEPT_ALL)
      .header(ACCEPT_LANGUAGE, "en-US,en;q=0.5")
      .header(ACCEPT_ENCODING, "gzip, deflate, br, zstd")
      .header(REFERER, REFERER_VALUE)
      .header(CONTENT_TYPE, CONTENT_TYPE_APPLICATION_JSON)
      .header(AUTHORIZATION, args.bearer_token.to_bearer_token_header_string())
      .header(ORIGIN, ORIGIN_VALUE)
      .header(SEC_GPC, "1")
      .header(CONNECTION, CONNECTION_KEEP_ALIVE)
      .header(SEC_FETCH_DEST, SEC_FETCH_DEST_EMPTY)
      .header(SEC_FETCH_MODE, SEC_FETCH_MODE_CORS)
      .header(SEC_FETCH_SITE, SEC_FETCH_SITE_CROSS_SITE)
      .header(PRIORITY, PRIORITY_HIGHEST)
      .header(PRAGMA, PRAGMA_NO_CACHE)
      .header(CACHE_CONTROL, CACHE_CONTROL_NO_CACHE)
      .header(TE, TE_TRAILERS);

  if let Some(timeout) = args.request_timeout {
    request_builder = request_builder.timeout(timeout);
  }

  let new_run_object = RunObject::default();

  let http_request = request_builder.json(&new_run_object)
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

  let response : RunObject = serde_json::from_str(&response_body)
      .map_err(|err| WorldLabsGenericApiError::SerdeResponseParseErrorWithBody(err, response_body.to_string()))?;

  let run_id = match &response.id {
    Some(id) => RunObjectId(id.to_string()),
    None => {
      return Err(WorldLabsSpecificApiError::NoRunIdInResponse { response_body }.into())
    }
  };

  Ok(CreateRunObjectResponse {
    id: run_id,
    run_object: response,
  })
}
