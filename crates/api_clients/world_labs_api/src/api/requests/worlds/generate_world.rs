use crate::api::api_types::operation_id::OperationId;
use crate::credentials::world_labs_api_creds::WorldLabsApiCreds;
use crate::error::filter_world_labs_http_error::filter_world_labs_http_error;
use crate::error::world_labs_error::WorldLabsError;
use crate::error::world_labs_generic_api_error::WorldLabsGenericApiError;
use log::{debug, error};
use serde::{Deserialize, Serialize};
use std::time::Duration;
use wreq::Client;

const URL: &str = "https://api.worldlabs.ai/marble/v1/worlds:generate";

pub struct GenerateWorldArgs<'a> {
  pub creds: &'a WorldLabsApiCreds,
  pub world_prompt: WorldPrompt,
  pub display_name: Option<String>,
  pub model: Option<String>,
  pub request_timeout: Option<Duration>,
}

/// The world prompt — a tagged union describing the input.
#[derive(Clone, Debug, Serialize)]
#[serde(tag = "type", rename_all = "kebab-case")]
pub enum WorldPrompt {
  Text {
    text_prompt: String,
  },
  Image {
    image_prompt: ImagePrompt,
    #[serde(skip_serializing_if = "Option::is_none")]
    text_prompt: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    is_pano: Option<bool>,
  },
  MultiImage {
    multi_image_prompt: Vec<ImagePrompt>,
    #[serde(skip_serializing_if = "Option::is_none")]
    text_prompt: Option<String>,
  },
  Video {
    video_prompt: VideoPrompt,
    #[serde(skip_serializing_if = "Option::is_none")]
    text_prompt: Option<String>,
  },
}

#[derive(Clone, Debug, Serialize)]
#[serde(tag = "source", rename_all = "snake_case")]
pub enum ImagePrompt {
  Uri {
    uri: String,
  },
  MediaAsset {
    media_asset_id: String,
  },
  DataBase64 {
    data: String,
    media_type: String,
  },
}

#[derive(Clone, Debug, Serialize)]
#[serde(tag = "source", rename_all = "snake_case")]
pub enum VideoPrompt {
  Uri {
    uri: String,
  },
  MediaAsset {
    media_asset_id: String,
  },
  DataBase64 {
    data: String,
    media_type: String,
  },
}

pub struct GenerateWorldResponse {
  pub operation_id: OperationId,
  pub done: bool,
}

pub async fn generate_world(args: GenerateWorldArgs<'_>) -> Result<GenerateWorldResponse, WorldLabsError> {
  let client = Client::new();

  let payload = RawRequest {
    world_prompt: args.world_prompt,
    display_name: args.display_name,
    model: args.model,
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

#[derive(Serialize)]
struct RawRequest {
  pub world_prompt: WorldPrompt,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub display_name: Option<String>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub model: Option<String>,
}

#[derive(Deserialize)]
struct RawResponse {
  pub operation_id: String,
  pub done: Option<bool>,
}
