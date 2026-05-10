use reqwest::IntoUrl;
use crate::creds::fal_api_key::FalApiKey;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::core_api::fal_request::FalRequest;
use crate::requests::core_api::queue_response::QueueResponse;
use crate::requests::core_api::webhook_response::WebhookResponse;
use serde::de::DeserializeOwned;
use serde::Serialize;

pub trait FalEndpoint {
  /// Fal endpoint, eg. `fal-ai/flux-2-lora-gallery/multiple-angles`
  const ENDPOINT : &'static str;

  /// Shape of the Fal request for the endpoint
  type RawRequest : Serialize;

  /// Shape of the Fal response for the endpoint
  type RawResponse : DeserializeOwned;

  fn get_endpoint() -> &'static str {
    Self::ENDPOINT
  }

  async fn send_webhook_request<U: IntoUrl>(&self, api_key: &FalApiKey, webhook_url: U) -> Result<WebhookResponse, FalErrorPlus> {
    let request = self.to_raw_request()?;
    let request = FalRequest::<Self::RawRequest, Self::RawResponse>::new(Self::ENDPOINT, request);
    let result = request.with_api_key(&api_key.0)
        .queue_webhook(webhook_url)
        .await?;
    Ok(result)
  }

  async fn send_queue_request(&self, api_key: &FalApiKey) -> Result<QueueResponse, FalErrorPlus> {
    let request = self.to_raw_request()?;
    let request = FalRequest::<Self::RawRequest, Self::RawResponse>::new(Self::ENDPOINT, request);
    let result = request.with_api_key(&api_key.0)
        .queue_request()
        .await?;
    Ok(result)
  }

  /// Convert request to the over-the-wire representation
  /// This allows us to change the shape, types, etc.
  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus>;
}
