use crate::client::router_artcraft_client::RouterArtcraftClient;
use crate::client::router_fal_client::RouterFalClient;
use crate::errors::client_error::{ClientError, ClientType};

pub struct MultiRouterClient {
  pub(crate) artcraft_client: Option<RouterArtcraftClient>,
  pub(crate) fal_client: Option<RouterFalClient>,
}

impl MultiRouterClient {
  pub fn get_artcraft_client_ref(&self) -> Result<&RouterArtcraftClient, ClientError> {
    self.artcraft_client.as_ref()
      .ok_or(ClientError::ClientNotConfigured(ClientType::Artcraft))
  }

  pub fn get_fal_client_ref(&self) -> Result<&RouterFalClient, ClientError> {
    self.fal_client.as_ref()
      .ok_or(ClientError::ClientNotConfigured(ClientType::Fal))
  }
}
