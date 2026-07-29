use std::fmt::Debug;
use std::sync::Arc;

use fal_client::requests::traits::fal_endpoint_trait::FalEndpoint;

use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_splat::generate_splat_response::{
  FalSplatResponsePayload, GenerateSplatResponse,
};

/// Send a splat request to fal using the client's dispatch mode (webhook or
/// queue). Shared by all Fal splat request states.
pub(crate) async fn send_fal_splat_request<R>(
  request: &R,
  client: &RouterFalClient,
) -> Result<GenerateSplatResponse, ArtcraftRouterError>
where
  R: FalEndpoint + Clone + Debug + Send + Sync + 'static,
{
  let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());

  let payload = if let Some(webhook_url) = &client.webhook_url {
    let response = request.send_webhook_request(&client.api_key, webhook_url).await?;
    FalSplatResponsePayload {
      request_id: response.request_id,
      gateway_request_id: response.gateway_request_id,
      maybe_status_url: None,
      maybe_response_url: None,
      maybe_outbound_request: Some(outbound),
    }
  } else {
    let response = request.send_queue_request(&client.api_key).await?;
    FalSplatResponsePayload {
      request_id: Some(response.request_id),
      gateway_request_id: None,
      maybe_status_url: Some(response.status_url),
      maybe_response_url: Some(response.response_url),
      maybe_outbound_request: Some(outbound),
    }
  };

  Ok(GenerateSplatResponse::Fal(payload))
}
