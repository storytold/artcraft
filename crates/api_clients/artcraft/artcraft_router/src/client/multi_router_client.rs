use crate::client::router_artcraft_client::RouterArtcraftClient;
use crate::client::router_fal_client::RouterFalClient;
use crate::client::router_muapi_client::RouterMuapiClient;
use crate::client::router_seedance2pro_client::RouterSeedance2ProClient;
use crate::errors::client_error::{ClientError, ClientType};

pub struct MultiRouterClient {
  pub(crate) artcraft_client: Option<RouterArtcraftClient>,
  pub(crate) fal_client: Option<RouterFalClient>,
  pub(crate) muapi_client: Option<RouterMuapiClient>,
  pub(crate) seedance2pro_client: Option<RouterSeedance2ProClient>,
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

  pub fn get_muapi_client_ref(&self) -> Result<&RouterMuapiClient, ClientError> {
    self.muapi_client.as_ref()
      .ok_or(ClientError::ClientNotConfigured(ClientType::Muapi))
  }

  pub fn get_seedance2pro_client_ref(&self) -> Result<&RouterSeedance2ProClient, ClientError> {
    self.seedance2pro_client.as_ref()
      .ok_or(ClientError::ClientNotConfigured(ClientType::Seedance2Pro))
  }
}
