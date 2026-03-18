use crate::api::api_types::world_id::WorldId;
use crate::api::requests::delete_world::http_request::RawResponse;
use crate::credentials::world_labs_api_creds::WorldLabsApiCreds;
use crate::error::filter_world_labs_http_error::filter_world_labs_http_error;
use crate::error::world_labs_error::WorldLabsError;
use crate::error::world_labs_generic_api_error::WorldLabsGenericApiError;
use log::{debug, error};
use std::time::Duration;
use wreq::Client;

const BASE_URL: &str = "https://api.worldlabs.ai/marble/v1/worlds";

pub struct DeleteWorldArgs<'a> {
  pub creds: &'a WorldLabsApiCreds,
  pub world_id: &'a WorldId,
  pub request_timeout: Option<Duration>,
}

pub struct DeleteWorldResponse {
  pub world_id: WorldId,
  pub deleted: bool,
}

/// DELETE /marble/v1/worlds/{world_id}
///
/// Permanently delete a world and its assets. Only the owner can delete.
pub async fn delete_world(args: DeleteWorldArgs<'_>) -> Result<DeleteWorldResponse, WorldLabsError> {
  let client = Client::new();

  let url = format!("{}/{}", BASE_URL, args.world_id.as_str());

  debug!("Requesting URL: {}", url);

  let mut request_builder = client.delete(&url)
    .header("WLT-Api-Key", args.creds.api_key());

  if let Some(timeout) = args.request_timeout {
    request_builder = request_builder.timeout(timeout);
  }

  let response = request_builder.send()
    .await
    .map_err(|err| {
      error!("Error during delete_world request: {:?}", err);
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
    error!("delete_world returned error (code {}): {:?}", status.as_u16(), response_body);
  }

  filter_world_labs_http_error(status, Some(&response_body))?;

  debug!("Response body (200): {}", response_body);

  let raw: RawResponse = serde_json::from_str(&response_body)
    .map_err(|err| WorldLabsGenericApiError::SerdeResponseParseErrorWithBody(err, response_body.to_string()))?;

  Ok(DeleteWorldResponse {
    world_id: WorldId(raw.world_id),
    deleted: raw.deleted,
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
  async fn test_delete_world() {
    setup_test_logging(LevelFilter::Debug);

    let creds = get_test_api_key().unwrap();

    // Use a known world_id to delete
    let world_id = WorldId::from_str("REPLACE_WITH_REAL_ID");

    let response = delete_world(DeleteWorldArgs {
      creds: &creds,
      world_id: &world_id,
      request_timeout: None,
    }).await.unwrap();

    println!("World ID: {}", response.world_id.as_str());
    println!("Deleted: {}", response.deleted);

    assert_eq!(1, 2);
  }
}
