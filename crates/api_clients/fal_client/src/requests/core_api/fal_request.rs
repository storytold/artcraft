use std::marker::PhantomData;

use reqwest::IntoUrl;
use serde::{de::DeserializeOwned, Serialize};
use log::{debug, info};

use crate::error::fal_error::FalError;
use crate::requests::core_api::queue::Queue;
use crate::requests::core_api::queue_response::QueueResponse;
use crate::requests::core_api::webhook_response::WebhookResponse;

/// Host for synchronous ("run and wait") requests.
const DEFAULT_SYNC_BASE_URL: &str = "https://fal.run";

/// Host for the asynchronous queue API (polling and webhooks).
const DEFAULT_QUEUE_BASE_URL: &str = "https://queue.fal.run";

/// A request to the FAL API.
///
/// Originally from the vendored `fal` crate (`fal::request::FalRequest`).
/// Copied here so `fal_client` can be independent of the vendored crate.
///
/// NB: `reqwest::RequestBuilder::json()` already sets `Content-Type: application/json`.
/// Do NOT add another `Content-Type` header after it: `RequestBuilder::header()` *appends*,
/// so the request would carry two `Content-Type` headers. Fal's workers then treat the body
/// as opaque bytes and fail every job with
/// "Input should be a valid dictionary or object to extract fields from" (2026-09-08 outage).
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
  /// Base URL for synchronous requests (`send`). Defaults to `https://fal.run`.
  pub sync_base_url: String,
  /// Base URL for queue requests. Defaults to `https://queue.fal.run`.
  pub queue_base_url: String,
  phantom: PhantomData<Response>,
}

impl<Params: Serialize, Response: DeserializeOwned> FalRequest<Params, Response> {
  pub fn new(endpoint: impl Into<String>, params: Params) -> Self {
    Self {
      client: reqwest::Client::new(),
      endpoint: endpoint.into(),
      params,
      api_key: std::env::var("FAL_API_KEY").ok(),
      sync_base_url: DEFAULT_SYNC_BASE_URL.to_string(),
      queue_base_url: DEFAULT_QUEUE_BASE_URL.to_string(),
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

  /// Override the host used for synchronous requests (tests, proxies).
  pub fn with_sync_base_url(mut self, base_url: impl Into<String>) -> Self {
    self.sync_base_url = base_url.into();
    self
  }

  /// Override the host used for queue requests (tests, proxies).
  pub fn with_queue_base_url(mut self, base_url: impl Into<String>) -> Self {
    self.queue_base_url = base_url.into();
    self
  }

  /// Send the request and wait for the response
  pub async fn send(self) -> Result<Response, FalError> {
    let response = self
      .client
      .post(format!("{}/{}", self.sync_base_url, self.endpoint))
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
      .post(format!("{}/{}", self.queue_base_url, self.endpoint))
      .json(&self.params)
      .header("Authorization", format!("Key {}", &key))
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

    let request_url = format!("{}/{}?fal_webhook={}", self.queue_base_url, self.endpoint, url_encoded);

    info!("Sending request to FAL queue webhook: {}", request_url);

    let response = self
      .client
      .post(request_url)
      .json(&self.params)
      .header("Authorization", format!("Key {}", &key))
      .send()
      .await?;

    if response.status() != 200 {
      let error = response.text().await?;
      return Err(error.into());
    }

    let payload: WebhookResponse = response.error_for_status()?.json().await?;

    Ok(payload)
  }

  /// Submit the request to the Fal queue system.
  pub async fn queue_request(self) -> Result<QueueResponse, FalError> {
    let key = self
        .api_key
        .expect("No fal API key provided, and FAL_API_KEY environment variable is not set");

    let response = self
        .client
        .post(format!("{}/{}", self.queue_base_url, self.endpoint))
        .json(&self.params)
        .header("Authorization", format!("Key {}", &key))
        .send()
        .await?;

    if response.status() != 200 {
      let error = response.text().await?;
      return Err(error.into());
    }

    let body = response.text().await?;

    debug!("Queue response: {}", body);

    let payload: QueueResponse = serde_json::from_str(&body)?;

    Ok(payload)
  }
}

#[cfg(test)]
mod tests {
  use serde::Deserialize;
  use serde_json::{json, Value};
  use tokio::io::{AsyncReadExt, AsyncWriteExt};
  use tokio::net::TcpListener;
  use tokio::task::JoinHandle;

  use super::*;

  const API_KEY: &str = "test-key-id:test-key-secret";
  const ENDPOINT: &str = "fal-ai/nano-banana-pro";
  const WEBHOOK_URL: &str = "https://example.com/v1/webhooks/fal";

  const QUEUE_RESPONSE_BODY: &str = r#"{
    "status": "IN_QUEUE",
    "request_id": "01a082d7-767c-7fb3-bae3-ce9cd1d0a360",
    "response_url": "https://queue.fal.run/fal-ai/nano-banana-pro/requests/01a082d7",
    "status_url": "https://queue.fal.run/fal-ai/nano-banana-pro/requests/01a082d7/status",
    "cancel_url": "https://queue.fal.run/fal-ai/nano-banana-pro/requests/01a082d7/cancel"
  }"#;

  const SYNC_RESPONSE_BODY: &str = r#"{"ok": true}"#;

  #[derive(Debug, Deserialize)]
  struct SyncOutput {
    ok: bool,
  }

  /// Regression tests for the 2026-09-08 fal outage: a second `Content-Type` header made fal
  /// treat the JSON body as binary, failing every job with
  /// "Input should be a valid dictionary or object to extract fields from".
  mod single_content_type_header_tests {
    use super::*;

    #[tokio::test]
    async fn queue_sends_exactly_one_json_content_type() {
      let (base_url, captured) = spawn_capture_server(QUEUE_RESPONSE_BODY).await;

      let queue = new_request()
        .with_queue_base_url(base_url)
        .queue()
        .await
        .expect("queue should succeed");

      assert_eq!(queue.payload.request_id, "01a082d7-767c-7fb3-bae3-ce9cd1d0a360");
      assert_single_json_content_type_with_params(&captured.await.unwrap());
    }

    #[tokio::test]
    async fn queue_webhook_sends_exactly_one_json_content_type() {
      let (base_url, captured) = spawn_capture_server(QUEUE_RESPONSE_BODY).await;

      let response = new_request()
        .with_queue_base_url(base_url)
        .queue_webhook(WEBHOOK_URL)
        .await
        .expect("queue_webhook should succeed");

      assert_eq!(response.request_id.as_deref(), Some("01a082d7-767c-7fb3-bae3-ce9cd1d0a360"));

      let raw = captured.await.unwrap();
      assert!(raw.request_line.contains("fal_webhook="), "webhook url missing: {}", raw.request_line);
      assert_single_json_content_type_with_params(&raw);
    }

    #[tokio::test]
    async fn queue_request_sends_exactly_one_json_content_type() {
      let (base_url, captured) = spawn_capture_server(QUEUE_RESPONSE_BODY).await;

      let response = new_request()
        .with_queue_base_url(base_url)
        .queue_request()
        .await
        .expect("queue_request should succeed");

      assert_eq!(response.request_id, "01a082d7-767c-7fb3-bae3-ce9cd1d0a360");
      assert_single_json_content_type_with_params(&captured.await.unwrap());
    }

    #[tokio::test]
    async fn send_sends_exactly_one_json_content_type() {
      let (base_url, captured) = spawn_capture_server(SYNC_RESPONSE_BODY).await;

      let response = new_request()
        .with_sync_base_url(base_url)
        .send()
        .await
        .expect("send should succeed");

      assert!(response.ok);
      assert_single_json_content_type_with_params(&captured.await.unwrap());
    }
  }

  mod base_url_tests {
    use super::*;

    #[test]
    fn defaults_point_at_fal() {
      let request = new_request();
      assert_eq!(request.sync_base_url, "https://fal.run");
      assert_eq!(request.queue_base_url, "https://queue.fal.run");
    }

    #[tokio::test]
    async fn queue_path_is_base_url_plus_endpoint() {
      let (base_url, captured) = spawn_capture_server(QUEUE_RESPONSE_BODY).await;

      new_request()
        .with_queue_base_url(base_url)
        .queue_request()
        .await
        .expect("queue_request should succeed");

      let raw = captured.await.unwrap();
      assert!(
        raw.request_line.starts_with(&format!("POST /{} HTTP/1.1", ENDPOINT)),
        "unexpected request line: {}",
        raw.request_line
      );
    }
  }

  // ---- Helpers ----

  /// Everything the fake fal server observed on the wire.
  struct CapturedRequest {
    request_line: String,
    /// Header (name lowercased, value) pairs in wire order.
    headers: Vec<(String, String)>,
    body: String,
  }

  fn new_request() -> FalRequest<Value, SyncOutput> {
    FalRequest::new(ENDPOINT, test_params()).with_api_key(API_KEY)
  }

  fn test_params() -> Value {
    json!({
      "prompt": "a corgi wearing sunglasses at the beach",
      "num_images": 1,
      "output_format": "png"
    })
  }

  fn assert_single_json_content_type_with_params(raw: &CapturedRequest) {
    let content_types: Vec<&str> = raw
      .headers
      .iter()
      .filter(|(name, _)| name == "content-type")
      .map(|(_, value)| value.as_str())
      .collect();

    assert_eq!(
      content_types,
      vec!["application/json"],
      "expected exactly one Content-Type header, got {:?}",
      content_types
    );

    let authorization = header_value(raw, "authorization");
    assert_eq!(authorization, Some(format!("Key {}", API_KEY)));

    let body: Value = serde_json::from_str(&raw.body).expect("body must be JSON");
    assert!(body.is_object(), "fal requires a JSON object body, got {}", body);
    assert_eq!(body, test_params());
  }

  fn header_value(raw: &CapturedRequest, name: &str) -> Option<String> {
    raw
      .headers
      .iter()
      .find(|(n, _)| n == name)
      .map(|(_, v)| v.clone())
  }

  /// Bind a one-shot HTTP/1.1 server on localhost. It records the raw request it receives,
  /// replies `200 OK` with `response_body`, and hands the capture back through the JoinHandle.
  async fn spawn_capture_server(response_body: &'static str) -> (String, JoinHandle<CapturedRequest>) {
    let listener = TcpListener::bind("127.0.0.1:0").await.expect("bind localhost");
    let base_url = format!("http://{}", listener.local_addr().unwrap());

    let handle = tokio::spawn(async move {
      let (mut socket, _) = listener.accept().await.expect("accept");

      let mut buffer = Vec::new();
      let header_end = loop {
        let mut chunk = [0u8; 4096];
        let n = socket.read(&mut chunk).await.expect("read");
        assert!(n > 0, "connection closed before headers finished");
        buffer.extend_from_slice(&chunk[..n]);
        if let Some(pos) = find_header_end(&buffer) {
          break pos;
        }
      };

      let head = String::from_utf8_lossy(&buffer[..header_end]).to_string();
      let mut lines = head.split("\r\n");
      let request_line = lines.next().unwrap_or_default().to_string();
      let headers: Vec<(String, String)> = lines
        .filter_map(|line| line.split_once(':'))
        .map(|(name, value)| (name.trim().to_ascii_lowercase(), value.trim().to_string()))
        .collect();

      let content_length: usize = headers
        .iter()
        .find(|(name, _)| name == "content-length")
        .and_then(|(_, value)| value.parse().ok())
        .expect("reqwest sends Content-Length for a JSON body");

      let body_start = header_end + 4;
      while buffer.len() < body_start + content_length {
        let mut chunk = [0u8; 4096];
        let n = socket.read(&mut chunk).await.expect("read body");
        assert!(n > 0, "connection closed before body finished");
        buffer.extend_from_slice(&chunk[..n]);
      }
      let body = String::from_utf8_lossy(&buffer[body_start..body_start + content_length]).to_string();

      let response = format!(
        "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
        response_body.len(),
        response_body
      );
      socket.write_all(response.as_bytes()).await.expect("write response");
      socket.shutdown().await.ok();

      CapturedRequest { request_line, headers, body }
    });

    (base_url, handle)
  }

  fn find_header_end(buffer: &[u8]) -> Option<usize> {
    buffer.windows(4).position(|window| window == b"\r\n\r\n")
  }
}
