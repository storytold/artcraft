use crate::api::api_types::run_object_id::RunObjectId;
use crate::api::api_types::upload_mime_type::UploadMimeType;
use crate::api::api_types::upload_object_id::UploadObjectId;
use crate::api::common::common_header_values::{ORIGIN_VALUE, REFERER_VALUE};
use crate::api::utils::upload_id_to_image_url::upload_id_to_image_url;
use crate::credentials::world_labs_bearer_token::WorldLabsBearerToken;
use crate::credentials::world_labs_cookies::WorldLabsCookies;
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

const URL : &str = "https://api.worldlabs.ai/api/v1/recaption2";

// Note: WorldLabs is phasing out the old URL scheme:
// const URL : &str = "https://marble2-kgw-prod-iac1.wlt-ai.art/api/v1/recaption2";

pub struct RecaptionImageArgs<'a> {
  pub cookies: &'a WorldLabsCookies,
  pub bearer_token: &'a WorldLabsBearerToken,
  pub upload_id: &'a UploadObjectId,
  pub upload_mime_type: UploadMimeType,
  pub run_id: &'a RunObjectId,
  pub request_timeout: Option<Duration>,
}

pub struct RecaptionImageResponse {
  pub title: String,
  pub caption: String,
}

/// Marble Image-to-World
/// This request generates captions and titles for images. It's a VLM.
/// The prompts are then used downstream to create the scenes.
/// Request #6 (of ~10)
pub async fn recaption_image(args: RecaptionImageArgs<'_>) -> Result<RecaptionImageResponse, WorldLabsError> {
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

  let request_payload = RawRequest::for_image_and_run(args.upload_id, args.upload_mime_type, args.run_id);

  let http_request = request_builder.json(&request_payload)
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

  let response : RawResponse = serde_json::from_str(&response_body)
      .map_err(|err| WorldLabsGenericApiError::SerdeResponseParseErrorWithBody(err, response_body.to_string()))?;

  Ok(RecaptionImageResponse {
    title: response.title,
    caption: response.caption,
  })
}

#[derive(Serialize)]
struct RawRequest {
  pub world_prompt: WorldPrompt,
  pub user_caption: String,
  pub context: Context,
}

#[derive(Serialize)]
struct WorldPrompt {
  pub r#type: String,
  pub image_prompt: ImagePrompt,
  pub text_prompt: String,
}

#[derive(Serialize)]
struct ImagePrompt {
  pub uri: String,
}

#[derive(Serialize)]
struct Context {
  pub run_id: String,
}

impl RawRequest {
  pub fn for_image_and_run(image_upload_id: &UploadObjectId, image_mime_type: UploadMimeType, run_id: &RunObjectId) -> Self {
    let image_url = upload_id_to_image_url(image_upload_id, image_mime_type);
    Self {
      world_prompt: WorldPrompt {
        r#type: "image".to_string(),
        image_prompt: ImagePrompt {
          uri: image_url,
        },
        text_prompt: "".to_string(), // NB: empty
      },
      user_caption: "".to_string(), // NB: empty
      context: Context {
        run_id: run_id.0.clone(),
      }
    }
  }
}

#[derive(Deserialize)]
struct RawResponse {
  pub caption: String,
  pub title: String,
}

#[cfg(test)]
mod tests {
}
