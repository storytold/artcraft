//! Shared resolve helpers for the Artcraft audio provider.
//!
//! Artcraft only accepts media file tokens — raw URLs are rejected.

use tokens::tokens::media_files::MediaFileToken;

use crate::api::audio_list_ref::AudioListRef;
use crate::api::image_list_ref::ImageListRef;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;

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
