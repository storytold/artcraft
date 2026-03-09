use crate::api::api_types::operation_id::OperationId;
use crate::credentials::world_labs_api_creds::WorldLabsApiCreds;
use crate::error::filter_world_labs_http_error::filter_world_labs_http_error;
use crate::error::world_labs_error::WorldLabsError;
use crate::error::world_labs_generic_api_error::WorldLabsGenericApiError;
use log::{debug, error};
use serde::Deserialize;
use std::time::Duration;
use wreq::Client;

const BASE_URL: &str = "https://api.worldlabs.ai/marble/v1/operations";

pub struct GetOperationArgs<'a> {
  pub creds: &'a WorldLabsApiCreds,
  pub operation_id: &'a OperationId,
  pub request_timeout: Option<Duration>,
}

pub struct GetOperationResponse {
  pub operation_id: String,
  pub done: bool,
  pub error: Option<OperationError>,
  pub response: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct OperationError {
  pub code: Option<i32>,
  pub message: Option<String>,
}

pub async fn get_operation(args: GetOperationArgs<'_>) -> Result<GetOperationResponse, WorldLabsError> {
  let client = Client::new();

  let url = format!("{}/{}", BASE_URL, args.operation_id.as_str());

  debug!("Requesting URL: {}", url);

  let mut request_builder = client.get(&url)
    .header("WLT-Api-Key", args.creds.api_key());

  if let Some(timeout) = args.request_timeout {
    request_builder = request_builder.timeout(timeout);
  }

  let response = request_builder.send()
    .await
    .map_err(|err| {
      error!("Error during get_operation request: {:?}", err);
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
    error!("get_operation returned error (code {}): {:?}", status.as_u16(), response_body);
  }

  filter_world_labs_http_error(status, Some(&response_body))?;

  debug!("Response body (200): {}", response_body);

  let raw: RawResponse = serde_json::from_str(&response_body)
    .map_err(|err| WorldLabsGenericApiError::SerdeResponseParseErrorWithBody(err, response_body.to_string()))?;

  Ok(GetOperationResponse {
    operation_id: raw.operation_id,
    done: raw.done.unwrap_or(false),
    error: raw.error,
    response: raw.response,
  })
}

#[derive(Deserialize)]
struct RawResponse {
  pub operation_id: String,
  pub done: Option<bool>,
  pub error: Option<OperationError>,
  pub response: Option<serde_json::Value>,
}
