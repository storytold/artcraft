use crate::client::browser_user_agents::FIREFOX_143_MAC_USER_AGENT;
use crate::datatypes::api::file_id::FileId;
use crate::datatypes::api::post_id::PostId;
use crate::datatypes::api::user_id::UserId;
use crate::error::grok_client_error::GrokClientError;
use crate::error::grok_error::GrokError;
use crate::error::grok_generic_api_error::GrokGenericApiError;
use crate::requests::media_posts::list_media_posts::request::{FilterData, MediaPostListRawRequest};
use crate::requests::media_posts::list_media_posts::response::{PostItem, PostListRawResponse};
use crate::requests::upload_file::grok_upload_file::{GrokUploadFile, GrokUploadFileResponse};
use crate::utils::user_and_file_id_to_image_url::user_and_file_id_to_image_url;
use log::{error, info};
use std::time::Duration;
use wreq::header::{ACCEPT, ACCEPT_ENCODING, ACCEPT_LANGUAGE, CACHE_CONTROL, CONNECTION, CONTENT_TYPE, COOKIE, ORIGIN, PRAGMA, REFERER, TE, USER_AGENT};
use wreq::Client;
use wreq_util::Emulation;

const MEDIA_LIST_URL: &str = "https://grok.com/rest/media/post/list";

/// Request builder
pub struct GrokMediaPostListRequest<'a> {
  pub cookie: &'a str,

  /// Optional cursor
  pub cursor: Option<String>,

  pub request_timeout: Option<Duration>,
}

/// Response type
#[derive(Debug, Clone)]
pub struct GrokMediaPostList {
  /// List of posts
  pub posts: Vec<MediaPost>,

  /// Cursor for the next items.
  pub next_cursor: Option<String>,
}

#[derive(Debug, Clone)]
pub struct MediaPost {
  pub post_id: PostId,

  /// Only populated if there's a video and all the video data is present.
  pub video_data: Option<VideoData>
}

#[derive(Debug, Clone)]
pub struct VideoData {
  pub file_id: FileId,
  pub video_url: String,
  pub prompt: Option<String>,
}

impl <'a> GrokMediaPostListRequest<'a> {

  pub async fn send(&self) -> Result<GrokMediaPostList, GrokError> {
    info!("Configuring client...");

    let client = Client::builder()
        .emulation(Emulation::Firefox143)
        .build()
        .map_err(|err| GrokClientError::WreqClientError(err))?;

    // TODO: Headers were from Chromium, not Firefox. Partial implementation.
    let mut request_builder = client.post(MEDIA_LIST_URL)
        // TODO: Missing header "baggage"
        // TODO: Missing header "sentry-trace"
        // TODO: Missing header "traceparent"
        // TODO: Missing header "x-statsig-id"
        // TODO: Missing header "x-xai-request-id"
        //.header(CACHE_CONTROL, "no-cache") // NB: Not present in firefox
        //.header(PRAGMA, "no-cache") // NB: Not present in firefox
        //.header("sec-ch-ua", "") // NB: Not present in firefox
        //.header("sec-ch-ua-mobile", "") // NB: Not present in firefox
        //.header("sec-ch-ua-platform", "") // NB: Not present in firefox
        .header(USER_AGENT, FIREFOX_143_MAC_USER_AGENT)
        .header(ACCEPT, "*/*")
        .header(ACCEPT_LANGUAGE, "en-US,en;q=0.5")
        .header(ACCEPT_ENCODING, "gzip, deflate, br, zstd")
        .header(REFERER, "https://grok.com/imagine/favorites")
        .header(CONTENT_TYPE, "application/json")
        .header(ORIGIN, "https://grok.com")
        .header("Sec-GPC", "1")
        .header(CONNECTION, "keep-alive")
        .header(COOKIE, self.cookie.to_string())
        .header("sec-fetch-dest", "empty")
        .header("sec-fetch-mode", "cors")
        .header("sec-fetch-site", "same-origin")
        .header("Priority", "u=4")
        .header(TE, "trailers");

    if let Some(timeout) = self.request_timeout {
      request_builder = request_builder.timeout(timeout);
    }

    let request_body = MediaPostListRawRequest {
      limit: 40,
      filter: FilterData {
        source: "MEDIA_POST_SOURCE_LIKED".to_string(),
      },
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

    let response : PostListRawResponse = serde_json::from_str(&response_body)
        .map_err(|err| GrokGenericApiError::SerdeResponseParseErrorWithBody(err, response_body.to_string()))?;

    let mut posts = Vec::new();

    for post in response.posts.into_iter() {
      let post_id = post.id;

      // If the child video doesn't have a prompt, this parent prompt could
      // be a VLM-based auto-prompt we can copy to the video.
      let maybe_parent_prompt = empty_to_none(post.prompt);

      let mut video_data = None;

      for child in post.child_posts.into_iter() {
        // Maybe children can have more than one video?
        if let Some(url) = child.media_url {
          let mut has_video = false;
          if url.to_lowercase().contains(".mp4") {
            has_video = true;
          }
          if has_video {
            let mut maybe_video_prompt = empty_to_none(child.original_prompt);

            if maybe_video_prompt.is_none() {
              maybe_video_prompt = maybe_parent_prompt.clone();
            }

            video_data = Some(VideoData {
              file_id: FileId(child.id),
              video_url: url,
              prompt: maybe_video_prompt,
            });
          }
        }
      }

      posts.push(MediaPost {
        post_id: PostId(post_id),
        video_data,
      })
    }

    Ok(GrokMediaPostList {
      posts,
      next_cursor: response.next_cursor,
    })
  }
}

pub fn empty_to_none(opt: Option<String>) -> Option<String> {
  match opt.as_deref() {
    None => None,
    Some("") => None,
    _ => opt,
  }
}


#[cfg(test)]
mod tests {
  use super::*;
  use crate::test_utils::get_test_cookies::get_test_cookies;
  use crate::test_utils::setup_test_logging::setup_test_logging;
  use errors::AnyhowResult;
  use log::LevelFilter;

  #[tokio::test]
  #[ignore] // Client side tests only
  async fn create_media_post() -> AnyhowResult<()> {
    setup_test_logging(LevelFilter::Info);

    let cookies = get_test_cookies()?;

    let request = GrokMediaPostListRequest {
      cookie: &cookies,
      request_timeout: None,
      cursor: None,
    };

    let result = request.send().await?;

    println!("[test] Next Cursor: {:?}", result.next_cursor);

    for post in result.posts {
      println!("[test] Post : {:?}", post);
    }

    assert_eq!(1, 2);
    Ok(())
  }
}
