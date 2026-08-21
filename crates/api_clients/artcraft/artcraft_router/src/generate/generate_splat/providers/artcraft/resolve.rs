//! Shared resolve helpers for the Artcraft splat provider.
//!
//! Artcraft only accepts media file tokens — raw URLs are rejected.

use tokens::tokens::media_files::MediaFileToken;

use crate::api::image_list_ref::ImageListRef;
use crate::api::video_ref::VideoRef;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;

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

pub(super) fn resolve_video_ref(
  video_ref: Option<VideoRef>,
) -> Result<Option<MediaFileToken>, ArtcraftRouterError> {
  match video_ref {
    None => Ok(None),
    Some(VideoRef::MediaFileToken(token)) => Ok(Some(token)),
    Some(VideoRef::Url(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::ArtcraftOnlySupportsMediaTokens))
    }
  }
}
