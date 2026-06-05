use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_image_cost_and_generate_request::OmniGenImageCostAndGenerateRequest;
use artcraft_client::endpoints::omni_gen::generate::image::omni_gen_image::omni_gen_image_generate;

use crate::client::router_artcraft_client::RouterArtcraftClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_image::generate_image_response::{
  ArtcraftImageResponsePayload, GenerateImageResponse,
};

/// Send an image generation request to the Artcraft omni-gen image endpoint.
/// All Artcraft model request states delegate to this function.
pub async fn send_artcraft_omni_image_request(
  request: &OmniGenImageCostAndGenerateRequest,
  client: &RouterArtcraftClient,
) -> Result<GenerateImageResponse, ArtcraftRouterError> {
  let response = omni_gen_image_generate(
    &client.api_host,
    Some(&client.credentials),
    request.clone(),
  )
    .await
    .map_err(|err| ArtcraftRouterError::Provider(ProviderError::Storyteller(err)))?;

  Ok(GenerateImageResponse::Artcraft(ArtcraftImageResponsePayload {
    inference_job_token: response.inference_job_token,
  }))
}
