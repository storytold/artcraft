use crate::client::multi_router_client::MultiRouterClient;
use crate::client::router_artcraft_client::RouterArtcraftClient;
use crate::client::router_fal_client::RouterFalClient;
use crate::client::router_muapi_client::RouterMuapiClient;
use crate::client::router_seedance2pro_client::RouterSeedance2ProClient;
use crate::errors::client_error::{ClientError, ClientType};

pub enum RouterClient {
  Multi(MultiRouterClient),
  Artcraft(RouterArtcraftClient),
  Fal(RouterFalClient),
  Muapi(RouterMuapiClient),
  Seedance2Pro(RouterSeedance2ProClient),
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

  pub fn get_muapi_client_ref(&self) -> Result<&RouterMuapiClient, ClientError> {
    match self {
      RouterClient::Muapi(client) => Ok(client),
      RouterClient::Multi(multi) => multi.get_muapi_client_ref(),
      _ => Err(ClientError::ClientNotConfigured(ClientType::Muapi)),
    }
  }

  pub fn get_seedance2pro_client_ref(&self) -> Result<&RouterSeedance2ProClient, ClientError> {
    match self {
      RouterClient::Seedance2Pro(client) => Ok(client),
      RouterClient::Multi(multi) => multi.get_seedance2pro_client_ref(),
      _ => Err(ClientError::ClientNotConfigured(ClientType::Seedance2Pro)),
    }
  }
}
