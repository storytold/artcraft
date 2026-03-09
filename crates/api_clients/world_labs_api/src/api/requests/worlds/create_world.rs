use crate::api::api_types::meta_world_object_id::MetaWorldObjectId;
use crate::api::api_types::run_object_id::RunObjectId;
use crate::api::api_types::upload_mime_type::UploadMimeType;
use crate::api::api_types::upload_object_id::UploadObjectId;
use crate::api::api_types::world_id::WorldObjectId;
use crate::api::common::common_header_values::{ORIGIN_VALUE, REFERER_VALUE};
use crate::api::utils::upload_id_to_image_url::upload_id_to_image_url;
use crate::credentials::world_labs_bearer_token::WorldLabsBearerToken;
use crate::credentials::world_labs_cookies::WorldLabsCookies;
use crate::error::filter_world_labs_http_error::filter_world_labs_http_error;
use crate::error::world_labs_client_error::WorldLabsClientError;
use crate::error::world_labs_error::WorldLabsError;
use crate::error::world_labs_generic_api_error::WorldLabsGenericApiError;
use http_headers::names::{PRIORITY, SEC_FETCH_DEST, SEC_FETCH_MODE, SEC_FETCH_SITE, SEC_GPC};
use http_headers::values::accept::ACCEPT_ALL;
use http_headers::values::cache_control::CACHE_CONTROL_NO_CACHE;
use http_headers::values::connection::CONNECTION_KEEP_ALIVE;
use http_headers::values::content_type::CONTENT_TYPE_APPLICATION_JSON;
use http_headers::values::pragma::PRAGMA_NO_CACHE;
use http_headers::values::priority::PRIORITY_4;
use http_headers::values::sec::{SEC_FETCH_DEST_EMPTY, SEC_FETCH_MODE_CORS, SEC_FETCH_SITE_CROSS_SITE};
use http_headers::values::te::TE_TRAILERS;
use log::{debug, error};
use serde::{Deserialize, Serialize};
use std::time::Duration;
use wreq::header::{ACCEPT, ACCEPT_ENCODING, ACCEPT_LANGUAGE, AUTHORIZATION, CACHE_CONTROL, CONNECTION, CONTENT_TYPE, ORIGIN, PRAGMA, REFERER, TE};
use wreq::Client;
use wreq_util::Emulation;

const URL : &str = "https://api.worldlabs.ai/api/v1/worlds";

// Note: WorldLabs is phasing out the old URL scheme:
//const URL : &str = "https://marble2-kgw-prod-iac1.wlt-ai.art/api/v1/worlds";

pub struct CreateWorldArgs<'a> {
  pub cookies: &'a WorldLabsCookies,
  pub bearer_token: &'a WorldLabsBearerToken,

  // eg. https://cdn.marble.worldlabs.ai/object/13ca760c-8ef9-4bf5-acc3-5a507fad3abf/asset.jpg
  pub image_upload_url: &'a str,
  pub text_prompt: &'a str,

  pub request_timeout: Option<Duration>,
}

pub struct CreateWorldResponse {
  pub world_id: WorldObjectId,
}

/// Marble Image-to-World
/// This request starts world generation
/// Request #7 (of ~10)
pub async fn create_world(args: CreateWorldArgs<'_>) -> Result<CreateWorldResponse, WorldLabsError> {
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
      .header(PRIORITY, PRIORITY_4)
      .header(PRAGMA, PRAGMA_NO_CACHE)
      .header(CACHE_CONTROL, CACHE_CONTROL_NO_CACHE)
      .header(TE, TE_TRAILERS);

  if let Some(timeout) = args.request_timeout {
    request_builder = request_builder.timeout(timeout);
  }

  let mut payload = RawRequest::default();
  payload.generation_input.prompt.image_prompt.uri = Some(args.image_upload_url.to_string());
  payload.generation_input.prompt.text_prompt = Some(args.text_prompt.to_string());

  let http_request = request_builder.json(&payload)
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

  if !status.is_success() {
    error!("Request returned an error (code {}) : {:?}", status.as_u16(), response_body);
  }

  filter_world_labs_http_error(status, Some(&response_body))?;

  debug!("Response body (200): {}", response_body);

  let response : RawResponse = serde_json::from_str(&response_body)
      .map_err(|err| WorldLabsGenericApiError::SerdeResponseParseErrorWithBody(err, response_body.to_string()))?;

  Ok(CreateWorldResponse {
    world_id: WorldObjectId(response.id),
  })
}

#[derive(Serialize)]
struct RawRequest {
  pub permission: Permission,
  pub generation_input: GenerationInput,
}

#[derive(Serialize)]
struct Permission {
  pub public: bool,
}

#[derive(Serialize)]
struct GenerationInput {
  pub model: String,
  pub prompt: Prompt,
}

#[derive(Serialize)]
struct Prompt {
  pub r#type: String,
  pub image_prompt: ImagePrompt,

  // NB: Not null in request, just for building
  pub text_prompt: Option<String>,
}

#[derive(Serialize)]
struct ImagePrompt {
  // NB: Not null in request, just for building
  pub uri: Option<String>,
}

impl Default for RawRequest {
  fn default() -> Self {
    Self {
      permission: Permission {
        public: true,
      },
      generation_input: GenerationInput {
        model: "Marble 0.1-plus".to_string(),
        prompt: Prompt {
          r#type: "image".to_string(),
          image_prompt: ImagePrompt {
            uri: None,
          },
          text_prompt: None,
        },
      },
    }
  }
}


#[derive(Deserialize)]
struct RawResponse {
  pub id: String,
}

#[cfg(test)]
mod tests {
}
