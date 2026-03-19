use std::marker::PhantomData;

use serde::{de::DeserializeOwned, Deserialize, Serialize};

use crate::error::fal_error::FalError;
use crate::requests::api::queue_response::QueueResponse;
use crate::requests::api::queue_status::QueueStatus;

#[derive(Debug, Serialize, Deserialize)]
pub struct Queue<Response: DeserializeOwned> {
  #[serde(skip)]
  pub client: Option<reqwest::Client>,
  pub endpoint: String,
  pub api_key: String,
  pub payload: QueueResponse,
  phantom: PhantomData<Response>,
}

impl<Response: DeserializeOwned> Queue<Response> {
  pub fn new(
    client: reqwest::Client,
    endpoint: impl Into<String>,
    api_key: String,
    payload: QueueResponse,
  ) -> Self {
    Self {
      client: Some(client),
      endpoint: endpoint.into(),
      api_key,
      payload,
      phantom: PhantomData,
    }
  }

  /// Get the status of the Queue request
  pub async fn status(&self, show_logs: bool) -> Result<QueueStatus, FalError> {
    let response = self
      .client
      .as_ref()
      .unwrap()
      .get(&self.payload.status_url)
      .query(&[("logs", if show_logs { "1" } else { "0" })])
      .header("Authorization", format!("Key {}", self.api_key))
      .header("Content-Type", "application/json")
      .send()
      .await?;

    Ok(response.error_for_status()?.json().await?)
  }

  /// Get the response of the Queue request, if the request is Completed
  pub async fn response(&self) -> Result<Response, FalError> {
    let response = self
      .client
      .as_ref()
      .unwrap()
      .get(&self.payload.response_url)
      .header("Authorization", format!("Key {}", self.api_key))
      .header("Content-Type", "application/json")
      .send()
      .await?;

    if response.status() != 200 {
      let error = response.text().await?;
      return Err(error.into());
    }

    Ok(response.error_for_status()?.json().await?)
  }

  /// Cancel the Queue request
  pub async fn cancel(&self) -> Result<(), FalError> {
    let response = self
      .client
      .as_ref()
      .unwrap()
      .put(&self.payload.cancel_url)
      .header("Authorization", format!("Key {}", self.api_key))
      .send()
      .await?;

    response.error_for_status()?;

    Ok(())
  }
}
