use log::warn;
use serde::Deserialize;

use crate::creds::gmicloud_api_key::GmiCloudApiKey;
use crate::error::gmicloud_error::GmiCloudError;
use crate::error::gmicloud_generic_api_error::GmiCloudGenericApiError;
use crate::error::gmicloud_specific_api_error::GmiCloudSpecificApiError;

const BASE_URL: &str = "https://console.gmicloud.ai/api/v1/ie/requestqueue/apikey";

/// The response from `GET /requests/{request_id}`.
#[derive(Debug, Deserialize)]
pub struct GmiCloudPollResponse {
  pub request_id: String,
  pub org_id: Option<String>,
  pub user_id: Option<String>,
  pub model: String,
  pub status: String,
  pub is_public: Option<bool>,
  pub payload: Option<serde_json::Value>,
  pub outcome: Option<GmiCloudOutcome>,
  pub created_at: Option<u64>,
  pub updated_at: Option<u64>,
  pub queued_at: Option<u64>,
}

/// The outcome of a completed request.
#[derive(Debug, Deserialize, PartialEq)]
pub struct GmiCloudOutcome {
  pub video_url: Option<String>,
  pub thumbnail_image_url: Option<String>,
}

impl GmiCloudPollResponse {
  /// Whether the request has completed successfully.
  pub fn is_success(&self) -> bool {
    self.status == "success"
  }

  /// Whether the request is still in progress (dispatched or processing).
  pub fn is_in_progress(&self) -> bool {
    self.status == "dispatched" || self.status == "processing"
  }

  /// Whether the request has failed.
  pub fn is_failed(&self) -> bool {
    self.status == "failed"
  }

  /// Get the video URL if the request completed successfully.
  pub fn video_url(&self) -> Option<&str> {
    self.outcome.as_ref()?.video_url.as_deref()
  }

  /// Get the thumbnail URL if the request completed successfully.
  pub fn thumbnail_url(&self) -> Option<&str> {
    self.outcome.as_ref()?.thumbnail_image_url.as_deref()
  }
}

/// Poll the status of a GmiCloud request.
pub async fn poll_gmicloud_request(
  api_key: &GmiCloudApiKey,
  request_id: &str,
) -> Result<GmiCloudPollResponse, GmiCloudError> {
  let url = format!("{}/requests/{}", BASE_URL, request_id);

  let client = reqwest::Client::new();
  let response = client
    .get(&url)
    .header("Authorization", format!("Bearer {}", api_key.as_str()))
    .send()
    .await
    .map_err(GmiCloudGenericApiError::from)?;

  let status = response.status();
  let body_text = response.text().await
    .map_err(GmiCloudGenericApiError::from)?;

  if status == reqwest::StatusCode::UNAUTHORIZED {
    return Err(GmiCloudSpecificApiError::Unauthorized.into());
  }

  if !status.is_success() {
    warn!("GmiCloud poll error: status={}, body={}", status, body_text);
    return Err(GmiCloudGenericApiError::UncategorizedBadResponseWithStatusAndBody {
      status_code: status.as_u16(),
      body: body_text,
    }.into());
  }

  let parsed: GmiCloudPollResponse = serde_json::from_str(&body_text)
    .map_err(|err| GmiCloudGenericApiError::SerdeResponseParseErrorWithBody(err, body_text))?;

  Ok(parsed)
}

#[cfg(test)]
mod tests {
  use super::*;

  mod deserialization_tests {
    use super::*;

    #[test]
    fn deserialize_success_response() {
      let json = r#"{
        "request_id": "40f63632-dd9d-4725-ab73-5bb764e773be",
        "org_id": "3e7939ae-467e-4c5d-ae35-fd6097cee454",
        "user_id": "07e393c5-f2f1-45fe-8838-cc4046837693",
        "model": "seedance-2-0-260128",
        "status": "success",
        "is_public": false,
        "payload": {
          "duration": 10,
          "first_frame": "https://example.com/image.jpg",
          "prompt": "a dog running",
          "resolution": "720p"
        },
        "outcome": {
          "thumbnail_image_url": "https://example.com/thumb.jpg",
          "video_url": "https://example.com/video.mp4"
        },
        "created_at": 1778928208,
        "updated_at": 1778928397,
        "queued_at": 1778928208
      }"#;

      let response: GmiCloudPollResponse = serde_json::from_str(json).unwrap();
      assert_eq!(response.request_id, "40f63632-dd9d-4725-ab73-5bb764e773be");
      assert_eq!(response.model, "seedance-2-0-260128");
      assert!(response.is_success());
      assert!(!response.is_in_progress());
      assert!(!response.is_failed());
      assert_eq!(response.video_url(), Some("https://example.com/video.mp4"));
      assert_eq!(response.thumbnail_url(), Some("https://example.com/thumb.jpg"));
      assert_eq!(response.created_at, Some(1778928208));
      assert_eq!(response.updated_at, Some(1778928397));
    }

    #[test]
    fn deserialize_processing_response() {
      let json = r#"{
        "request_id": "6fb2b474-fb3a-480f-a142-f200537c6de4",
        "org_id": "63729242-1870-4ff4-80b0-d485980ae31c",
        "model": "seedance-2-0-260128",
        "status": "processing",
        "is_public": false,
        "payload": {
          "prompt": "a dog running",
          "duration": 5
        },
        "outcome": null,
        "created_at": 1753468514,
        "updated_at": 1753468514,
        "queued_at": 1753468514
      }"#;

      let response: GmiCloudPollResponse = serde_json::from_str(json).unwrap();
      assert!(!response.is_success());
      assert!(response.is_in_progress());
      assert!(!response.is_failed());
      assert_eq!(response.video_url(), None);
      assert_eq!(response.outcome, None);
    }

    #[test]
    fn deserialize_dispatched_response() {
      let json = r#"{
        "request_id": "abc",
        "model": "seedance-2-0-fast-260128",
        "status": "dispatched",
        "outcome": null
      }"#;

      let response: GmiCloudPollResponse = serde_json::from_str(json).unwrap();
      assert!(response.is_in_progress());
      assert!(!response.is_success());
    }

    #[test]
    fn deserialize_failed_response() {
      let json = r#"{
        "request_id": "abc",
        "model": "seedance-2-0-260128",
        "status": "failed",
        "outcome": null
      }"#;

      let response: GmiCloudPollResponse = serde_json::from_str(json).unwrap();
      assert!(response.is_failed());
      assert!(!response.is_success());
      assert!(!response.is_in_progress());
    }
  }

  mod live_api_tests {
    use super::*;

    // seedance-2-0-260128, 10s 720p, image-to-video
    #[tokio::test]
    #[ignore] // requires real API key
    async fn poll_seedance_20_720p() {
      let api_key = crate::test_utils::load_api_key();
      let response = poll_gmicloud_request(&api_key, "40f63632-dd9d-4725-ab73-5bb764e773be")
        .await.unwrap();

      assert_eq!(response.request_id, "40f63632-dd9d-4725-ab73-5bb764e773be");
      assert_eq!(response.model, "seedance-2-0-260128");
      assert!(response.is_success());

      let payload = response.payload.as_ref().unwrap();
      assert_eq!(payload["prompt"], "the dog in this photo starts running and splashing in the lake water");
      assert_eq!(payload["duration"], 10);
      assert_eq!(payload["resolution"], "720p");
      assert!(payload["first_frame"].as_str().unwrap().contains("svcpp441gyb6mjtt8413kf5zxw1ehy4t"));

      assert!(response.video_url().unwrap().ends_with(".mp4"));
    }

    // seedance-2-0-260128, 10s 480p, image-to-video
    #[tokio::test]
    #[ignore] // requires real API key
    async fn poll_seedance_20_480p() {
      let api_key = crate::test_utils::load_api_key();
      let response = poll_gmicloud_request(&api_key, "4a0efe0d-990f-480d-9792-5bb71dd26b85")
        .await.unwrap();

      assert_eq!(response.request_id, "4a0efe0d-990f-480d-9792-5bb71dd26b85");
      assert_eq!(response.model, "seedance-2-0-260128");
      assert!(response.is_success());

      let payload = response.payload.as_ref().unwrap();
      assert_eq!(payload["prompt"], "the dog in this photo starts running and splashing in the lake water");
      assert_eq!(payload["duration"], 10);
      assert_eq!(payload["resolution"], "480p");

      assert!(response.video_url().unwrap().ends_with(".mp4"));
    }

    // seedance-2-0-fast-260128, 10s 720p, image-to-video
    #[tokio::test]
    #[ignore] // requires real API key
    async fn poll_seedance_20_fast_720p() {
      let api_key = crate::test_utils::load_api_key();
      let response = poll_gmicloud_request(&api_key, "2fbbe377-7c92-482e-b1eb-92fd296b0a68")
        .await.unwrap();

      assert_eq!(response.request_id, "2fbbe377-7c92-482e-b1eb-92fd296b0a68");
      assert_eq!(response.model, "seedance-2-0-fast-260128");
      assert!(response.is_success());

      let payload = response.payload.as_ref().unwrap();
      assert_eq!(payload["prompt"], "the dog in this photo starts running and splashing in the lake water");
      assert_eq!(payload["duration"], 10);
      assert_eq!(payload["resolution"], "720p");

      assert!(response.video_url().unwrap().ends_with(".mp4"));
    }

    // seedance-2-0-fast-260128, 10s 480p, image-to-video
    #[tokio::test]
    #[ignore] // requires real API key
    async fn poll_seedance_20_fast_480p() {
      let api_key = crate::test_utils::load_api_key();
      let response = poll_gmicloud_request(&api_key, "1b654a85-d99e-4380-b615-c7a8985ed15b")
        .await.unwrap();

      assert_eq!(response.request_id, "1b654a85-d99e-4380-b615-c7a8985ed15b");
      assert_eq!(response.model, "seedance-2-0-fast-260128");
      assert!(response.is_success());

      let payload = response.payload.as_ref().unwrap();
      assert_eq!(payload["prompt"], "the dog in this photo starts running and splashing in the lake water");
      assert_eq!(payload["duration"], 10);
      assert_eq!(payload["resolution"], "480p");

      assert!(response.video_url().unwrap().ends_with(".mp4"));
    }
  }
}
