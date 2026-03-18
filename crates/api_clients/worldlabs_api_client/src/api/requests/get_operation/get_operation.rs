use crate::api::api_types::operation_id::OperationId;
use crate::api::api_types::world_id::WorldId;
use crate::api::requests::get_operation::http_request::{RawResponse, RawWorld};
use crate::credentials::world_labs_api_creds::WorldLabsApiCreds;
use crate::error::filter_world_labs_http_error::filter_world_labs_http_error;
use crate::error::world_labs_error::WorldLabsError;
use crate::error::world_labs_generic_api_error::WorldLabsGenericApiError;
use log::{debug, error, warn};
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
  /// Structured World object, present when done=true and no error.
  pub world: Option<World>,
}

#[derive(Debug, Clone)]
pub struct OperationError {
  pub code: Option<i32>,
  pub message: Option<String>,
}

/// A completed World returned from an operation.
#[derive(Debug, Clone)]
pub struct World {
  pub world_id: WorldId,
  pub display_name: Option<String>,
  pub world_marble_url: Option<String>,
  pub created_at: Option<String>,
  pub updated_at: Option<String>,
  pub model: Option<String>,
  pub status: Option<String>,
  pub tags: Option<Vec<String>>,
  pub assets: Option<WorldAssets>,
}

/// Assets associated with a completed World.
#[derive(Debug, Clone)]
pub struct WorldAssets {
  pub caption: Option<String>,
  pub thumbnail_url: Option<String>,
  pub pano_url: Option<String>,
  pub collider_mesh_url: Option<String>,
  pub splats: Option<SplatAssets>,
}

/// Splat (3D Gaussian) assets for a World.
#[derive(Debug, Clone)]
pub struct SplatAssets {
  /// Low-res 100k splat URL
  pub spz_url_100k: Option<String>,
  /// Medium-res 500k splat URL
  pub spz_url_500k: Option<String>,
  /// Full resolution splat URL
  pub spz_url_full_res: Option<String>,
  pub metric_scale_factor: Option<f64>,
  pub ground_plane_offset: Option<f64>,
}

/// GET /marble/v1/operations/{operation_id}
///
/// Poll the status of an async operation.
/// When `done` is true, `world` contains the structured World object.
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

  let world = raw.response.and_then(|raw_world| {
    match try_parse_world(raw_world) {
      Some(w) => Some(w),
      None => {
        warn!("Operation response present but missing world_id — skipping world parse");
        None
      }
    }
  });

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
    world,
  })
}

/// Try to parse a RawWorld into a strongly-typed World.
/// Returns None if world_id is missing (not a valid World).
fn try_parse_world(raw: RawWorld) -> Option<World> {
  let world_id = raw.world_id?;

  let assets = raw.assets.map(|a| {
    let splats = a.splats.map(|s| {
      let semantics = s.semantics_metadata;
      SplatAssets {
        spz_url_100k: s.spz_urls.as_ref().and_then(|u| u.low.clone()),
        spz_url_500k: s.spz_urls.as_ref().and_then(|u| u.medium.clone()),
        spz_url_full_res: s.spz_urls.as_ref().and_then(|u| u.full_res.clone()),
        metric_scale_factor: semantics.as_ref().and_then(|m| m.metric_scale_factor),
        ground_plane_offset: semantics.as_ref().and_then(|m| m.ground_plane_offset),
      }
    });

    WorldAssets {
      caption: a.caption,
      thumbnail_url: a.thumbnail_url,
      pano_url: a.imagery.and_then(|i| i.pano_url),
      collider_mesh_url: a.mesh.and_then(|m| m.collider_mesh_url),
      splats,
    }
  });

  Some(World {
    world_id: WorldId(world_id),
    display_name: raw.display_name,
    world_marble_url: raw.world_marble_url,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    model: raw.model,
    status: raw.status,
    tags: raw.tags,
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
  async fn test_get_operation() {
    setup_test_logging(LevelFilter::Debug);

    let creds = get_test_api_key().unwrap();

    let operation_id = OperationId("1fab3bf1-05a1-4929-907e-c6df07c539e2".to_string());

    let response = get_operation(GetOperationArgs {
      creds: &creds,
      operation_id: &operation_id,
      request_timeout: None,
    }).await.unwrap();

    println!("Operation ID: {}", response.operation_id);
    println!("Done: {}", response.done);
    println!("Created at: {:?}", response.created_at);
    println!("Updated at: {:?}", response.updated_at);
    println!("Expires at: {:?}", response.expires_at);
    println!("Error: {:?}", response.error);
    println!("Metadata: {:?}", response.metadata);

    match &response.world {
      None => println!("World: None (not yet complete)"),
      Some(world) => {
        println!("World:");
        println!("  World ID: {}", world.world_id.as_str());
        println!("  Display name: {:?}", world.display_name);
        println!("  Marble URL: {:?}", world.world_marble_url);
        println!("  Created at: {:?}", world.created_at);
        println!("  Updated at: {:?}", world.updated_at);
        println!("  Model: {:?}", world.model);
        println!("  Status: {:?}", world.status);
        println!("  Tags: {:?}", world.tags);
        match &world.assets {
          None => println!("  Assets: None"),
          Some(assets) => {
            println!("  Assets:");
            println!("    Caption: {:?}", assets.caption);
            println!("    Thumbnail URL: {:?}", assets.thumbnail_url);
            println!("    Pano URL: {:?}", assets.pano_url);
            println!("    Collider mesh URL: {:?}", assets.collider_mesh_url);
            match &assets.splats {
              None => println!("    Splats: None"),
              Some(splats) => {
                println!("    Splats:");
                println!("      SPZ 100k: {:?}", splats.spz_url_100k);
                println!("      SPZ 500k: {:?}", splats.spz_url_500k);
                println!("      SPZ full res: {:?}", splats.spz_url_full_res);
                println!("      Metric scale factor: {:?}", splats.metric_scale_factor);
                println!("      Ground plane offset: {:?}", splats.ground_plane_offset);
              }
            }
          }
        }
      }
    }

    assert_eq!(1, 2);
  }
}
