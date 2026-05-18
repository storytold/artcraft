use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_video_cost_and_generate_request::OmniGenVideoCostAndGenerateRequest;
use artcraft_client::endpoints::omni_gen::generate::video::omni_gen_video::omni_gen_video_generate;

use crate::client::router_artcraft_client::RouterArtcraftClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video_response::{
  ArtcraftVideoResponsePayload, GenerateVideoResponse,
};

#[derive(Clone, Debug)]
pub struct ArtcraftPreviewModelFastRequestState {
  /// Final materialized request; ready to fire via the omni-gen video endpoint.
  pub request: OmniGenVideoCostAndGenerateRequest,
}

impl ArtcraftPreviewModelFastRequestState {
  pub async fn send(&self, client: &RouterArtcraftClient) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
    let response = omni_gen_video_generate(
      &client.api_host,
      Some(&client.credentials),
      self.request.clone(),
    )
      .await
      .map_err(|err| ArtcraftRouterError::Provider(ProviderError::Storyteller(err)))?;

    Ok(GenerateVideoResponse::Artcraft(ArtcraftVideoResponsePayload {
      inference_job_token: response.inference_job_token.clone(),
      all_inference_job_tokens: vec![response.inference_job_token],
    }))
  }
}
