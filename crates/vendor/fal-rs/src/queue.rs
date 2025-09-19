use std::marker::PhantomData;

use eventsource_stream::Eventsource;
use futures::{Stream, StreamExt, TryStreamExt};
use serde::{de::DeserializeOwned, Deserialize, Serialize};

use crate::FalError;

#[derive(Debug, Serialize, Deserialize)]
pub struct QueueResponse {
    pub request_id: String,
    pub response_url: String,
    pub status_url: String,
    pub cancel_url: String,
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum Status {
    InQueue,
    InProgress,
    Completed,
}

// NB(bt, 2025-06-13): Some of these fields have started to become optional.
// eg, errors:
//   "missing field `source`", line: 1, column: 1019
#[derive(Debug, Serialize, Deserialize)]
pub struct RequestLog {
    pub timestamp: String,
    pub level: Option<String>, // NB(bt): Now optional
    pub source: Option<String>, // NB(bt): Now optional
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct QueueStatus {
    /// The status of the Queue request
    pub status: Status,
    /// The position of the request in the queue
    pub queue_position: Option<i64>,
    /// The URL of the response
    pub response_url: String,
    /// The logs of the request, if `show_logs` is `true`
    pub logs: Option<Vec<RequestLog>>,
}

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
    ///
    /// If `show_logs` is set to true, the logs for the request will be included.
    /// Otherwise, they will not be present.
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

    /// Stream the status of the Queue request
    ///
    /// If `show_logs` is set to true, the logs for the request will be included.
    /// Otherwise, they will not be present.
    /// Each [`QueueStatus`] will include new logs since the last received status in the stream.
    pub async fn stream(
        &self,
        show_logs: bool,
    ) -> Result<impl Stream<Item = Result<QueueStatus, FalError>>, FalError> {
        let response = self
            .client
            .as_ref()
            .unwrap()
            .get(format!("{}/stream", &self.payload.status_url))
            .query(&[("logs", if show_logs { "1" } else { "0" })])
            .header("Authorization", format!("Key {}", self.api_key))
            .send()
            .await?;

        let stream = response.bytes_stream().eventsource();

        Ok(stream
            .map(|event_result| match event_result {
                Ok(event) => {
                    let status: QueueStatus =
                        serde_json::from_str(&event.data).map_err(|e| FalError::from(e))?;
                    Ok(status)
                }
                Err(e) => Err(FalError::from(e)),
            })
            .map_err(FalError::from))
    }
}
