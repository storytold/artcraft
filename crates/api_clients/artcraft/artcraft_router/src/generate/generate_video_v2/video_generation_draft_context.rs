use std::collections::HashMap;
use tokens::tokens::media_files::MediaFileToken;
use crate::client::router_client::RouterClient;
use crate::client::router_seedance2pro_client::RouterSeedance2ProClient;
use crate::errors::artcraft_router_error;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;

#[derive(Clone)]
pub struct VideoGenerationDraftContext<'a> {
  pub client: &'a RouterClient,
  
  /// Optional context: a map of Media File Tokens to their ArtCraft URLs
  /// Only needed if we have to fetch these assets and upload them to another provider.
  pub media_file_to_artcraft_url_map: Option<&'a HashMap<MediaFileToken, String>>,
}

impl <'a> VideoGenerationDraftContext<'a> {
  pub fn get_seedance2pro_client_ref(&self) -> Result<&RouterSeedance2ProClient, ArtcraftRouterError> {
    self.client.get_seedance2pro_client_ref()
        .map_err(|err| ArtcraftRouterError::Client(err))
  }
  
  pub fn get_media_file_to_artcraft_url_map(&self) -> Result<&HashMap<MediaFileToken, String>, ArtcraftRouterError> {
    self.media_file_to_artcraft_url_map
        .ok_or_else(|| ArtcraftRouterError::Client(ClientError::MediaFileToUrlMapNotProvided))
  } 
}