use crate::client::multi_router_client::MultiRouterClient;
use crate::client::router_artcraft_client::RouterArtcraftClient;
use crate::errors::client_error::ClientError;

pub enum RouterClient {
  Multi(MultiRouterClient),
  Artcraft(RouterArtcraftClient),
}

impl RouterClient {
  pub fn get_artcraft_client_ref(&self) -> Result<&RouterArtcraftClient, ClientError> {
    match self {
      RouterClient::Artcraft(client) => Ok(client),
      RouterClient::Multi(multi) => multi.get_artcraft_client_ref(),
    }
  }
}
