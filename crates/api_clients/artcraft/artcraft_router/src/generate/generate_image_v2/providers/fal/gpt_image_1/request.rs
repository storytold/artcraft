use std::fmt::Debug;
use std::sync::Arc;

use fal_client::requests::api::image::edit::gpt_image_1_edit_image::api::GptImage1EditImageRequest;
use fal_client::requests::api::image::text::gpt_image_1_text_to_image::api::GptImage1TextToImageRequest;
use fal_client::requests::traits::fal_endpoint_trait::FalEndpoint;

use crate::client::router_fal_webhook_optional_client::RouterFalWebhookOptionalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_image::generate_image_response::{FalImageResponsePayload, GenerateImageResponse};

#[derive(Clone, Debug)]
pub enum FalGptImage1RequestState {
  TextToImage(GptImage1TextToImageRequest),
  EditImage(GptImage1EditImageRequest),
}

impl FalGptImage1RequestState {
  pub async fn send(&self, client: &RouterFalWebhookOptionalClient) -> Result<GenerateImageResponse, ArtcraftRouterError> {
    match self {
      Self::TextToImage(request) => send_request(request, client).await,
      Self::EditImage(request) => send_request(request, client).await,
    }
  }
}

struct FalResponseIds {
  request_id: Option<String>,
  gateway_request_id: Option<String>,
  status_url: Option<String>,
  response_url: Option<String>,
}

async fn send_request<T>(request: &T, client: &RouterFalWebhookOptionalClient) -> Result<GenerateImageResponse, ArtcraftRouterError>
where
  T: FalEndpoint + Clone + Debug + Send + Sync + 'static,
{
  let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());
  let payload = send_fal_request(request, client).await?;
  Ok(GenerateImageResponse::Fal(FalImageResponsePayload {
    request_id: payload.request_id,
    gateway_request_id: payload.gateway_request_id,
    maybe_status_url: payload.status_url,
    maybe_response_url: payload.response_url,
    maybe_outbound_request: Some(outbound),
  }))
}

async fn send_fal_request<T: FalEndpoint>(
  request: &T,
  client: &RouterFalWebhookOptionalClient,
) -> Result<FalResponseIds, ArtcraftRouterError> {
  if let Some(webhook_url) = &client.webhook_url {
    let response = request.send_webhook_request(&client.api_key, webhook_url).await?;
    Ok(FalResponseIds {
      request_id: response.request_id,
      gateway_request_id: response.gateway_request_id,
      status_url: None,
      response_url: None,
    })
  } else {
    let response = request.send_queue_request(&client.api_key).await?;
    Ok(FalResponseIds {
      request_id: Some(response.request_id),
      gateway_request_id: None,
      status_url: Some(response.status_url),
      response_url: Some(response.response_url),
    })
  }
}
