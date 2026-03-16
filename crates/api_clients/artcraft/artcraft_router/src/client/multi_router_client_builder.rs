use crate::client::multi_router_client::MultiRouterClient;
use crate::client::router_artcraft_client::RouterArtcraftClient;
use crate::client::router_fal_client::RouterFalClient;
use crate::client::router_muapi_client::RouterMuapiClient;
use crate::client::router_seedance2pro_client::RouterSeedance2ProClient;

pub struct MultiRouterClientBuilder {
  artcraft_client: Option<RouterArtcraftClient>,
  fal_client: Option<RouterFalClient>,
  muapi_client: Option<RouterMuapiClient>,
  seedance2pro_client: Option<RouterSeedance2ProClient>,
}

impl MultiRouterClientBuilder {
  pub fn new() -> Self {
    Self {
      artcraft_client: None,
      fal_client: None,
      muapi_client: None,
      seedance2pro_client: None,
    }
  }

  pub fn set_artcraft_client(mut self, client: RouterArtcraftClient) -> Self {
    self.artcraft_client = Some(client);
    self
  }

  pub fn set_fal_client(mut self, client: RouterFalClient) -> Self {
    self.fal_client = Some(client);
    self
  }

  pub fn set_muapi_client(mut self, client: RouterMuapiClient) -> Self {
    self.muapi_client = Some(client);
    self
  }

  pub fn set_seedance2pro_client(mut self, client: RouterSeedance2ProClient) -> Self {
    self.seedance2pro_client = Some(client);
    self
  }

  pub fn build(self) -> MultiRouterClient {
    MultiRouterClient {
      artcraft_client: self.artcraft_client,
      fal_client: self.fal_client,
      muapi_client: self.muapi_client,
      seedance2pro_client: self.seedance2pro_client,
    }
  }
}
