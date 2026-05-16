use gmicloud_client::requests::api::video::seedance_2_0_260128::api::Seedance20Request;

use crate::client::router_gmicloud_client::RouterGmiCloudClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video_response::{
  GenerateVideoResponse, GmiCloudVideoResponsePayload,
};

#[derive(Clone, Debug)]
pub struct GmiCloudSeedance2p0GRequestState {
  pub request: Seedance20Request,
}

impl GmiCloudSeedance2p0GRequestState {
  pub async fn send(&self, client: &RouterGmiCloudClient) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
    let response = self.request.send_request(&client.api_key)
      .await
      .map_err(|err| ArtcraftRouterError::Provider(ProviderError::GmiCloud(err)))?;

    Ok(GenerateVideoResponse::GmiCloud(GmiCloudVideoResponsePayload {
      request_id: response.request_id,
    }))
  }
}
