use std::marker::PhantomData;

use serde::{de::DeserializeOwned, Deserialize, Serialize};

use crate::error::fal_error::FalError;
use crate::requests::core_api::queue_response::QueueResponse;
use crate::requests::core_api::queue_status::QueueStatus;

#[derive(Debug, Serialize, Deserialize)]
pub struct Queue<Response: DeserializeOwned> {
  #[serde(skip, default = "default_client")]
  pub client: reqwest::Client,
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
      client,
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
      .put(&self.payload.cancel_url)
      .header("Authorization", format!("Key {}", self.api_key))
      .send()
      .await?;

    response.error_for_status()?;

    Ok(())
  }
}

fn default_client() -> reqwest::Client {
  reqwest::Client::new()
}

#[cfg(test)]
mod tests {
  use super::Queue;
  use crate::requests::core_api::queue_response::QueueResponse;
  use crate::requests::core_api::queue_status::Status;
  use serde_json::Value;
  use std::io::{Read, Write};
  use std::net::TcpListener;

  #[tokio::test]
  async fn deserialized_queue_remains_usable() {
    let base_url = serve_queue_requests();
    let queue = Queue::<Value>::new(
      reqwest::Client::new(),
      "test-endpoint",
      "test-api-key".to_string(),
      QueueResponse {
        request_id: "request-1".to_string(),
        status_url: format!("{base_url}/status"),
        response_url: format!("{base_url}/response"),
        cancel_url: format!("{base_url}/cancel"),
      },
    );

    let serialized = serde_json::to_string(&queue).unwrap();
    let restored: Queue<Value> = serde_json::from_str(&serialized).unwrap();

    let status = restored.status(false).await.unwrap();
    assert_eq!(status.status, Status::Completed);

    let response = restored.response().await.unwrap();
    assert_eq!(response["result"], "ok");

    restored.cancel().await.unwrap();
  }

  fn serve_queue_requests() -> String {
    let listener = TcpListener::bind(("127.0.0.1", 0)).unwrap();
    let address = listener.local_addr().unwrap();

    std::thread::spawn(move || {
      for _ in 0..3 {
        let (mut stream, _) = listener.accept().unwrap();
        let mut request = [0_u8; 2048];
        let bytes_read = stream.read(&mut request).unwrap();
        let request = String::from_utf8_lossy(&request[..bytes_read]);
        let request_line = request.lines().next().unwrap_or_default();

        let body = if request_line.starts_with("GET /status") {
          r#"{"status":"COMPLETED","queue_position":null,"response_url":"unused","logs":null}"#
        } else if request_line.starts_with("GET /response") {
          r#"{"result":"ok"}"#
        } else if request_line.starts_with("PUT /cancel") {
          r#"{}"#
        } else {
          panic!("unexpected request: {request_line}");
        };

        let response = format!(
          "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
          body.len(),
          body,
        );
        stream.write_all(response.as_bytes()).unwrap();
      }
    });

    format!("http://{address}")
  }
}
