use crate::client::router_artcraft_client::RouterArtcraftClient;
use crate::client::multi_router_client::MultiRouterClient;

pub struct MultiRouterClientBuilder {
  artcraft_client: Option<RouterArtcraftClient>,
}

impl MultiRouterClientBuilder {
  pub fn new() -> Self {
    Self {
      artcraft_client: None,
    }
  }

  pub fn set_artcraft_client(mut self, client: RouterArtcraftClient) -> Self {
    self.artcraft_client = Some(client);
    self
  }

  pub fn build(self) -> MultiRouterClient {
    MultiRouterClient {
      artcraft_client: self.artcraft_client,
    }
  }
}
