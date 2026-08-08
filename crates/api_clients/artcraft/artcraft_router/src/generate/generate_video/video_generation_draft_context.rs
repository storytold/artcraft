use crate::client::router_client::RouterClient;
use crate::client::router_kinovi_web_client::RouterKinoviWebClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use std::collections::HashMap;
use std::fmt::Debug;
use std::path::PathBuf;
use tokens::tokens::characters::CharacterToken;
use tokens::tokens::media_files::MediaFileToken;

#[derive(Clone, Default)]
pub struct VideoGenerationDraftContext<'a> {
  /// Optional: the router client, needed for providers that require authentication.
  pub client: Option<&'a RouterClient>,

  /// Optional context: a map of Media File Tokens to their ArtCraft URLs
  /// Only needed if we have to fetch these assets and upload them to another provider.
  pub media_file_to_artcraft_url_map: Option<&'a HashMap<MediaFileToken, String>>,

  /// Optional context: a map of Character Tokens to their respective Kinovi IDs
  /// Only necessary if using Kinovi characters
  pub character_token_to_kinovi_id_map: Option<&'a HashMap<CharacterToken, String>>,

  /// Optional context: source URL → local file path for media the caller has
  /// already downloaded (e.g. reference videos probed for billing). Uploads
  /// read these files instead of downloading the same bytes again. The
  /// caller must keep the files alive until the upload completes.
  pub predownloaded_media_paths: Option<&'a HashMap<String, PathBuf>>,
}

impl <'a> VideoGenerationDraftContext<'a> {
  pub fn get_kinovi_web_client_ref(&self) -> Result<&RouterKinoviWebClient, ArtcraftRouterError> {
    let client = self.client.ok_or(ArtcraftRouterError::Client(ClientError::RouterClientNotProvided))?;
    client.get_kinovi_web_client_ref()
      .map_err(|err| ArtcraftRouterError::Client(err))
  }

  pub fn get_media_file_to_artcraft_url_map(&self) -> Result<&HashMap<MediaFileToken, String>, ArtcraftRouterError> {
    self.media_file_to_artcraft_url_map
      .ok_or_else(|| ArtcraftRouterError::Client(ClientError::MediaFileToUrlMapNotProvided))
  }

  pub fn get_character_token_to_kinovi_map(&self) -> Result<&HashMap<CharacterToken, String>, ArtcraftRouterError> {
    self.character_token_to_kinovi_id_map
      .ok_or_else(|| ArtcraftRouterError::Client(ClientError::CharacterTokenToKinoviCharacterIdNotProvided))
  }
}

impl Debug for VideoGenerationDraftContext<'_> {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    f.debug_struct("VideoGenerationDraftContext")
      .field("client", &self.client.is_some())
      .field("media_file_to_artcraft_url_map", &self.media_file_to_artcraft_url_map)
      .field("character_token_to_kinovi_id_map", &self.character_token_to_kinovi_id_map)
      .field("predownloaded_media_paths", &self.predownloaded_media_paths)
      .finish()
  }
}
