use crate::api::api_types::operation_id::OperationId;
use crate::api::requests::generate_world::http_request::{RawRequest, RawResponse, WorldPrompt, Permission};
use crate::credentials::world_labs_api_creds::WorldLabsApiCreds;
use crate::error::filter_world_labs_http_error::filter_world_labs_http_error;
use crate::error::world_labs_error::WorldLabsError;
use crate::error::world_labs_generic_api_error::WorldLabsGenericApiError;
use log::{debug, error};
use std::time::Duration;
use wreq::Client;

const URL: &str = "https://api.worldlabs.ai/marble/v1/worlds:generate";

pub struct GenerateWorldArgs<'a> {
  pub creds: &'a WorldLabsApiCreds,
  pub world_prompt: WorldPrompt,
  pub display_name: Option<String>,
  pub model: Option<String>,
  pub seed: Option<u32>,
  pub tags: Option<Vec<String>>,
  pub permission: Option<Permission>,
  pub request_timeout: Option<Duration>,
}

pub struct GenerateWorldResponse {
  pub operation_id: OperationId,
  pub done: bool,
}

/// POST /marble/v1/worlds:generate
///
/// Start world generation. Returns an operation_id to poll with get_operation.
pub async fn generate_world(args: GenerateWorldArgs<'_>) -> Result<GenerateWorldResponse, WorldLabsError> {
  let client = Client::new();

  let payload = RawRequest {
    world_prompt: args.world_prompt,
    display_name: args.display_name,
    model: args.model,
    seed: args.seed,
    tags: args.tags,
    permission: args.permission,
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
      error!("Error during generate_world request: {:?}", err);
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
    error!("generate_world returned error (code {}): {:?}", status.as_u16(), response_body);
  }

  filter_world_labs_http_error(status, Some(&response_body))?;

  debug!("Response body (200): {}", response_body);

  let raw: RawResponse = serde_json::from_str(&response_body)
    .map_err(|err| WorldLabsGenericApiError::SerdeResponseParseErrorWithBody(err, response_body.to_string()))?;

  Ok(GenerateWorldResponse {
    operation_id: OperationId(raw.operation_id),
    done: raw.done.unwrap_or(false),
  })
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::api::requests::generate_world::http_request::{ContentReference, WorldPrompt};
  use crate::test_utils::get_test_api_key::get_test_api_key;
  use crate::test_utils::setup_test_logging::setup_test_logging;
  use log::LevelFilter;

  #[tokio::test]
  #[ignore]
  async fn test_generate_world_text_prompt() {
    setup_test_logging(LevelFilter::Debug);

    let creds = get_test_api_key().unwrap();

    let response = generate_world(GenerateWorldArgs {
      creds: &creds,
      world_prompt: WorldPrompt::Text {
        text_prompt: Some("A cozy cabin in the snowy mountains".to_string()),
        disable_recaption: None,
      },
      display_name: Some("Test World".to_string()),
      model: Some("Marble 0.1-mini".to_string()),
      seed: None,
      tags: None,
      permission: None,
      request_timeout: None,
    }).await.unwrap();

    println!("Operation ID: {}", response.operation_id.as_str());
    println!("Done: {}", response.done);

    assert_eq!(1, 2);
  }

  #[tokio::test]
  #[ignore]
  async fn test_generate_world_image_uri() {
    setup_test_logging(LevelFilter::Debug);

    let creds = get_test_api_key().unwrap();

    let response = generate_world(GenerateWorldArgs {
      creds: &creds,
      world_prompt: WorldPrompt::Image {
        image_prompt: ContentReference::Uri {
          uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/280px-PNG_transparency_demonstration_1.png".to_string(),
        },
        text_prompt: None,
        is_pano: None,
        disable_recaption: None,
      },
      display_name: None,
      model: Some("Marble 0.1-mini".to_string()),
      seed: None,
      tags: None,
      permission: None,
      request_timeout: None,
    }).await.unwrap();

    println!("Operation ID: {}", response.operation_id.as_str());
    println!("Done: {}", response.done);

    assert_eq!(1, 2);
  }
}
