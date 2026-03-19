use std::marker::PhantomData;

use reqwest::IntoUrl;
use serde::{de::DeserializeOwned, Serialize};
use log::info;

use crate::error::fal_error::FalError;
use crate::requests::api::queue::Queue;
use crate::requests::api::queue_response::QueueResponse;
use crate::requests::api::webhook_response::WebhookResponse;

/// A request to the FAL API.
///
/// Originally from the vendored `fal` crate (`fal::request::FalRequest`).
/// Copied here so `fal_client` can be independent of the vendored crate.
#[derive(Debug)]
pub struct FalRequest<Params: Serialize, Response: DeserializeOwned> {
  /// The Reqwest Client to use to make requests
  pub client: reqwest::Client,
  /// The endpoint to make the request to
  pub endpoint: String,
  /// The parameters to send to the endpoint
  pub params: Params,
  /// The API key to use to make the request.
  /// If not provided, the `FAL_API_KEY` environment variable will be used.
  pub api_key: Option<String>,
  phantom: PhantomData<Response>,
}

impl<Params: Serialize, Response: DeserializeOwned> FalRequest<Params, Response> {
  pub fn new(endpoint: impl Into<String>, params: Params) -> Self {
    Self {
      client: reqwest::Client::new(),
      endpoint: endpoint.into(),
      params,
      api_key: std::env::var("FAL_API_KEY").ok(),
      phantom: PhantomData,
    }
  }

  /// Use a specific Reqwest Client to make requests
  pub fn with_client(mut self, client: reqwest::Client) -> Self {
    self.client = client;
    self
  }

  /// Use a specific API key to make requests
  pub fn with_api_key(mut self, api_key: impl Into<String>) -> Self {
    self.api_key = Some(api_key.into());
    self
  }

  /// Send the request and wait for the response
  pub async fn send(self) -> Result<Response, FalError> {
    let response = self
      .client
      .post(format!("https://fal.run/{}", self.endpoint))
      .json(&self.params)
      .header(
        "Authorization",
        format!(
          "Key {}",
          self.api_key.expect(
            "No fal API key provided, and FAL_API_KEY environment variable is not set"
          )
        ),
      )
      .header("Content-Type", "application/json")
      .send()
      .await?;

    if response.status() != 200 {
      let error = response.text().await?;
      return Err(error.into());
    }

    Ok(response.error_for_status()?.json().await?)
  }

  /// Submit the request to the Fal queue system.
  pub async fn queue(self) -> Result<Queue<Response>, FalError> {
    let key = self
      .api_key
      .expect("No fal API key provided, and FAL_API_KEY environment variable is not set");

    let response = self
      .client
      .post(format!("https://queue.fal.run/{}", self.endpoint))
      .json(&self.params)
      .header("Authorization", format!("Key {}", &key))
      .header("Content-Type", "application/json")
      .send()
      .await?;

    if response.status() != 200 {
      let error = response.text().await?;
      return Err(error.into());
    }

    let payload: QueueResponse = response.error_for_status()?.json().await?;

    Ok(Queue::new(self.client, self.endpoint, key, payload))
  }

  /// Submit the request to the Fal queue with a webhook callback URL.
  pub async fn queue_webhook<U: IntoUrl>(self, url: U) -> Result<WebhookResponse, FalError> {
    let key = self
      .api_key
      .expect("No fal API key provided, and FAL_API_KEY environment variable is not set");

    let url_encoded = url.into_url()?;

    let request_url = format!("https://queue.fal.run/{}?fal_webhook={}", self.endpoint, url_encoded);

    info!("Sending request to FAL queue webhook: {}", request_url);

    let response = self
      .client
      .post(request_url)
      .json(&self.params)
      .header("Authorization", format!("Key {}", &key))
      .header("Content-Type", "application/json")
      .send()
      .await?;

    if response.status() != 200 {
      let error = response.text().await?;
      return Err(error.into());
    }

    let payload: WebhookResponse = response.error_for_status()?.json().await?;

    Ok(payload)
  }
}
