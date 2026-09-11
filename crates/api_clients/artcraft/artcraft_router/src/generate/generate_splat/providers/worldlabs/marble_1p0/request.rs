use crate::client::router_worldlabs_client::RouterWorldLabsClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_splat::generate_splat_response::GenerateSplatResponse;
use crate::generate::generate_splat::providers::worldlabs::request_common::WorldLabsSplatRequest;

#[derive(Clone, Debug)]
pub struct WorldLabsMarble1p0RequestState {
  /// Final materialized request; ready to fire. Media references (if any)
  /// have been uploaded as World Labs media assets by the draft phase.
  pub request: WorldLabsSplatRequest,
}

impl WorldLabsMarble1p0RequestState {
  pub async fn send(&self, client: &RouterWorldLabsClient) -> Result<GenerateSplatResponse, ArtcraftRouterError> {
    self.request.send(client).await
  }
}
