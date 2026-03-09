use crate::api::api_types::operation_id::OperationId;
use crate::api::requests::get_operation::http_request::RawResponse;
use crate::credentials::world_labs_api_creds::WorldLabsApiCreds;
use crate::error::filter_world_labs_http_error::filter_world_labs_http_error;
use crate::error::world_labs_error::WorldLabsError;
use crate::error::world_labs_generic_api_error::WorldLabsGenericApiError;
use log::{debug, error};
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
  pub created_at: Option<String>,
  pub updated_at: Option<String>,
  pub expires_at: Option<String>,
  pub error: Option<OperationError>,
  pub metadata: Option<serde_json::Value>,
  /// When done=true and no error, contains the World object.
  pub response: Option<serde_json::Value>,
}

#[derive(Debug, Clone)]
pub struct OperationError {
  pub code: Option<i32>,
  pub message: Option<String>,
}

/// GET /marble/v1/operations/{operation_id}
///
/// Poll the status of an async operation.
/// When `done` is true, `response` contains the World object.
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
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    expires_at: raw.expires_at,
    error: raw.error.map(|e| OperationError {
      code: e.code,
      message: e.message,
    }),
    metadata: raw.metadata,
    response: raw.response,
  })
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::test_utils::get_test_api_key::get_test_api_key;
  use crate::test_utils::setup_test_logging::setup_test_logging;
  use log::LevelFilter;

  #[tokio::test]
  #[ignore]
  async fn test_get_operation() {
    setup_test_logging(LevelFilter::Debug);

    let creds = get_test_api_key().unwrap();

    // Use a known operation_id from a previous generate_world call
    let operation_id = OperationId("1fab3bf1-05a1-4929-907e-c6df07c539e2".to_string());

    let response = get_operation(GetOperationArgs {
      creds: &creds,
      operation_id: &operation_id,
      request_timeout: None,
    }).await.unwrap();

    println!("Operation ID: {}", response.operation_id);
    println!("Done: {}", response.done);
    println!("Created at: {:?}", response.created_at);
    println!("Error: {:?}", response.error);
    println!("Metadata: {:?}", response.metadata);
    println!("Response: {:?}", response.response);

    assert_eq!(1, 2);
  }
}
