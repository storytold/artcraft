use crate::api::requests::get_world::http_request::RawResponse;
use crate::credentials::world_labs_api_creds::WorldLabsApiCreds;
use crate::error::filter_world_labs_http_error::filter_world_labs_http_error;
use crate::error::world_labs_error::WorldLabsError;
use crate::error::world_labs_generic_api_error::WorldLabsGenericApiError;
use log::{debug, error};
use std::time::Duration;
use wreq::Client;

const BASE_URL: &str = "https://api.worldlabs.ai/marble/v1/worlds";

pub struct GetWorldArgs<'a> {
  pub creds: &'a WorldLabsApiCreds,
  pub world_id: &'a str,
  pub request_timeout: Option<Duration>,
}

pub struct GetWorldResponse {
  pub world_id: String,
  pub display_name: Option<String>,
  pub world_marble_url: Option<String>,
  pub created_at: Option<String>,
  pub updated_at: Option<String>,
  pub model: Option<String>,
  /// e.g. "SUCCEEDED", "PENDING", "FAILED", "RUNNING"
  pub status: Option<String>,
  pub tags: Option<Vec<String>>,
  pub is_public: Option<bool>,
  pub assets: Option<WorldAssets>,
}

pub struct WorldAssets {
  pub caption: Option<String>,
  pub thumbnail_url: Option<String>,
  pub pano_url: Option<String>,
  pub collider_mesh_url: Option<String>,
  pub spz_url_100k: Option<String>,
  pub spz_url_500k: Option<String>,
  pub spz_url_full_res: Option<String>,
}

/// GET /marble/v1/worlds/{world_id}
///
/// Retrieve a world by its ID.
pub async fn get_world(args: GetWorldArgs<'_>) -> Result<GetWorldResponse, WorldLabsError> {
  let client = Client::new();

  let url = format!("{}/{}", BASE_URL, args.world_id);

  debug!("Requesting URL: {}", url);

  let mut request_builder = client.get(&url)
    .header("WLT-Api-Key", args.creds.api_key());

  if let Some(timeout) = args.request_timeout {
    request_builder = request_builder.timeout(timeout);
  }

  let response = request_builder.send()
    .await
    .map_err(|err| {
      error!("Error during get_world request: {:?}", err);
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
    error!("get_world returned error (code {}): {:?}", status.as_u16(), response_body);
  }

  filter_world_labs_http_error(status, Some(&response_body))?;

  debug!("Response body (200): {}", response_body);

  let raw: RawResponse = serde_json::from_str(&response_body)
    .map_err(|err| WorldLabsGenericApiError::SerdeResponseParseErrorWithBody(err, response_body.to_string()))?;

  let assets = raw.assets.map(|a| {
    let spz_urls = a.splats.and_then(|s| s.spz_urls);
    WorldAssets {
      caption: a.caption,
      thumbnail_url: a.thumbnail_url,
      pano_url: a.imagery.and_then(|i| i.pano_url),
      collider_mesh_url: a.mesh.and_then(|m| m.collider_mesh_url),
      spz_url_100k: spz_urls.as_ref().and_then(|u| u.low.clone()),
      spz_url_500k: spz_urls.as_ref().and_then(|u| u.medium.clone()),
      spz_url_full_res: spz_urls.as_ref().and_then(|u| u.full_res.clone()),
    }
  });

  Ok(GetWorldResponse {
    world_id: raw.world_id,
    display_name: raw.display_name,
    world_marble_url: raw.world_marble_url,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    model: raw.model,
    status: raw.status,
    tags: raw.tags,
    is_public: raw.permission.and_then(|p| p.public),
    assets,
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
  async fn test_get_world() {
    setup_test_logging(LevelFilter::Debug);

    let creds = get_test_api_key().unwrap();

    // Use a known world_id from a previous generation
    let world_id = "0048d009-1c7a-4e13-9881-07e9b6ff32e1";
    //let world_id = "c8a89fb1-f8b4-44c6-ae50-525f7205c65f";

    let response = get_world(GetWorldArgs {
      creds: &creds,
      world_id,
      request_timeout: None,
    }).await.unwrap();

    println!("World ID: {}", response.world_id);
    println!("Display name: {:?}", response.display_name);
    println!("Marble URL: {:?}", response.world_marble_url);
    println!("Created at: {:?}", response.created_at);
    println!("Updated at: {:?}", response.updated_at);
    println!("Model: {:?}", response.model);
    println!("Status: {:?}", response.status);
    println!("Tags: {:?}", response.tags);
    println!("Is public: {:?}", response.is_public);
    match &response.assets {
      None => println!("Assets: None"),
      Some(assets) => {
        println!("Assets:");
        println!("  Caption: {:?}", assets.caption);
        println!("  Thumbnail URL: {:?}", assets.thumbnail_url);
        println!("  Pano URL: {:?}", assets.pano_url);
        println!("  Collider mesh URL: {:?}", assets.collider_mesh_url);
        println!("  SPZ 100k: {:?}", assets.spz_url_100k);
        println!("  SPZ 500k: {:?}", assets.spz_url_500k);
        println!("  SPZ full res: {:?}", assets.spz_url_full_res);
      }
    }

    assert_eq!(1, 2);
  }
}
