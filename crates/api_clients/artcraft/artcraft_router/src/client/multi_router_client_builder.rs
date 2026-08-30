use crate::client::multi_router_client::MultiRouterClient;
use crate::client::router_artcraft_client::RouterArtcraftClient;
use crate::client::router_fal_client::RouterFalClient;
use crate::client::router_gmicloud_client::RouterGmiCloudClient;
use crate::client::router_grok_api_client::RouterGrokApiClient;
use crate::client::router_kinovi_web_client::RouterKinoviWebClient;
use crate::client::router_worldlabs_client::RouterWorldLabsClient;

pub struct MultiRouterClientBuilder {
  artcraft_client: Option<RouterArtcraftClient>,
  fal_client: Option<RouterFalClient>,
  gmicloud_client: Option<RouterGmiCloudClient>,
  grok_api_client: Option<RouterGrokApiClient>,
  kinovi_web_client: Option<RouterKinoviWebClient>,
  worldlabs_client: Option<RouterWorldLabsClient>,
}

impl MultiRouterClientBuilder {
  pub fn new() -> Self {
    Self {
      artcraft_client: None,
      fal_client: None,
      gmicloud_client: None,
      grok_api_client: None,
      kinovi_web_client: None,
      worldlabs_client: None,
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

  pub fn set_kinovi_web_client(mut self, client: RouterKinoviWebClient) -> Self {
    self.kinovi_web_client = Some(client);
    self
  }

  pub fn set_worldlabs_client(mut self, client: RouterWorldLabsClient) -> Self {
    self.worldlabs_client = Some(client);
    self
  }

  pub fn build(self) -> MultiRouterClient {
    MultiRouterClient {
      artcraft_client: self.artcraft_client,
      fal_client: self.fal_client,
      gmicloud_client: self.gmicloud_client,
      grok_api_client: self.grok_api_client,
      kinovi_web_client: self.kinovi_web_client,
      worldlabs_client: self.worldlabs_client,
    }
  }
}
