use crate::creds::fal_api_key::FalApiKey;
use crate::error::api_generic_error::FalGenericApiError;
use crate::error::client_error::FalClientError;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::polling::poll_job_status::raw_response::RawPollJobStatusResponse;
use log::info;
use url::Url;

const EXPECTED_HOST: &str = "queue.fal.run";

pub struct PollJobStatusArgs<'a> {
  /// This is the "status" URL, not the "response" URL. 
  /// This only gives us the progress of the job, not details of the final results upon completion.
  pub status_url: &'a str,
  
  pub api_key: &'a FalApiKey,
}

/// The parsed status of a FAL queue job.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum FalJobStatus {
  /// Request is queued, waiting for a runner.
  InQueue,
  /// A runner is actively processing the request.
  InProgress,
  /// Processing is complete; results are available at the response URL.
  Completed,
  /// A status value we haven't mapped yet.
  Unknown(String),
}

/// Parsed response from polling a FAL job's status.
#[derive(Debug)]
pub struct PollJobStatusResponse {
  /// The job's current status.
  pub status: FalJobStatus,
  /// The request ID for this job.
  pub request_id: Option<String>,
  /// URL to retrieve the completed result.
  pub response_url: Option<String>,
  /// Queue position (only present when status is InQueue).
  pub maybe_queue_position: Option<u64>,
  /// Inference time in seconds (only present when status is Completed).
  pub maybe_inference_time: Option<f64>,
  /// The raw JSON response body, preserved for debugging or further parsing.
  pub raw_body: String,
}

/// Poll the status of a queued FAL job.
///
/// The `status_url` must point to `queue.fal.run`.
pub async fn poll_job_status(args: PollJobStatusArgs<'_>) -> Result<PollJobStatusResponse, FalErrorPlus> {
  let parsed = Url::parse(args.status_url)?;

  let host = parsed.host_str().unwrap_or("");
  
  if host != EXPECTED_HOST {
    return Err(FalErrorPlus::ClientError(FalClientError::InvalidUrl(format!(
      "Expected host '{}' but got '{}' in status URL: {}",
      EXPECTED_HOST,
      host,
      args.status_url,
    ))));
  }

  info!("Polling FAL job status: {}", args.status_url);

  let response = reqwest::Client::new()
    .get(args.status_url)
    .header("Authorization", format!("Key {}", args.api_key.0))
    .send()
    .await?;

  let http_status = response.status();
  let body = response.text().await?;

  if !http_status.is_success() {
    return Err(FalErrorPlus::ApiGeneric(
      FalGenericApiError::UncategorizedBadResponseWithStatusAndBody {
        status_code: http_status,
        body,
      },
    ));
  }

  let raw: RawPollJobStatusResponse = serde_json::from_str(&body)
    .map_err(|err| FalErrorPlus::ApiGeneric(
      FalGenericApiError::SerdeResponseParseErrorWithBody {
        error: err,
        body: body.clone(),
      },
    ))?;

  let status = match raw.status.as_str() {
    "IN_QUEUE" => FalJobStatus::InQueue,
    "IN_PROGRESS" => FalJobStatus::InProgress,
    "COMPLETED" => FalJobStatus::Completed,
    other => FalJobStatus::Unknown(other.to_string()),
  };

  let maybe_inference_time = raw.metrics
    .and_then(|m| m.inference_time);

  Ok(PollJobStatusResponse {
    status,
    request_id: raw.request_id,
    response_url: raw.response_url,
    maybe_queue_position: raw.queue_position,
    maybe_inference_time,
    raw_body: body,
  })
}

#[cfg(test)]
mod tests {
  use super::*;

  // ── Unit tests (no network) ──

  #[tokio::test]
  async fn rejects_wrong_host() {
    let api_key = FalApiKey::from_str("test-key");
    let args = PollJobStatusArgs {
      status_url: "https://evil.example.com/fal-ai/flux/requests/abc123",
      api_key: &api_key,
    };
    let result = poll_job_status(args).await;
    assert!(result.is_err());
    let err = format!("{}", result.unwrap_err());
    assert!(err.contains("evil.example.com"), "error should mention the bad host: {}", err);
  }

  #[tokio::test]
  async fn rejects_invalid_url() {
    let api_key = FalApiKey::from_str("test-key");
    let args = PollJobStatusArgs {
      status_url: "not a url at all",
      api_key: &api_key,
    };
    let result = poll_job_status(args).await;
    assert!(result.is_err());
  }

  #[test]
  fn accepts_valid_host() {
    let parsed = Url::parse("https://queue.fal.run/fal-ai/flux/requests/019e18d8-8c36-7bc1-aa77-2bc2f70268c6").unwrap();
    assert_eq!(parsed.host_str(), Some(EXPECTED_HOST));
  }

  // ── Parsing tests ──

  mod parsing {
    use super::*;
    use crate::polling::poll_job_status::raw_response::RawPollJobStatusResponse;

    #[test]
    fn parse_completed_response() {
      let json = r#"{"status":"COMPLETED","request_id":"019e194b-f69a-77b1-bada-3f56d7d3c87d","response_url":"https://queue.fal.run/fal-ai/hunyuan3d-v3/requests/019e194b-f69a-77b1-bada-3f56d7d3c87d","status_url":"https://queue.fal.run/fal-ai/hunyuan3d-v3/requests/019e194b-f69a-77b1-bada-3f56d7d3c87d/status","cancel_url":"https://queue.fal.run/fal-ai/hunyuan3d-v3/requests/019e194b-f69a-77b1-bada-3f56d7d3c87d/cancel","logs":null,"metrics":{"inference_time":126.701406955719}}"#;
      let raw: RawPollJobStatusResponse = serde_json::from_str(json).unwrap();
      assert_eq!(raw.status, "COMPLETED");
      assert_eq!(raw.request_id.as_deref(), Some("019e194b-f69a-77b1-bada-3f56d7d3c87d"));
      assert!(raw.response_url.is_some());
      assert!(raw.queue_position.is_none());
      assert!((raw.metrics.unwrap().inference_time.unwrap() - 126.7).abs() < 1.0);
    }

    #[test]
    fn parse_in_queue_response() {
      let json = r#"{"status":"IN_QUEUE","request_id":"019e1951-c778-7120-9c82-16efcf40ec82","response_url":"https://queue.fal.run/fal-ai/hunyuan3d-v3/requests/019e1951-c778-7120-9c82-16efcf40ec82","status_url":"https://queue.fal.run/fal-ai/hunyuan3d-v3/requests/019e1951-c778-7120-9c82-16efcf40ec82/status","cancel_url":"https://queue.fal.run/fal-ai/hunyuan3d-v3/requests/019e1951-c778-7120-9c82-16efcf40ec82/cancel","logs":null,"metrics":{},"queue_position":0}"#;
      let raw: RawPollJobStatusResponse = serde_json::from_str(json).unwrap();
      assert_eq!(raw.status, "IN_QUEUE");
      assert_eq!(raw.queue_position, Some(0));
      assert!(raw.metrics.unwrap().inference_time.is_none());
    }

    #[test]
    fn status_enum_mapping() {
      assert_eq!(
        match "IN_QUEUE" { "IN_QUEUE" => FalJobStatus::InQueue, _ => unreachable!() },
        FalJobStatus::InQueue
      );
      assert_eq!(
        match "IN_PROGRESS" { "IN_PROGRESS" => FalJobStatus::InProgress, _ => unreachable!() },
        FalJobStatus::InProgress
      );
      assert_eq!(
        match "COMPLETED" { "COMPLETED" => FalJobStatus::Completed, _ => unreachable!() },
        FalJobStatus::Completed
      );
    }

    #[test]
    fn unknown_status_preserved() {
      let status = match "SOMETHING_NEW" {
        "IN_QUEUE" => FalJobStatus::InQueue,
        "IN_PROGRESS" => FalJobStatus::InProgress,
        "COMPLETED" => FalJobStatus::Completed,
        other => FalJobStatus::Unknown(other.to_string()),
      };
      assert_eq!(status, FalJobStatus::Unknown("SOMETHING_NEW".to_string()));
    }
  }

  // ── Live tests ──

  #[tokio::test]
  #[ignore] // requires real API key
  async fn poll_single_image_job() {
    let secret = std::fs::read_to_string("/Users/bt/Artcraft/credentials/fal.api_key.txt")
      .expect("Failed to read fal.api_key.txt");
    let api_key = FalApiKey::from_str(secret.trim());

    let args = PollJobStatusArgs {
      status_url: "https://queue.fal.run/fal-ai/flux/requests/019e18d8-8c36-7bc1-aa77-2bc2f70268c6",
      api_key: &api_key,
    };

    let result = poll_job_status(args).await.expect("poll should succeed");
    println!("Status: {:?}", result.status);
    println!("Response URL: {:?}", result.response_url);
    println!("Inference time: {:?}", result.maybe_inference_time);
    assert_eq!(result.status, FalJobStatus::Completed);
    assert!(result.response_url.is_some());
  }

  #[tokio::test]
  #[ignore] // requires real API key
  async fn poll_single_mesh_status_job() {
    let secret = std::fs::read_to_string("/Users/bt/Artcraft/credentials/fal.api_key.txt")
      .expect("Failed to read fal.api_key.txt");
    let api_key = FalApiKey::from_str(secret.trim());

    let args = PollJobStatusArgs {
      status_url: "https://queue.fal.run/fal-ai/hunyuan3d-v3/requests/019e194b-f69a-77b1-bada-3f56d7d3c87d/status",
      api_key: &api_key,
    };

    let result = poll_job_status(args).await.expect("poll should succeed");
    println!("Status: {:?}", result.status);
    println!("Response URL: {:?}", result.response_url);
    println!("Inference time: {:?}", result.maybe_inference_time);
    println!("Raw body: {}", result.raw_body);
    assert_eq!(result.status, FalJobStatus::Completed);
  }
}
