use crate::client::browser_user_agents::FIREFOX_143_MAC_USER_AGENT;
use crate::datatypes::api::file_id::FileId;
use crate::datatypes::api::post_id::PostId;
use crate::datatypes::api::user_id::UserId;
use crate::error::grok_client_error::GrokClientError;
use crate::error::grok_error::GrokError;
use crate::error::grok_generic_api_error::GrokGenericApiError;
use crate::requests::media_posts::create_media_post::request::CreateMediaPostWireRequest;
use crate::requests::media_posts::create_media_post::response::CreateMediaPostRawResponse;
use crate::requests::upload_file::grok_upload_file::{GrokUploadFile, GrokUploadFileResponse};
use crate::utils::user_and_file_id_to_image_url::user_and_file_id_to_image_url;
use log::{error, info};
use std::time::Duration;
use wreq::header::{ACCEPT, ACCEPT_LANGUAGE, CACHE_CONTROL, CONTENT_TYPE, COOKIE, ORIGIN, PRAGMA, REFERER, USER_AGENT};
use wreq::Client;
use wreq_util::Emulation;

const CREATE_MEDIA_POST_URL : &str = "https://grok.com/rest/media/post/create";

/// Request builder
pub struct GrokCreateMediaPost<'a> {
  pub user_id: &'a UserId,
  pub file_id: &'a FileId,
  pub media_type: MediaPostType,
  pub cookie: &'a str,
  pub request_timeout: Option<Duration>,
}

#[derive(Debug, Copy, Clone)]
pub enum MediaPostType {
  UserUploadedImage,
  GrokGeneratedImage,
  Video,
}

/// Response type
#[derive(Debug, Clone)]
pub struct GrokCreateMediaPostResponse {
  pub post_id: PostId,
}

impl <'a> GrokCreateMediaPost<'a> {
  pub async fn send(&self) -> Result<GrokCreateMediaPostResponse, GrokError> {
    info!("Configuring client...");

    let client = Client::builder()
        .emulation(Emulation::Firefox143)
        .build()
        .map_err(|err| GrokClientError::WreqClientError(err))?;

    // TODO: Headers were from Chromium, not Firefox. Partial implementation.
    let mut request_builder = client.post(CREATE_MEDIA_POST_URL)
        // TODO: Missing header "baggage"
        // TODO: Missing header "sentry-trace"
        // TODO: Missing header "traceparent"
        // TODO: Missing header "traceparent"
        // TODO: Missing header "x-statsig-id"
        // TODO: Missing header "x-xai-request-id"
        //.header("sec-ch-ua", "") // NB: Not present in firefox
        //.header("sec-ch-ua-mobile", "") // NB: Not present in firefox
        //.header("sec-ch-ua-platform", "") // NB: Not present in firefox
        .header(ACCEPT, "*/*")
        .header(ACCEPT_LANGUAGE, "en-US,en;q=0.5")
        .header(CACHE_CONTROL, "no-cache")
        .header(CONTENT_TYPE, "application/json")
        .header(COOKIE, self.cookie.to_string())
        .header(ORIGIN, "https://grok.com")
        .header(PRAGMA, "no-cache")
        .header("priority", "u=1, i")
        .header(REFERER, "https://grok.com/imagine/favorites")
        .header("sec-fetch-dest", "empty")
        .header("sec-fetch-mode", "cors")
        .header("sec-fetch-site", "same-origin")
        .header(USER_AGENT, FIREFOX_143_MAC_USER_AGENT);

    //info!("Sending...");
    //let response = builder.send()
    //    .await
    //    .map_err(|err| GrokClientError::WreqClientError(err))?;

    if let Some(timeout) = self.request_timeout {
      request_builder = request_builder.timeout(timeout);
    }

    let media_url = match self.media_type {
      MediaPostType::UserUploadedImage => user_and_file_id_to_image_url(self.user_id, self.file_id),
      MediaPostType::GrokGeneratedImage => unimplemented!("implement for generated images"),
      MediaPostType::Video => unimplemented!("implement for videos"),
    };

    let request_body = CreateMediaPostWireRequest {
      media_type: "MEDIA_POST_TYPE_IMAGE".to_string(),
      media_url,
    };

    let http_request = request_builder.json(&request_body)
        .build()
        .map_err(|err| {
          error!("Error building create media request: {:?}", err);
          GrokClientError::WreqClientError(err)
        })?;

    let response = client.execute(http_request)
        .await
        .map_err(|err| {
          error!("Error during create media: {:?}", err);
          GrokGenericApiError::WreqError(err)
        })?;

    let status = response.status();

    let response_body = response.text()
        .await
        .map_err(|err| {
          error!("Error reading Grok create media response body: {:?}", err);
          GrokGenericApiError::WreqError(err)
        })?;

    // TODO: Handle errors (Cloudflare, Grok, etc.)
    if !status.is_success() {
      error!("Upload file request returned an error (code {}) : {:?}", status.as_u16(), response_body);
      //return Err(classify_general_http_status_code_and_body(status, response_body));
    }

    let response : CreateMediaPostRawResponse = serde_json::from_str(&response_body)
        .map_err(|err| GrokGenericApiError::SerdeResponseParseErrorWithBody(err, response_body.to_string()))?;

    Ok(GrokCreateMediaPostResponse {
      post_id: PostId(response.post.id),
    })
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::test_utils::get_test_cookies::get_test_cookies;
  use errors::AnyhowResult;

  #[tokio::test]
  #[ignore] // Client side tests only
  async fn create_media_post() -> AnyhowResult<()> {
    //setup_test_logging(LevelFilter::Trace);
    let cookies = get_test_cookies()?;

    let user_id = UserId("85980643-ffab-4984-a3de-59a608c47d7f".to_string()); // User
    let file_id = FileId("990ddf90-8f34-42b1-81a5-39c509d62ff7".to_string()); // Mochi

    let request = GrokCreateMediaPost {
      user_id: &user_id,
      file_id: &file_id,
      media_type: MediaPostType::UserUploadedImage,
      cookie: &cookies,
      request_timeout: None,
    };

    let result = request.send().await?;

    println!("Result: {:?}", result);
    println!("Post ID: {:?}", result.post_id);

    assert_eq!(1, 2);
    Ok(())
  }
}
