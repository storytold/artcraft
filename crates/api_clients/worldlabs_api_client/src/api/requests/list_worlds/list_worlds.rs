use crate::api::api_types::world_id::WorldId;
use crate::api::requests::list_worlds::http_request::{RawRequest, RawResponse};
use crate::credentials::world_labs_api_creds::WorldLabsApiCreds;
use crate::error::filter_world_labs_http_error::filter_world_labs_http_error;
use crate::error::world_labs_error::WorldLabsError;
use crate::error::world_labs_generic_api_error::WorldLabsGenericApiError;
use log::{debug, error};
use std::time::Duration;
use wreq::Client;

const URL: &str = "https://api.worldlabs.ai/marble/v1/worlds:list";

pub struct ListWorldsArgs<'a> {
  pub creds: &'a WorldLabsApiCreds,
  /// 1-100, default 20
  pub page_size: Option<u32>,
  /// Opaque cursor from a previous response
  pub page_token: Option<String>,
  /// "SUCCEEDED", "PENDING", "FAILED", "RUNNING"
  pub status: Option<String>,
  /// "Marble 0.1-mini" or "Marble 0.1-plus"
  pub model: Option<String>,
  pub tags: Option<Vec<String>>,
  pub is_public: Option<bool>,
  /// ISO 8601 datetime
  pub created_after: Option<String>,
  /// ISO 8601 datetime
  pub created_before: Option<String>,
  /// "created_at" or "updated_at"
  pub sort_by: Option<String>,
  pub request_timeout: Option<Duration>,
}

pub struct ListWorldsResponse {
  pub worlds: Vec<WorldSummary>,
  pub next_page_token: Option<String>,
}

pub struct WorldSummary {
  pub world_id: WorldId,
  pub display_name: Option<String>,
  pub world_marble_url: Option<String>,
  pub created_at: Option<String>,
  pub updated_at: Option<String>,
  pub model: Option<String>,
  /// e.g. "SUCCEEDED", "PENDING", "FAILED", "RUNNING"
  pub status: Option<String>,
  pub tags: Option<Vec<String>>,
}

/// POST /marble/v1/worlds:list
///
/// List worlds with optional filtering and pagination.
pub async fn list_worlds(args: ListWorldsArgs<'_>) -> Result<ListWorldsResponse, WorldLabsError> {
  let client = Client::new();

  let payload = RawRequest {
    page_size: args.page_size,
    page_token: args.page_token,
    status: args.status,
    model: args.model,
    tags: args.tags,
    is_public: args.is_public,
    created_after: args.created_after,
    created_before: args.created_before,
    sort_by: args.sort_by,
  };

  debug!("Requesting URL: {}", URL);

  let mut request_builder = client.post(URL)
    .header("WLT-Api-Key", args.creds.api_key())
    .header("Content-Type", "application/json")
    .json(&payload);

  if let Some(timeout) = args.request_timeout {
    request_builder = request_builder.timeout(timeout);
  }

  let response = request_builder.send()
    .await
    .map_err(|err| {
      error!("Error during list_worlds request: {:?}", err);
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
    error!("list_worlds returned error (code {}): {:?}", status.as_u16(), response_body);
  }

  filter_world_labs_http_error(status, Some(&response_body))?;

  debug!("Response body (200): {}", response_body);

  let raw: RawResponse = serde_json::from_str(&response_body)
    .map_err(|err| WorldLabsGenericApiError::SerdeResponseParseErrorWithBody(err, response_body.to_string()))?;

  let worlds = raw.worlds.into_iter().map(|w| WorldSummary {
    world_id: WorldId(w.world_id),
    display_name: w.display_name,
    world_marble_url: w.world_marble_url,
    created_at: w.created_at,
    updated_at: w.updated_at,
    model: w.model,
    status: w.status,
    tags: w.tags,
  }).collect();

  Ok(ListWorldsResponse {
    worlds,
    next_page_token: raw.next_page_token,
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
  async fn test_list_worlds() {
    setup_test_logging(LevelFilter::Debug);

    let creds = get_test_api_key().unwrap();

    let response = list_worlds(ListWorldsArgs {
      creds: &creds,
      page_size: Some(5),
      page_token: None,
      status: None,
      model: None,
      tags: None,
      is_public: None,
      created_after: None,
      created_before: None,
      sort_by: None,
      request_timeout: None,
    }).await.unwrap();

    println!("Worlds count: {}", response.worlds.len());
    println!("Next page token: {:?}", response.next_page_token);
    println!();

    for (i, world) in response.worlds.iter().enumerate() {
      println!("--- World {} ---", i + 1);
      println!("  World ID: {}", world.world_id.as_str());
      println!("  Display name: {:?}", world.display_name);
      println!("  Marble URL: {:?}", world.world_marble_url);
      println!("  Created at: {:?}", world.created_at);
      println!("  Updated at: {:?}", world.updated_at);
      println!("  Model: {:?}", world.model);
      println!("  Status: {:?}", world.status);
      println!("  Tags: {:?}", world.tags);
    }

    assert_eq!(1, 2);
  }
}
