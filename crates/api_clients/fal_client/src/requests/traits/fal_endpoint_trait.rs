use crate::creds::fal_api_key::FalApiKey;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::core_api::fal_request::FalRequest;
use crate::requests::core_api::queue_response::QueueResponse;
use crate::requests::core_api::webhook_response::WebhookResponse;
use serde::de::DeserializeOwned;
use serde::Serialize;

pub trait FalEndpoint {
  type RawRequest : Serialize;
  type RawResponse : DeserializeOwned;

  /// Return the endpoint, eg. `fal-ai/flux-2-lora-gallery/multiple-angles`
  fn get_endpoint() -> &'static str;

  /// Return the request-form of the typed request.
  fn to_request(&self) -> Result<FalRequest<Self::RawRequest, Self::RawResponse>, FalErrorPlus>;

  async fn send_webhook_request(&self, api_key: &FalApiKey, webhook_url: &str) -> Result<WebhookResponse, FalErrorPlus> {
    let request = self.to_request()?;
    let result = request.with_api_key(&api_key.0)
        .queue_webhook(webhook_url)
        .await?;
    Ok(result)
  }

  async fn send_queue_request(&self, api_key: &FalApiKey) -> Result<QueueResponse, FalErrorPlus> {
    let request = self.to_request()?;
    let result = request.with_api_key(&api_key.0)
        .queue_request()
        .await?;
    Ok(result)
  }
}
