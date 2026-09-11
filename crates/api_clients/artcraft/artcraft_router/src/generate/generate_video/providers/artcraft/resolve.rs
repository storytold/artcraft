//! Shared resolve helpers for the Artcraft provider.
//!
//! Artcraft only accepts media file tokens — raw URLs are rejected.

use tokens::tokens::characters::CharacterToken;
use tokens::tokens::media_files::MediaFileToken;

use crate::api::audio_list_ref::AudioListRef;
use crate::api::character_list_ref::CharacterListRef;
use crate::api::image_list_ref::ImageListRef;
use crate::api::image_ref::ImageRef;
use crate::api::video_list_ref::VideoListRef;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;

pub(super) fn resolve_image_ref(
  image_ref: Option<ImageRef>,
) -> Result<Option<MediaFileToken>, ArtcraftRouterError> {
  match image_ref {
    None => Ok(None),
    Some(ImageRef::MediaFileToken(t)) => Ok(Some(t)),
    Some(ImageRef::Url(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::ArtcraftOnlySupportsMediaTokens))
    }
  }
}

pub(super) fn resolve_image_list_ref(
  image_list_ref: Option<ImageListRef>,
) -> Result<Option<Vec<MediaFileToken>>, ArtcraftRouterError> {
  match image_list_ref {
    None => Ok(None),
    Some(ImageListRef::MediaFileTokens(tokens)) => Ok(Some(tokens)),
    Some(ImageListRef::Urls(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::ArtcraftOnlySupportsMediaTokens))
    }
  }
}

pub(super) fn resolve_video_list_ref(
  video_list_ref: Option<VideoListRef>,
) -> Result<Option<Vec<MediaFileToken>>, ArtcraftRouterError> {
  match video_list_ref {
    None => Ok(None),
    Some(VideoListRef::MediaFileTokens(tokens)) => Ok(Some(tokens)),
    Some(VideoListRef::Urls(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::ArtcraftOnlySupportsMediaTokens))
    }
  }
}

pub(super) fn resolve_audio_list_ref(
  audio_list_ref: Option<AudioListRef>,
) -> Result<Option<Vec<MediaFileToken>>, ArtcraftRouterError> {
  match audio_list_ref {
    None => Ok(None),
    Some(AudioListRef::MediaFileTokens(tokens)) => Ok(Some(tokens)),
    Some(AudioListRef::Urls(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::ArtcraftOnlySupportsMediaTokens))
    }
  }
}

pub(super) fn resolve_character_list_ref(
  character_list_ref: Option<CharacterListRef>,
) -> Option<Vec<CharacterToken>> {
  match character_list_ref {
    None => None,
    Some(CharacterListRef::CharacterTokens(tokens)) => Some(tokens),
  }
}
