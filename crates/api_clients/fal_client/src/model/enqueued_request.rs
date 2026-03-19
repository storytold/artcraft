use crate::creds::fal_api_key::FalApiKey;
use crate::model::fal_endpoint::FalEndpoint;
use crate::model::fal_request_id::FalRequestId;
use crate::requests::api::queue::Queue;
use crate::requests::api::queue_response::QueueResponse;
use errors::AnyhowResult;
use reqwest::Client;
use serde::de::DeserializeOwned;

#[derive(Clone, Debug)]
pub struct EnqueuedRequest {
  pub fal_endpoint: FalEndpoint,
  pub request_id: FalRequestId,
  pub response_url: String,
  pub status_url: String,
  pub cancel_url: String,
}

impl EnqueuedRequest {
  pub fn from_queue_response<R: DeserializeOwned>(queue: &Queue<R>) -> AnyhowResult<Self> {
    let endpoint = FalEndpoint::from_queue_response(queue);
    Ok(Self {
      fal_endpoint: endpoint.clone(),
      request_id: FalRequestId(queue.payload.request_id.clone()),
      response_url: queue.payload.response_url.clone(),
      status_url: queue.payload.status_url.clone(),
      cancel_url: queue.payload.cancel_url.clone(),
    })
  }

  pub fn to_queue_response<R: DeserializeOwned>(&self, api_key: &FalApiKey) -> AnyhowResult<Queue<R>> {
    let client = Client::new();
    let endpoint = self.fal_endpoint.url();
    let payload = QueueResponse {
      request_id: self.request_id.0.clone(),
      response_url: self.response_url.clone(),
      status_url: self.status_url.clone(),
      cancel_url: self.cancel_url.clone(),
    };
    Ok(Queue::new(client, endpoint, api_key.0.clone(), payload))
  }
}
