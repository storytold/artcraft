use std::collections::HashMap;
use std::fmt::Debug;

use tokens::tokens::media_files::MediaFileToken;

use crate::client::router_client::RouterClient;
use crate::client::router_kinovi_web_client::RouterKinoviWebClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;

/// Context passed when finalizing an image draft into a concrete request.
///
/// Drafts only exist for providers that need to upload assets before
/// sending the request. Today that's the KinoviWeb/Kinovi pipeline
/// (used for Midjourney image generation with reference images); other
/// providers — Artcraft, Fal — accept image URLs directly and skip the
/// draft phase entirely.
#[derive(Clone, Default)]
pub struct ImageGenerationDraftContext<'a> {
  /// Optional: the router client, needed for providers that require
  /// authenticated calls (e.g. KinoviWeb/Kinovi uploads).
  pub client: Option<&'a RouterClient>,

  /// Optional: a map of Media File Tokens to their ArtCraft URLs.
  /// Required only when the draft has unresolved `MediaFileToken` image
  /// inputs that must be downloaded from ArtCraft and re-uploaded to the
  /// target provider's CDN.
  pub media_file_to_artcraft_url_map: Option<&'a HashMap<MediaFileToken, String>>,
}

impl<'a> ImageGenerationDraftContext<'a> {
  pub fn get_kinovi_web_client_ref(&self) -> Result<&RouterKinoviWebClient, ArtcraftRouterError> {
    let client = self.client.ok_or(ArtcraftRouterError::Client(ClientError::RouterClientNotProvided))?;
    client.get_kinovi_web_client_ref()
      .map_err(ArtcraftRouterError::Client)
  }
}

impl Debug for ImageGenerationDraftContext<'_> {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    f.debug_struct("ImageGenerationDraftContext")
      .field("client", &self.client.is_some())
      .field("media_file_to_artcraft_url_map", &self.media_file_to_artcraft_url_map.map(|m| m.len()))
      .finish()
  }
}
