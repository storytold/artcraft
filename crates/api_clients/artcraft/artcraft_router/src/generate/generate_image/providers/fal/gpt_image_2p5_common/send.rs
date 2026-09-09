use std::fmt::Debug;
use std::sync::Arc;

use fal_client::requests::traits::fal_endpoint_trait::FalEndpoint;

use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_image::generate_image_response::{FalImageResponsePayload, GenerateImageResponse};

/// Send any GPT Image 2.5 request (Flare or Sunburst, text-to-image or edit) to Fal, via
/// webhook when the client has one configured and via the queue otherwise.
pub async fn send_gpt_image_2p5_request<T>(
  request: &T,
  client: &RouterFalClient,
) -> Result<GenerateImageResponse, ArtcraftRouterError>
where
  T: FalEndpoint + Clone + Debug + Send + Sync + 'static,
{
  let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());

  let payload = if let Some(webhook_url) = &client.webhook_url {
    let response = request.send_webhook_request(&client.api_key, webhook_url).await?;
    FalImageResponsePayload {
      request_id: response.request_id,
      gateway_request_id: response.gateway_request_id,
      maybe_status_url: None,
      maybe_response_url: None,
      maybe_outbound_request: Some(outbound),
    }
  } else {
    let response = request.send_queue_request(&client.api_key).await?;
    FalImageResponsePayload {
      request_id: Some(response.request_id),
      gateway_request_id: None,
      maybe_status_url: Some(response.status_url),
      maybe_response_url: Some(response.response_url),
      maybe_outbound_request: Some(outbound),
    }
  };

  Ok(GenerateImageResponse::Fal(payload))
}
