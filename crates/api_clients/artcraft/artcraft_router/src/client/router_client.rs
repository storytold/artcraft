use crate::client::multi_router_client::MultiRouterClient;
use crate::client::router_artcraft_client::RouterArtcraftClient;
use crate::client::router_fal_client::RouterFalClient;
use crate::client::router_gmicloud_client::RouterGmiCloudClient;
use crate::client::router_grok_api_client::RouterGrokApiClient;
use crate::client::router_kinovi_web_client::RouterKinoviWebClient;
use crate::client::router_worldlabs_client::RouterWorldLabsClient;
use crate::errors::client_error::{ClientError, ClientType};

pub enum RouterClient {
  Multi(MultiRouterClient),
  Artcraft(RouterArtcraftClient),
  Fal(RouterFalClient),
  GmiCloud(RouterGmiCloudClient),
  GrokApi(RouterGrokApiClient),
  KinoviWeb(RouterKinoviWebClient),
  WorldLabs(RouterWorldLabsClient),
}

impl RouterClient {
  pub fn get_artcraft_client_ref(&self) -> Result<&RouterArtcraftClient, ClientError> {
    match self {
      RouterClient::Artcraft(client) => Ok(client),
      RouterClient::Multi(multi) => multi.get_artcraft_client_ref(),
      _ => Err(ClientError::ClientNotConfigured(ClientType::Artcraft)),
    }
  }

  pub fn get_fal_client_ref(&self) -> Result<&RouterFalClient, ClientError> {
    match self {
      RouterClient::Fal(client) => Ok(client),
      RouterClient::Multi(multi) => multi.get_fal_client_ref(),
      _ => Err(ClientError::ClientNotConfigured(ClientType::Fal)),
    }
  }

  pub fn get_gmicloud_client_ref(&self) -> Result<&RouterGmiCloudClient, ClientError> {
    match self {
      RouterClient::GmiCloud(client) => Ok(client),
      RouterClient::Multi(multi) => multi.get_gmicloud_client_ref(),
      _ => Err(ClientError::ClientNotConfigured(ClientType::GmiCloud)),
    }
  }

  pub fn get_grok_api_client_ref(&self) -> Result<&RouterGrokApiClient, ClientError> {
    match self {
      RouterClient::GrokApi(client) => Ok(client),
      RouterClient::Multi(multi) => multi.get_grok_api_client_ref(),
      _ => Err(ClientError::ClientNotConfigured(ClientType::GrokApi)),
    }
  }

  pub fn get_kinovi_web_client_ref(&self) -> Result<&RouterKinoviWebClient, ClientError> {
    match self {
      RouterClient::KinoviWeb(client) => Ok(client),
      RouterClient::Multi(multi) => multi.get_kinovi_web_client_ref(),
      _ => Err(ClientError::ClientNotConfigured(ClientType::KinoviWeb)),
    }
  }

  pub fn get_worldlabs_client_ref(&self) -> Result<&RouterWorldLabsClient, ClientError> {
    match self {
      RouterClient::WorldLabs(client) => Ok(client),
      RouterClient::Multi(multi) => multi.get_worldlabs_client_ref(),
      _ => Err(ClientError::ClientNotConfigured(ClientType::WorldLabs)),
    }
  }
}
