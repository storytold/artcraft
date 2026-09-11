use std::collections::HashMap;
use std::fmt::Debug;

use tokens::tokens::media_files::MediaFileToken;

use crate::client::router_client::RouterClient;
use crate::client::router_worldlabs_client::RouterWorldLabsClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;

#[derive(Clone, Default)]
pub struct SplatGenerationDraftContext<'a> {
  /// Optional: the router client, needed for providers that require authentication.
  pub client: Option<&'a RouterClient>,

  /// Optional context: a map of Media File Tokens to their ArtCraft URLs
  /// Only needed if we have to fetch these assets and upload them to another provider.
  pub media_file_to_artcraft_url_map: Option<&'a HashMap<MediaFileToken, String>>,
}

impl <'a> SplatGenerationDraftContext<'a> {
  pub fn get_worldlabs_client_ref(&self) -> Result<&RouterWorldLabsClient, ArtcraftRouterError> {
    let client = self.client.ok_or(ArtcraftRouterError::Client(ClientError::RouterClientNotProvided))?;
    client.get_worldlabs_client_ref()
      .map_err(|err| ArtcraftRouterError::Client(err))
  }
}

impl Debug for SplatGenerationDraftContext<'_> {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    f.debug_struct("SplatGenerationDraftContext")
      .field("client", &self.client.is_some())
      .field("media_file_to_artcraft_url_map", &self.media_file_to_artcraft_url_map)
      .finish()
  }
}
