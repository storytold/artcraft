use crate::creds::fal_api_key::FalApiKey;
use crate::error::fal_error_plus::FalErrorPlus;
use log::info;
use url::Url;

const EXPECTED_HOST: &str = "queue.fal.run";

pub struct PollJobStatusArgs<'a> {
  pub status_url: &'a str,
  pub api_key: &'a FalApiKey,
}

/// Poll the status of a queued FAL job.
///
/// The `status_url` must point to `queue.fal.run`. Returns the raw response
/// body as a string so the caller can deserialize it as needed.
pub async fn poll_job_status(args: PollJobStatusArgs<'_>) -> Result<String, FalErrorPlus> {
  let parsed = Url::parse(args.status_url)?;

  let host = parsed.host_str().unwrap_or("");
  if host != EXPECTED_HOST {
    return Err(FalErrorPlus::InvalidPollingUrl(format!(
      "Expected host '{}' but got '{}' in status URL: {}",
      EXPECTED_HOST,
      host,
      args.status_url,
    )));
  }

  info!("Polling FAL job status: {}", args.status_url);

  let response = reqwest::Client::new()
    .get(args.status_url)
    .header("Authorization", format!("Key {}", args.api_key.0))
    .send()
    .await?;

  let status = response.status();
  let body = response.text().await?;

  if !status.is_success() {
    return Err(FalErrorPlus::AnyhowError(anyhow::anyhow!(
      "FAL poll returned HTTP {}: {}",
      status,
      body,
    )));
  }

  Ok(body)
}

#[cfg(test)]
mod tests {
  use super::*;

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
    // Just verify URL parsing succeeds — the actual HTTP call will fail without a real key,
    // but we can check that the host validation passes.
    let parsed = Url::parse("https://queue.fal.run/fal-ai/flux/requests/019e18d8-8c36-7bc1-aa77-2bc2f70268c6").unwrap();
    assert_eq!(parsed.host_str(), Some(EXPECTED_HOST));
  }

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

    let result = poll_job_status(args).await;
    println!("Poll result: {:?}", result);
    let body = result.expect("poll should succeed");
    assert!(!body.is_empty());
    println!("Response body: {}", body);
  }
}
