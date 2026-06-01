use std::collections::HashMap;

use seedance2pro_client::creds::seedance2pro_session::Seedance2ProSession;
use tokens::tokens::media_files::MediaFileToken;

use crate::api::audio_list_ref::AudioListRef;
use crate::api::character_list_ref::CharacterListRef;
use crate::api::image_list_ref::ImageListRef;
use crate::api::image_ref::ImageRef;
use crate::api::video_list_ref::VideoListRef;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::providers::kinovi::upload::upload_to_seedance2pro;
use crate::generate::generate_video::video_generation_draft_context::VideoGenerationDraftContext;

/// Either resolved URLs or unresolved media file tokens.
pub(crate) enum UrlsOrTokens {
  Urls(Vec<String>),
  Tokens(Vec<MediaFileToken>),
}

pub(crate) fn image_list_ref_into_urls_or_tokens(list: ImageListRef) -> UrlsOrTokens {
  match list {
    ImageListRef::Urls(urls) => UrlsOrTokens::Urls(urls),
    ImageListRef::MediaFileTokens(tokens) => UrlsOrTokens::Tokens(tokens),
  }
}

pub(crate) fn video_list_ref_into_urls_or_tokens(list: VideoListRef) -> UrlsOrTokens {
  match list {
    VideoListRef::Urls(urls) => UrlsOrTokens::Urls(urls),
    VideoListRef::MediaFileTokens(tokens) => UrlsOrTokens::Tokens(tokens),
  }
}

pub(crate) fn audio_list_ref_into_urls_or_tokens(list: AudioListRef) -> UrlsOrTokens {
  match list {
    AudioListRef::Urls(urls) => UrlsOrTokens::Urls(urls),
    AudioListRef::MediaFileTokens(tokens) => UrlsOrTokens::Tokens(tokens),
  }
}

/// Resolve a single ImageRef and upload to Seedance2Pro CDN.
pub(crate) async fn resolve_and_upload_single(
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
pub(crate) async fn resolve_and_upload_list(
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

/// Map character tokens to their Kinovi character IDs, preserving order.
pub(crate) fn resolve_character_tokens(
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
