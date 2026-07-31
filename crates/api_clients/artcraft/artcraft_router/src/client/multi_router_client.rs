use crate::client::router_artcraft_client::RouterArtcraftClient;
use crate::client::router_fal_client::RouterFalClient;
use crate::client::router_gmicloud_client::RouterGmiCloudClient;
use crate::client::router_grok_api_client::RouterGrokApiClient;
use crate::client::router_kinovi_web_client::RouterKinoviWebClient;
use crate::client::router_worldlabs_client::RouterWorldLabsClient;
use crate::errors::client_error::{ClientError, ClientType};

pub struct MultiRouterClient {
  pub(crate) artcraft_client: Option<RouterArtcraftClient>,
  pub(crate) fal_client: Option<RouterFalClient>,
  pub(crate) gmicloud_client: Option<RouterGmiCloudClient>,
  pub(crate) grok_api_client: Option<RouterGrokApiClient>,
  pub(crate) kinovi_web_client: Option<RouterKinoviWebClient>,
  pub(crate) worldlabs_client: Option<RouterWorldLabsClient>,
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

  pub fn get_gmicloud_client_ref(&self) -> Result<&RouterGmiCloudClient, ClientError> {
    self.gmicloud_client.as_ref()
      .ok_or(ClientError::ClientNotConfigured(ClientType::GmiCloud))
  }

  pub fn get_grok_api_client_ref(&self) -> Result<&RouterGrokApiClient, ClientError> {
    self.grok_api_client.as_ref()
      .ok_or(ClientError::ClientNotConfigured(ClientType::GrokApi))
  }

  pub fn get_kinovi_web_client_ref(&self) -> Result<&RouterKinoviWebClient, ClientError> {
    self.kinovi_web_client.as_ref()
      .ok_or(ClientError::ClientNotConfigured(ClientType::KinoviWeb))
  }

  pub fn get_worldlabs_client_ref(&self) -> Result<&RouterWorldLabsClient, ClientError> {
    self.worldlabs_client.as_ref()
      .ok_or(ClientError::ClientNotConfigured(ClientType::WorldLabs))
  }
}
