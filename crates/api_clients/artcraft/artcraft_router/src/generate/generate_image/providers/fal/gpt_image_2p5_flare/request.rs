use fal_client::requests::api::image::edit::gpt_image_2p5_flare_edit_image::api::GptImage2p5FlareEditImageRequest;
use fal_client::requests::api::image::text::gpt_image_2p5_flare_text_to_image::api::GptImage2p5FlareTextToImageRequest;

use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_image::generate_image_response::GenerateImageResponse;
use crate::generate::generate_image::providers::fal::gpt_image_2p5_common::send::send_gpt_image_2p5_request;

#[derive(Clone, Debug)]
pub enum FalGptImage2p5FlareRequestState {
  TextToImage(GptImage2p5FlareTextToImageRequest),
  EditImage(GptImage2p5FlareEditImageRequest),
}

impl FalGptImage2p5FlareRequestState {
  pub async fn send(&self, client: &RouterFalClient) -> Result<GenerateImageResponse, ArtcraftRouterError> {
    match self {
      Self::TextToImage(request) => send_gpt_image_2p5_request(request, client).await,
      Self::EditImage(request) => send_gpt_image_2p5_request(request, client).await,
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use fal_client::creds::fal_api_key::FalApiKey;
  use fal_client::requests::api::image::common::gpt_image_2_resolution::GptImage2Resolution;
  use fal_client::requests::api::image::common::gpt_image_2p5::gpt_image_2p5_edit_image_params::GptImage2p5EditImageParams;
  use fal_client::requests::api::image::common::gpt_image_2p5::gpt_image_2p5_image_size::GptImage2p5ImageSize;
  use fal_client::requests::api::image::common::gpt_image_2p5::gpt_image_2p5_num_images::GptImage2p5NumImages;
  use fal_client::requests::api::image::common::gpt_image_2p5::gpt_image_2p5_quality::GptImage2p5Quality;
  use fal_client::requests::api::image::common::gpt_image_2p5::gpt_image_2p5_text_to_image_params::GptImage2p5TextToImageParams;
  use test_data::web::image_urls::JUNO_AT_LAKE_IMAGE_URL;

  #[tokio::test]
  #[ignore] // requires real API key, incurs cost
  async fn send_text_to_image_webhook() {
    let request = FalGptImage2p5FlareRequestState::TextToImage(GptImage2p5FlareTextToImageRequest {
      params: GptImage2p5TextToImageParams {
        prompt: "a polished product photo of a glass compass".to_string(),
        num_images: GptImage2p5NumImages::One,
        image_size: Some(GptImage2p5ImageSize::Square),
        resolution: Some(GptImage2Resolution::OneK),
        quality: Some(GptImage2p5Quality::Low),
        background: None,
        output_format: None,
        output_compression: None,
      },
    });
    let response = request.send(&client_with_webhook()).await.expect("send should succeed");
    let payload = response.get_fal_payload().expect("expected Fal payload");
    assert!(payload.request_id.is_some() || payload.gateway_request_id.is_some());
  }

  #[tokio::test]
  #[ignore] // requires real API key, incurs cost
  async fn send_edit_image_webhook() {
    let request = FalGptImage2p5FlareRequestState::EditImage(GptImage2p5FlareEditImageRequest {
      params: GptImage2p5EditImageParams {
        prompt: "make this look like an elegant magazine cover image".to_string(),
        image_urls: vec![JUNO_AT_LAKE_IMAGE_URL.to_string()],
        mask_url: None,
        num_images: GptImage2p5NumImages::One,
        image_size: Some(GptImage2p5ImageSize::Square),
        resolution: Some(GptImage2Resolution::OneK),
        quality: Some(GptImage2p5Quality::Low),
        background: None,
        output_format: None,
        output_compression: None,
      },
    });
    let response = request.send(&client_with_webhook()).await.expect("send should succeed");
    let payload = response.get_fal_payload().expect("expected Fal payload");
    assert!(payload.request_id.is_some() || payload.gateway_request_id.is_some());
  }

  fn client_with_webhook() -> RouterFalClient {
    let secret = std::fs::read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")
      .expect("Failed to read fal_api_key.txt");
    RouterFalClient::new_with_webhook(
      FalApiKey::from_str(secret.trim()),
      "https://example.com/fal-webhook-test".to_string(),
    )
  }
}
