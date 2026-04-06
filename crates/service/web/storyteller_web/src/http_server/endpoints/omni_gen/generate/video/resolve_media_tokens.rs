use std::collections::HashMap;

use actix_web::HttpRequest;
use log::info;
use sqlx::pool::PoolConnection;
use sqlx::MySql;

use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_video_cost_and_generate_request::OmniGenVideoCostAndGenerateRequest;
use artcraft_router::api::audio_list_ref::AudioListRef;
use artcraft_router::api::image_list_ref::ImageListRef;
use artcraft_router::api::image_ref::ImageRef;
use artcraft_router::api::video_list_ref::VideoListRef;
use artcraft_router::generate::generate_video::generate_video_request::GenerateVideoRequest;
use tokens::tokens::media_files::MediaFileToken;

use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;
use crate::util::lookup::lookup_image_urls_as_map::lookup_image_urls_as_map;
use server_environment::ServerEnvironment;

/// Resolved media URLs that can be referenced by a GenerateVideoRequest.
/// The owned Vecs here outlive the request so the GenerateVideoRequest can borrow them.
pub struct ResolvedVideoMedia {
  pub url_map: HashMap<MediaFileToken, String>,
  pub maybe_start_frame_url: Option<String>,
  pub maybe_end_frame_url: Option<String>,
  pub reference_image_urls: Vec<String>,
  pub reference_video_urls: Vec<String>,
  pub reference_audio_urls: Vec<String>,
}

/// Collect all media file tokens from the raw HTTP request, query them from the database,
/// and return resolved CDN URLs.
pub async fn resolve_media_tokens(
  omni_request: &OmniGenVideoCostAndGenerateRequest,
  http_request: &HttpRequest,
  mysql_connection: &mut PoolConnection<MySql>,
  server_environment: ServerEnvironment,
) -> Result<ResolvedVideoMedia, AdvancedCommonWebError> {
  let mut all_tokens: Vec<MediaFileToken> = Vec::new();

  if let Some(token) = &omni_request.start_frame_image_media_token {
    all_tokens.push(token.clone());
  }
  if let Some(token) = &omni_request.end_frame_image_media_token {
    all_tokens.push(token.clone());
  }
  if let Some(tokens) = &omni_request.reference_image_media_tokens {
    all_tokens.extend(tokens.iter().cloned());
  }
  if let Some(tokens) = &omni_request.reference_video_media_tokens {
    all_tokens.extend(tokens.iter().cloned());
  }
  if let Some(tokens) = &omni_request.reference_audio_media_tokens {
    all_tokens.extend(tokens.iter().cloned());
  }

  if all_tokens.is_empty() {
    return Ok(ResolvedVideoMedia {
      url_map: HashMap::new(),
      maybe_start_frame_url: None,
      maybe_end_frame_url: None,
      reference_image_urls: Vec::new(),
      reference_video_urls: Vec::new(),
      reference_audio_urls: Vec::new(),
    });
  }

  info!("Resolving {} media file tokens to CDN URLs", all_tokens.len());

  let url_map = lookup_image_urls_as_map(
    http_request,
    mysql_connection,
    server_environment,
    &all_tokens,
  ).await?;

  let maybe_start_frame_url = omni_request.start_frame_image_media_token.as_ref()
    .and_then(|t| url_map.get(t).cloned());

  let maybe_end_frame_url = omni_request.end_frame_image_media_token.as_ref()
    .and_then(|t| url_map.get(t).cloned());

  let reference_image_urls = omni_request.reference_image_media_tokens.as_ref()
    .map(|tokens| tokens.iter().filter_map(|t| url_map.get(t).cloned()).collect())
    .unwrap_or_default();

  let reference_video_urls = omni_request.reference_video_media_tokens.as_ref()
    .map(|tokens| tokens.iter().filter_map(|t| url_map.get(t).cloned()).collect())
    .unwrap_or_default();

  let reference_audio_urls = omni_request.reference_audio_media_tokens.as_ref()
    .map(|tokens| tokens.iter().filter_map(|t| url_map.get(t).cloned()).collect())
    .unwrap_or_default();

  Ok(ResolvedVideoMedia {
    url_map,
    maybe_start_frame_url,
    maybe_end_frame_url,
    reference_image_urls,
    reference_video_urls,
    reference_audio_urls,
  })
}

/// Apply resolved media URLs to a GenerateVideoRequest, replacing MediaFileToken refs with URL refs.
pub fn apply_resolved_media<'a>(
  request: &mut GenerateVideoRequest<'a>,
  resolved: &'a ResolvedVideoMedia,
) {
  request.start_frame = resolved.maybe_start_frame_url.as_deref()
    .map(ImageRef::Url);

  request.end_frame = resolved.maybe_end_frame_url.as_deref()
    .map(ImageRef::Url);

  if !resolved.reference_image_urls.is_empty() {
    request.reference_images = Some(ImageListRef::Urls(&resolved.reference_image_urls));
  } else {
    request.reference_images = None;
  }

  if !resolved.reference_video_urls.is_empty() {
    request.reference_videos = Some(VideoListRef::Urls(&resolved.reference_video_urls));
  } else {
    request.reference_videos = None;
  }

  if !resolved.reference_audio_urls.is_empty() {
    request.reference_audio = Some(AudioListRef::Urls(&resolved.reference_audio_urls));
  } else {
    request.reference_audio = None;
  }
}
