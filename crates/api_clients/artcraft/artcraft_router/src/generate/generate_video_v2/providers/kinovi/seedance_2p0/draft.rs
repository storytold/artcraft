use std::collections::HashMap;

use seedance2pro_client::creds::seedance2pro_session::Seedance2ProSession;
use seedance2pro_client::requests::generate_video::generate_video::{KinoviAspectRatio, KinoviBatchCount, KinoviGenerateVideoRequest, KinoviModelType, KinoviOutputResolution};
use tokens::tokens::media_files::MediaFileToken;

use crate::api::audio_list_ref::AudioListRef;
use crate::api::character_list_ref::CharacterListRef;
use crate::api::image_list_ref::ImageListRef;
use crate::api::image_ref::ImageRef;
use crate::api::video_list_ref::VideoListRef;
use crate::client::router_seedance2pro_client::RouterSeedance2ProClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video_v2::providers::kinovi::seedance_2p0::request::KinoviSeedance2p0RequestState;
use crate::generate::generate_video_v2::providers::kinovi::upload::upload_to_seedance2pro;

#[derive(Debug, Clone)]
pub struct KinoviSeedance2p0DraftState {
  // Materialized / finalized types

  pub prompt: String,
  pub aspect_ratio: KinoviAspectRatio,
  pub resolution: Option<KinoviOutputResolution>,
  pub duration_seconds: u8,
  pub batch_count: KinoviBatchCount,

  // Pending types that need to be queried.
  pub unhandled_request_state: Option<KinoviSeedance2p0RemainingItems>,
}

#[derive(Debug, Clone)]
pub struct KinoviSeedance2p0RemainingItems {
  pub start_frame: Option<ImageRef>,
  pub end_frame: Option<ImageRef>,
  pub reference_images: Option<ImageListRef>,
  pub reference_videos: Option<VideoListRef>,
  pub reference_audio: Option<AudioListRef>,
  pub reference_character_tokens: Option<CharacterListRef>,
}

impl KinoviSeedance2p0DraftState {
  pub async fn to_request(
    &mut self,
    client: &RouterSeedance2ProClient,
    maybe_media_file_to_url_map: Option<&HashMap<MediaFileToken, String>>,
  ) -> Result<KinoviSeedance2p0RequestState, ArtcraftRouterError> {
    let session = &client.session;

    let mut start_frame_url = None;
    let mut end_frame_url = None;
    let mut reference_image_urls = None;
    let mut reference_video_urls = None;
    let mut reference_audio_urls = None;

    if let Some(remaining) = self.unhandled_request_state.take() {
      start_frame_url = resolve_and_upload_image_ref(
        session, remaining.start_frame, maybe_media_file_to_url_map,
      ).await?;

      end_frame_url = resolve_and_upload_image_ref(
        session, remaining.end_frame, maybe_media_file_to_url_map,
      ).await?;

      reference_image_urls = resolve_and_upload_image_list_ref(
        session, remaining.reference_images, maybe_media_file_to_url_map,
      ).await?;

      reference_video_urls = resolve_and_upload_video_list_ref(
        session, remaining.reference_videos, maybe_media_file_to_url_map,
      ).await?;

      reference_audio_urls = resolve_and_upload_audio_list_ref(
        session, remaining.reference_audio, maybe_media_file_to_url_map,
      ).await?;

      // TODO: Handle remaining.reference_character_tokens
    }

    let request = KinoviGenerateVideoRequest {
      model_type: KinoviModelType::Seedance2Pro,
      prompt: self.prompt.clone(),
      aspect_ratio: self.aspect_ratio,
      output_resolution: self.resolution,
      duration_seconds: self.duration_seconds,
      batch_count: self.batch_count,
      start_frame_url,
      end_frame_url,
      reference_image_urls,
      reference_video_urls,
      reference_audio_urls,
      character_ids: None, // TODO: resolve character tokens
      use_face_blur_hack: None,
    };

    Ok(KinoviSeedance2p0RequestState { request })
  }
}

// --- Resolve + upload helpers ---

/// Resolve a single ImageRef to a URL string, then upload to Seedance2Pro CDN.
async fn resolve_and_upload_image_ref(
  session: &Seedance2ProSession,
  image_ref: Option<ImageRef>,
  maybe_map: Option<&HashMap<MediaFileToken, String>>,
) -> Result<Option<String>, ArtcraftRouterError> {
  let image_ref = match image_ref {
    None => return Ok(None),
    Some(r) => r,
  };

  let source_url = match image_ref {
    ImageRef::Url(url) => url,
    ImageRef::MediaFileToken(token) => resolve_token_to_url(&token, maybe_map)?,
  };

  let uploaded = upload_to_seedance2pro(session, &source_url).await?;
  Ok(Some(uploaded))
}

/// Resolve an ImageListRef to URL strings, then upload each to Seedance2Pro CDN.
/// Order of the input list is preserved in the output.
async fn resolve_and_upload_image_list_ref(
  session: &Seedance2ProSession,
  image_list_ref: Option<ImageListRef>,
  maybe_map: Option<&HashMap<MediaFileToken, String>>,
) -> Result<Option<Vec<String>>, ArtcraftRouterError> {
  let list = match image_list_ref {
    None => return Ok(None),
    Some(r) => r,
  };

  let source_urls = match list {
    ImageListRef::Urls(urls) => urls,
    ImageListRef::MediaFileTokens(tokens) => resolve_tokens_to_urls(&tokens, maybe_map)?,
  };

  if source_urls.is_empty() {
    return Ok(None);
  }

  let mut uploaded = Vec::with_capacity(source_urls.len());
  for url in &source_urls {
    uploaded.push(upload_to_seedance2pro(session, url).await?);
  }
  Ok(Some(uploaded))
}

/// Resolve a VideoListRef to URL strings, then upload each to Seedance2Pro CDN.
/// Order of the input list is preserved in the output.
async fn resolve_and_upload_video_list_ref(
  session: &Seedance2ProSession,
  video_list_ref: Option<VideoListRef>,
  maybe_map: Option<&HashMap<MediaFileToken, String>>,
) -> Result<Option<Vec<String>>, ArtcraftRouterError> {
  let list = match video_list_ref {
    None => return Ok(None),
    Some(r) => r,
  };

  let source_urls = match list {
    VideoListRef::Urls(urls) => urls,
    VideoListRef::MediaFileTokens(tokens) => resolve_tokens_to_urls(&tokens, maybe_map)?,
  };

  if source_urls.is_empty() {
    return Ok(None);
  }

  let mut uploaded = Vec::with_capacity(source_urls.len());
  for url in &source_urls {
    uploaded.push(upload_to_seedance2pro(session, url).await?);
  }
  Ok(Some(uploaded))
}

/// Resolve an AudioListRef to URL strings, then upload each to Seedance2Pro CDN.
/// Order of the input list is preserved in the output.
async fn resolve_and_upload_audio_list_ref(
  session: &Seedance2ProSession,
  audio_list_ref: Option<AudioListRef>,
  maybe_map: Option<&HashMap<MediaFileToken, String>>,
) -> Result<Option<Vec<String>>, ArtcraftRouterError> {
  let list = match audio_list_ref {
    None => return Ok(None),
    Some(r) => r,
  };

  let source_urls = match list {
    AudioListRef::Urls(urls) => urls,
    AudioListRef::MediaFileTokens(tokens) => resolve_tokens_to_urls(&tokens, maybe_map)?,
  };

  if source_urls.is_empty() {
    return Ok(None);
  }

  let mut uploaded = Vec::with_capacity(source_urls.len());
  for url in &source_urls {
    uploaded.push(upload_to_seedance2pro(session, url).await?);
  }
  Ok(Some(uploaded))
}

// --- Token resolution helpers ---

/// Look up a single media file token in the map to get its CDN URL.
fn resolve_token_to_url(
  token: &MediaFileToken,
  maybe_map: Option<&HashMap<MediaFileToken, String>>,
) -> Result<String, ArtcraftRouterError> {
  let map = maybe_map.ok_or_else(|| {
    ArtcraftRouterError::Client(ClientError::MediaFileToUrlMapNotProvided)
  })?;

  map.get(token)
    .cloned()
    .ok_or_else(|| {
      ArtcraftRouterError::Client(ClientError::MediaFileTokenNotFoundInMap {
        token: token.as_str().to_string(),
      })
    })
}

/// Look up multiple media file tokens in the map. Order is preserved.
fn resolve_tokens_to_urls(
  tokens: &[MediaFileToken],
  maybe_map: Option<&HashMap<MediaFileToken, String>>,
) -> Result<Vec<String>, ArtcraftRouterError> {
  let map = maybe_map.ok_or_else(|| {
    ArtcraftRouterError::Client(ClientError::MediaFileToUrlMapNotProvided)
  })?;

  tokens.iter()
    .map(|token| {
      map.get(token)
        .cloned()
        .ok_or_else(|| {
          ArtcraftRouterError::Client(ClientError::MediaFileTokenNotFoundInMap {
            token: token.as_str().to_string(),
          })
        })
    })
    .collect()
}
