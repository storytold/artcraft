use crate::client::browser_user_agents::FIREFOX_143_MAC_USER_AGENT;
use crate::datatypes::api::baggage::Baggage;
use crate::datatypes::api::file_id::FileId;
use crate::datatypes::api::sentry_trace::SentryTrace;
use crate::datatypes::api::svg_path_data::SvgPathData;
use crate::datatypes::api::verification_token::VerificationToken;
use crate::datatypes::api::xsid_numbers::XsidNumbers;
use crate::error::grok_client_error::GrokClientError;
use crate::error::grok_error::GrokError;
use crate::error::grok_generic_api_error::GrokGenericApiError;
use crate::requests::index_page::signature::generate_xsid::{generate_xsid, GenerateXsidArgs};
use crate::requests::media_posts::like_media_post::request::LikeMediaWireRequest;
use crate::requests::upload_file::grok_upload_file::{GrokUploadFile, GrokUploadFileResponse};
use crate::utils::user_and_file_id_to_image_url::user_and_file_id_to_image_url;
use log::{error, info, warn};
use std::time::Duration;
use uuid::Uuid;
use wreq::header::{ACCEPT, ACCEPT_ENCODING, ACCEPT_LANGUAGE, CACHE_CONTROL, CONNECTION, CONTENT_TYPE, COOKIE, ORIGIN, PRAGMA, REFERER, TE, USER_AGENT};
use wreq::Client;
use wreq_util::Emulation;

const LIKE_MEDIA_POST_URL: &str = "https://grok.com/rest/media/post/like";

/// "Liking" media is currently necessary to preserve it in your account
/// Request builder
pub struct GrokLikeMediaPost<'a> {
  pub file_id: &'a FileId,

  pub cookie: &'a str,
  pub baggage: &'a Baggage,
  pub sentry_trace: &'a SentryTrace,
  pub verification_token: &'a VerificationToken,
  pub svg_data: &'a SvgPathData,
  pub numbers: &'a XsidNumbers,

  pub request_timeout: Option<Duration>,
}

/// Response type
#[derive(Debug)]
pub struct GrokLikeMediaPostResponse {
}

impl <'a> GrokLikeMediaPost<'a> {
  pub async fn send(&self) -> Result<GrokLikeMediaPostResponse, GrokError> {
    info!("Configuring client...");

    let client = Client::builder()
        .emulation(Emulation::Firefox143)
        .build()
        .map_err(|err| GrokClientError::WreqClientError(err))?;

    let xai_request_id = Uuid::new_v4().to_string();
    println!("xai_request_id (uuid) = {}", xai_request_id);

    let sentry_trace_header = self.sentry_trace.to_http_request_header();
    println!("sentry_trace = {}", sentry_trace_header);

    let x_statsig_id = generate_xsid(GenerateXsidArgs {
      path: "/rest/app-chat/conversations/new",
      method: "POST",
      verification_token: &self.verification_token,
      svg_data: &self.svg_data,
      numbers: &self.numbers,
    })?;

    println!("x_statsig_id = {}", x_statsig_id);

    // NB: Adapting to firefox
    let mut request_builder = client.post(LIKE_MEDIA_POST_URL)
        .header(USER_AGENT, FIREFOX_143_MAC_USER_AGENT)
        .header(ACCEPT, "*/*")
        .header(ACCEPT_LANGUAGE, "en-US,en;q=0.5")
        .header(ACCEPT_ENCODING, "gzip, deflate, br, zstd")
        .header(REFERER, "https://grok.com/imagine/favorites")
        // TODO: Missing header "traceparent"
        .header(CONTENT_TYPE, "application/json")
        .header("x-xai-request-id", xai_request_id)
        .header("x-statsig-id", x_statsig_id)
        .header("sentry-trace", sentry_trace_header)
        .header("baggage", &self.baggage.0)
        .header(ORIGIN, "https://grok.com")
        .header("Sec-GPC", "1")
        .header(CONNECTION, "keep-alive")
        .header(COOKIE, self.cookie.to_string())
        .header(CACHE_CONTROL, "no-cache")
        .header("sec-fetch-dest", "empty")
        .header("sec-fetch-mode", "cors")
        .header("sec-fetch-site", "same-origin")
        .header("priority", "u=4")
        .header(TE, "trailers");

    //info!("Sending...");
    //let response = builder.send()
    //    .await
    //    .map_err(|err| GrokClientError::WreqClientError(err))?;

    if let Some(timeout) = self.request_timeout {
      request_builder = request_builder.timeout(timeout);
    }

    let request_body = LikeMediaWireRequest {
      id: self.file_id.0.to_string(),
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

    info!("Like Media Status: {:?}", status);

    let response_body = &response.text()
        .await
        .map_err(|err| {
          error!("Error reading Grok create media response body: {:?}", err);
          GrokGenericApiError::WreqError(err)
        })?;
    
    // TODO: Classify errors
    if !status.is_success() {
      warn!("Not successful liking media (status: {:?}) : {:?}", status, response_body);
      //  error!("Upload file request returned an error (code {}) : {:?}", status.as_u16(), response_body);
      //  return Err(classify_general_http_status_code_and_body(status, response_body));
    }

    //let response : GrokApiUploadFileResponse = serde_json::from_str(response_body)
    //    .map_err(|err| GrokGenericApiError::SerdeResponseParseErrorWithBody(err, response_body.to_string()))?;

    Ok(GrokLikeMediaPostResponse {
    })
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::recipes::request_client_secrets::{request_client_secrets, RequestClientSecretsArgs};
  use crate::test_utils::get_test_cookies::get_typed_test_cookies;
  use errors::AnyhowResult;

  #[tokio::test]
  #[ignore] // Client side tests only
  async fn like_media_post() -> AnyhowResult<()> {
    //setup_test_logging(LevelFilter::Trace);
    let cookies = get_typed_test_cookies()?;

    let file_id = FileId("990ddf90-8f34-42b1-81a5-39c509d62ff7".to_string()); // Mochi

    let secrets = request_client_secrets(RequestClientSecretsArgs {
      cookies: &cookies,
    }).await?;

    println!("Verification Token: {:?}", secrets.verification_token);
    println!("Sentry Trace: {:?}", secrets.sentry_trace);
    println!("Numbers: {:?}", secrets.numbers);
    println!("Svg Path: {:?}", secrets.svg_path_data);
    println!("Baggage: {:?}", secrets.baggage);

    let request = GrokLikeMediaPost {
      file_id: &file_id,

      cookie: cookies.as_str(),
      baggage: &secrets.baggage,
      sentry_trace: &secrets.sentry_trace,
      verification_token: &secrets.verification_token,
      svg_data: &secrets.svg_path_data,
      numbers: &secrets.numbers,
      
      request_timeout: None,
    };

    let result = request.send().await?;

    println!("Result: {:?}", result);
    assert_eq!(1, 2);
    Ok(())
  }
}
