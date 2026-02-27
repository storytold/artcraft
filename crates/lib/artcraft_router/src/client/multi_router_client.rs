use crate::client::router_artcraft_client::RouterArtcraftClient;
use crate::errors::client_error::{ClientError, ClientType};

pub struct MultiRouterClient {
  pub(crate) artcraft_client: Option<RouterArtcraftClient>,
}

impl MultiRouterClient {
  pub fn get_artcraft_client_ref(&self) -> Result<&RouterArtcraftClient, ClientError> {
    self.artcraft_client.as_ref()
      .ok_or(ClientError::ClientNotConfigured(ClientType::Artcraft))
  }
}
