use crate::client::multi_router_client::MultiRouterClient;
use crate::client::router_artcraft_client::RouterArtcraftClient;
use crate::client::router_fal_client::RouterFalClient;

pub struct MultiRouterClientBuilder {
  artcraft_client: Option<RouterArtcraftClient>,
  fal_client: Option<RouterFalClient>,
}

impl MultiRouterClientBuilder {
  pub fn new() -> Self {
    Self {
      artcraft_client: None,
      fal_client: None,
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

  pub fn build(self) -> MultiRouterClient {
    MultiRouterClient {
      artcraft_client: self.artcraft_client,
      fal_client: self.fal_client,
    }
  }
}
