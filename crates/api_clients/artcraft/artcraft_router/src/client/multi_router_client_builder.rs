use crate::client::multi_router_client::MultiRouterClient;
use crate::client::router_artcraft_client::RouterArtcraftClient;
use crate::client::router_fal_client::RouterFalClient;
use crate::client::router_gmicloud_client::RouterGmiCloudClient;
use crate::client::router_grok_api_client::RouterGrokApiClient;
use crate::client::router_seedance2pro_client::RouterSeedance2ProClient;

pub struct MultiRouterClientBuilder {
  artcraft_client: Option<RouterArtcraftClient>,
  fal_client: Option<RouterFalClient>,
  gmicloud_client: Option<RouterGmiCloudClient>,
  grok_api_client: Option<RouterGrokApiClient>,
  seedance2pro_client: Option<RouterSeedance2ProClient>,
}

impl MultiRouterClientBuilder {
  pub fn new() -> Self {
    Self {
      artcraft_client: None,
      fal_client: None,
      gmicloud_client: None,
      grok_api_client: None,
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

  pub fn set_gmicloud_client(mut self, client: RouterGmiCloudClient) -> Self {
    self.gmicloud_client = Some(client);
    self
  }

  pub fn set_grok_api_client(mut self, client: RouterGrokApiClient) -> Self {
    self.grok_api_client = Some(client);
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
      gmicloud_client: self.gmicloud_client,
      grok_api_client: self.grok_api_client,
      seedance2pro_client: self.seedance2pro_client,
    }
  }
}
