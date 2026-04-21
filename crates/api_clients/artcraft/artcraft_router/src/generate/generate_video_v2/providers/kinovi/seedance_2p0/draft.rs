use std::collections::HashMap;

use seedance2pro_client::creds::seedance2pro_session::Seedance2ProSession;
use seedance2pro_client::requests::generate_video::generate_video::{KinoviAspectRatio, KinoviBatchCount, KinoviGenerateVideoRequest, KinoviModelType, KinoviOutputResolution};
use tokens::tokens::media_files::MediaFileToken;

use crate::api::audio_list_ref::AudioListRef;
use crate::api::character_list_ref::CharacterListRef;
use crate::api::image_list_ref::ImageListRef;
use crate::api::image_ref::ImageRef;
use crate::api::video_list_ref::VideoListRef;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video_v2::providers::kinovi::seedance_2p0::request::KinoviSeedance2p0RequestState;
use crate::generate::generate_video_v2::providers::kinovi::upload::upload_to_seedance2pro;
use crate::generate::generate_video_v2::video_generation_draft_context::VideoGenerationDraftContext;

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
    draft_context: &VideoGenerationDraftContext<'_>,
  ) -> Result<KinoviSeedance2p0RequestState, ArtcraftRouterError> {
    let client = draft_context.get_seedance2pro_client_ref()?;
    let session = &client.session;

    let mut start_frame_url = None;
    let mut end_frame_url = None;
    let mut reference_image_urls = None;
    let mut reference_video_urls = None;
    let mut reference_audio_urls = None;
    let mut character_ids = None;

    if let Some(remaining) = self.unhandled_request_state.take() {
      let map = draft_context.media_file_to_artcraft_url_map;

      start_frame_url = resolve_and_upload_single(session, remaining.start_frame, map).await?;
      end_frame_url = resolve_and_upload_single(session, remaining.end_frame, map).await?;

      reference_image_urls = resolve_and_upload_list(
        session, remaining.reference_images.map(ImageListRef::into_urls_or_tokens), map,
      ).await?;

      reference_video_urls = resolve_and_upload_list(
        session, remaining.reference_videos.map(VideoListRef::into_urls_or_tokens), map,
      ).await?;

      reference_audio_urls = resolve_and_upload_list(
        session, remaining.reference_audio.map(AudioListRef::into_urls_or_tokens), map,
      ).await?;

      character_ids = resolve_character_tokens(
        remaining.reference_character_tokens.as_ref(),
        draft_context,
      )?;
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
      character_ids,
      use_face_blur_hack: None,
    };

    Ok(KinoviSeedance2p0RequestState { request })
  }
}

/// Either resolved URLs or unresolved media file tokens.
enum UrlsOrTokens {
  Urls(Vec<String>),
  Tokens(Vec<MediaFileToken>),
}

// Allow each list ref type to decompose into this common representation.
impl ImageListRef {
  fn into_urls_or_tokens(self) -> UrlsOrTokens {
    match self {
      Self::Urls(urls) => UrlsOrTokens::Urls(urls),
      Self::MediaFileTokens(tokens) => UrlsOrTokens::Tokens(tokens),
    }
  }
}

impl VideoListRef {
  fn into_urls_or_tokens(self) -> UrlsOrTokens {
    match self {
      Self::Urls(urls) => UrlsOrTokens::Urls(urls),
      Self::MediaFileTokens(tokens) => UrlsOrTokens::Tokens(tokens),
    }
  }
}

impl AudioListRef {
  fn into_urls_or_tokens(self) -> UrlsOrTokens {
    match self {
      Self::Urls(urls) => UrlsOrTokens::Urls(urls),
      Self::MediaFileTokens(tokens) => UrlsOrTokens::Tokens(tokens),
    }
  }
}

// --- Resolve + upload helpers ---

/// Resolve a single ImageRef and upload to Seedance2Pro CDN.
async fn resolve_and_upload_single(
  session: &Seedance2ProSession,
  image_ref: Option<ImageRef>,
  maybe_map: Option<&HashMap<MediaFileToken, String>>,
) -> Result<Option<String>, ArtcraftRouterError> {
  let source_url = match image_ref {
    None => return Ok(None),
    Some(ImageRef::Url(url)) => url,
    Some(ImageRef::MediaFileToken(token)) => resolve_token(maybe_map, &token)?,
  };
  Ok(Some(upload_to_seedance2pro(session, &source_url).await?))
}

/// Resolve a list of refs to URLs and upload each to Seedance2Pro CDN.
/// Order is preserved.
async fn resolve_and_upload_list(
  session: &Seedance2ProSession,
  urls_or_tokens: Option<UrlsOrTokens>,
  maybe_map: Option<&HashMap<MediaFileToken, String>>,
) -> Result<Option<Vec<String>>, ArtcraftRouterError> {
  let source_urls = match urls_or_tokens {
    None => return Ok(None),
    Some(UrlsOrTokens::Urls(urls)) if urls.is_empty() => return Ok(None),
    Some(UrlsOrTokens::Urls(urls)) => urls,
    Some(UrlsOrTokens::Tokens(tokens)) if tokens.is_empty() => return Ok(None),
    Some(UrlsOrTokens::Tokens(tokens)) => resolve_tokens(maybe_map, &tokens)?,
  };

  let mut uploaded = Vec::with_capacity(source_urls.len());
  for url in &source_urls {
    uploaded.push(upload_to_seedance2pro(session, url).await?);
  }
  Ok(Some(uploaded))
}

// --- Token resolution ---

fn resolve_token(
  maybe_map: Option<&HashMap<MediaFileToken, String>>,
  token: &MediaFileToken,
) -> Result<String, ArtcraftRouterError> {
  let map = maybe_map.ok_or(ArtcraftRouterError::Client(ClientError::MediaFileToUrlMapNotProvided))?;
  map.get(token).cloned().ok_or_else(|| {
    ArtcraftRouterError::Client(ClientError::MediaFileTokenNotFoundInMap {
      token: token.clone(),
    })
  })
}

fn resolve_tokens(
  maybe_map: Option<&HashMap<MediaFileToken, String>>,
  tokens: &[MediaFileToken],
) -> Result<Vec<String>, ArtcraftRouterError> {
  tokens.iter().map(|t| resolve_token(maybe_map, t)).collect()
}

// --- Character token resolution ---

/// Map character tokens to their Kinovi character IDs, preserving order.
fn resolve_character_tokens(
  character_list_ref: Option<&CharacterListRef>,
  draft_context: &VideoGenerationDraftContext<'_>,
) -> Result<Option<Vec<String>>, ArtcraftRouterError> {
  let list = match character_list_ref {
    None => return Ok(None),
    Some(r) => r,
  };

  let tokens = match list {
    CharacterListRef::CharacterTokens(tokens) if tokens.is_empty() => return Ok(None),
    CharacterListRef::CharacterTokens(tokens) => tokens,
  };

  let map = draft_context.get_character_token_to_kinovi_map()?;

  let ids: Result<Vec<String>, _> = tokens.iter()
    .map(|token| {
      map.get(token).cloned().ok_or_else(|| {
        ArtcraftRouterError::Client(ClientError::CharacterTokenNotFoundInMap {
          token: token.clone(),
        })
      })
    })
    .collect();

  ids.map(Some)
}
