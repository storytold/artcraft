//! A handle to one job that was submitted to the fal queue.
//!
//! Created by `FalRequest::queue()`. It remembers the URLs fal returned for that job and
//! offers the three follow-up calls: check status, fetch the finished result, cancel.
//! (Nothing else in the workspace calls `FalRequest::queue()` today; the model functions use
//! `queue_request` or `queue_webhook` and poll by request id through the `polling` module.)

// Zero-sized marker so the struct can remember its `Response` type without storing one.
use std::marker::PhantomData;

use serde::{de::DeserializeOwned, Deserialize, Serialize};

use crate::error::fal_error::FalError;
use crate::requests::core_api::queue_response::QueueResponse;
use crate::requests::core_api::queue_status::QueueStatus;

/// A submitted fal queue job. `Response` is the type the finished result deserializes into.
#[derive(Debug, Serialize, Deserialize)]
pub struct Queue<Response: DeserializeOwned> {
  /// HTTP client used for the follow-up calls. Skipped when serializing, so it is `None`
  /// after a `Queue` is restored from JSON (see `http_client`).
  #[serde(skip)]
  pub client: Option<reqwest::Client>,
  /// The fal model endpoint the job was submitted to.
  pub endpoint: String,
  /// API key reused for the status/response/cancel calls.
  pub api_key: String,
  /// The request id and URLs fal returned when the job was queued.
  pub payload: QueueResponse,
  phantom: PhantomData<Response>,
}

impl<Response: DeserializeOwned> Queue<Response> {
  /// Wrap the reply from a queue submission. Called by `FalRequest::queue()`.
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

  /// FIX: `client` is `#[serde(skip)]`, so a `Queue` restored via `Deserialize` has `client == None`;
  /// the previous `.as_ref().unwrap()` panicked on the first status/response/cancel call.
  /// Fall back to a fresh client (reqwest::Client is a cheap Arc-backed handle).
  fn http_client(&self) -> reqwest::Client {
    self.client.clone().unwrap_or_default()
  }

  /// Get the status of the Queue request
  ///
  /// The status is one of in queue, in progress or completed.
  /// `show_logs` asks fal to include the model's log lines in the reply.
  /// Errors: transport error, non-2xx status, or an unparseable body.
  pub async fn status(&self, show_logs: bool) -> Result<QueueStatus, FalError> {
    let response = self
      .http_client()
      .get(&self.payload.status_url)
      .query(&[("logs", if show_logs { "1" } else { "0" })])
      .header("Authorization", format!("Key {}", self.api_key))
      .header("Content-Type", "application/json")
      .send()
      .await?;

    Ok(response.error_for_status()?.json().await?)
  }

  /// Get the response of the Queue request, if the request is Completed
  ///
  /// Errors: a non-200 reply (for example the job is not finished yet) comes back as a
  /// `FalError` built from fal's body text; also transport and JSON-parse errors.
  pub async fn response(&self) -> Result<Response, FalError> {
    let response = self
      .http_client()
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
  ///
  /// Errors: transport error or a non-2xx reply (fal may refuse if the job already finished).
  pub async fn cancel(&self) -> Result<(), FalError> {
    let response = self
      .http_client()
      .put(&self.payload.cancel_url)
      .header("Authorization", format!("Key {}", self.api_key))
      .send()
      .await?;

    response.error_for_status()?;

    Ok(())
  }
}
