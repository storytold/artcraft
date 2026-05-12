use crate::creds::fal_api_key::FalApiKey;
use crate::error::api_generic_error::FalGenericApiError;
use crate::error::api_specific_error::FalSpecificApiError;
use crate::error::client_error::FalClientError;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::polling::poll_job_response::raw_response::RawIncompleteJobResponse;
use crate::polling::poll_job_response::success_case_extractors::{
  extract_contents_from_response, PollResponseExtractedContents,
};
use log::info;
use serde_json::Value;
use url::Url;

const EXPECTED_HOST: &str = "queue.fal.run";

pub struct PollJobResponseArgs<'a> {
  /// This is the "response" URL (not the "status" URL).
  /// This fetches the actual results of a completed job.
  pub response_url: &'a str,

  pub api_key: &'a FalApiKey,
}

/// Parsed response from fetching a completed FAL job's results.
#[derive(Debug)]
pub struct PollJobResponse {
  /// The raw JSON payload as a serde_json::Value, for full access.
  pub payload: Value,

  /// Extracted known content fields (images, video, model_glb, thumbnail).
  /// `None` if no recognized content keys were found in the payload.
  pub extracted_contents: Option<PollResponseExtractedContents>,

  /// The raw JSON response body, preserved for debugging.
  pub raw_body: String,
}

/// Fetch the results of a completed FAL job.
///
/// The `response_url` must point to `queue.fal.run`.
///
/// Returns `FalErrorPlus::ApiSpecific(IncompleteJob)` if the job is still
/// in progress (FAL returns HTTP 400 with `"detail": "Request is still in progress"`).
pub async fn poll_job_response(args: PollJobResponseArgs<'_>) -> Result<PollJobResponse, FalErrorPlus> {
  let parsed = Url::parse(args.response_url)?;

  let host = parsed.host_str().unwrap_or("");

  if host != EXPECTED_HOST {
    return Err(FalErrorPlus::ClientError(FalClientError::InvalidUrl(format!(
      "Expected host '{}' but got '{}' in response URL: {}",
      EXPECTED_HOST,
      host,
      args.response_url,
    ))));
  }

  info!("Polling FAL job response: {}", args.response_url);

  let response = reqwest::Client::new()
    .get(args.response_url)
    .header("Authorization", format!("Key {}", args.api_key.0))
    .send()
    .await?;

  let http_status = response.status();
  let body = response.text().await?;

  if !http_status.is_success() {
    return Err(classify_error_response(http_status, &body));
  }

  let payload: Value = serde_json::from_str(&body)
    .map_err(|err| FalErrorPlus::ApiGeneric(
      FalGenericApiError::SerdeResponseParseErrorWithBody {
        error: err,
        body: body.clone(),
      },
    ))?;

  let extracted_contents = extract_contents_from_response(&payload);

  Ok(PollJobResponse {
    payload,
    extracted_contents,
    raw_body: body,
  })
}

// ── Helpers ──

/// Classify a non-2xx response. If it's a 400 with "Request is still in progress",
/// return the specific `IncompleteJob` error. Otherwise fall through to a generic error.
fn classify_error_response(
  status_code: reqwest::StatusCode,
  body: &str,
) -> FalErrorPlus {
  if status_code == reqwest::StatusCode::BAD_REQUEST {
    if let Ok(raw) = serde_json::from_str::<RawIncompleteJobResponse>(body) {
      if let Some(detail) = raw.detail {
        if detail.contains("still in progress") {
          return FalErrorPlus::ApiSpecific(FalSpecificApiError::IncompleteJob(detail));
        }
      }
    }
  }

  FalErrorPlus::ApiGeneric(
    FalGenericApiError::UncategorizedBadResponseWithStatusAndBody {
      status_code,
      body: body.to_string(),
    },
  )
}

#[cfg(test)]
mod tests {
  use super::*;

  // ── Unit tests (no network) ──

  #[tokio::test]
  async fn rejects_wrong_host() {
    let api_key = FalApiKey::from_str("test-key");
    let args = PollJobResponseArgs {
      response_url: "https://evil.example.com/fal-ai/flux/requests/abc123",
      api_key: &api_key,
    };
    let result = poll_job_response(args).await;
    assert!(result.is_err());
    let err = format!("{}", result.unwrap_err());
    assert!(err.contains("evil.example.com"), "error should mention the bad host: {}", err);
  }

  #[tokio::test]
  async fn rejects_invalid_url() {
    let api_key = FalApiKey::from_str("test-key");
    let args = PollJobResponseArgs {
      response_url: "not a url at all",
      api_key: &api_key,
    };
    let result = poll_job_response(args).await;
    assert!(result.is_err());
  }

  mod classify_error {
    use super::*;

    #[test]
    fn incomplete_job_400() {
      let body = r#"{"cancel_url":"https://queue.fal.run/fal-ai/hunyuan3d-v3/requests/abc/cancel","detail":"Request is still in progress","request_id":"abc","response_url":"https://queue.fal.run/fal-ai/hunyuan3d-v3/requests/abc","status_url":"https://queue.fal.run/fal-ai/hunyuan3d-v3/requests/abc/status"}"#;
      let err = classify_error_response(reqwest::StatusCode::BAD_REQUEST, body);
      assert!(matches!(err, FalErrorPlus::ApiSpecific(FalSpecificApiError::IncompleteJob(_))));
    }

    #[test]
    fn other_400_is_generic() {
      let body = r#"{"detail":"Some other error"}"#;
      let err = classify_error_response(reqwest::StatusCode::BAD_REQUEST, body);
      assert!(matches!(err, FalErrorPlus::ApiGeneric(FalGenericApiError::UncategorizedBadResponseWithStatusAndBody { .. })));
    }

    #[test]
    fn non_400_is_generic() {
      let body = "Internal Server Error";
      let err = classify_error_response(reqwest::StatusCode::INTERNAL_SERVER_ERROR, body);
      assert!(matches!(err, FalErrorPlus::ApiGeneric(FalGenericApiError::UncategorizedBadResponseWithStatusAndBody { .. })));
    }
  }

  mod extract_payloads {
    use super::*;

    #[test]
    fn extract_image_payload() {
      let json = r#"{"images":[{"url":"https://v3b.fal.media/files/b/img.jpg","width":1024,"height":768,"content_type":"image/jpeg"}],"timings":{"inference":1.19},"seed":1248735483,"has_nsfw_concepts":[false],"prompt":"a giant robot"}"#;
      let value: Value = serde_json::from_str(json).unwrap();
      let extracted = extract_contents_from_response(&value).unwrap();
      let images = extracted.images.unwrap();
      assert_eq!(images.len(), 1);
      assert_eq!(images[0].url.as_deref(), Some("https://v3b.fal.media/files/b/img.jpg"));
      assert_eq!(images[0].width, Some(1024));
      assert_eq!(images[0].height, Some(768));
    }

    #[test]
    fn extract_glb_mesh_payload() {
      let json = r#"{"model_glb":{"url":"https://v3b.fal.media/files/b/model.glb","content_type":"model/gltf-binary","file_name":"model.glb","file_size":33352724},"thumbnail":{"url":"https://v3b.fal.media/files/b/preview.png","content_type":"image/png","file_name":"preview.png","file_size":99797},"model_urls":{"glb":{"url":"https://v3b.fal.media/files/b/model.glb"},"fbx":null,"obj":{"url":"https://v3b.fal.media/files/b/model.obj"},"usdz":null},"seed":null}"#;
      let value: Value = serde_json::from_str(json).unwrap();
      let extracted = extract_contents_from_response(&value).unwrap();

      let glb = extracted.model_glb.unwrap();
      assert_eq!(glb.url.as_deref(), Some("https://v3b.fal.media/files/b/model.glb"));
      assert_eq!(glb.file_size, Some(33352724));

      let thumb = extracted.thumbnail.unwrap();
      assert_eq!(thumb.url.as_deref(), Some("https://v3b.fal.media/files/b/preview.png"));

      assert!(extracted.images.is_none());
      assert!(extracted.video.is_none());
    }

    #[test]
    fn no_known_keys_returns_none() {
      let json = r#"{"some_unknown_field": "value"}"#;
      let value: Value = serde_json::from_str(json).unwrap();
      assert!(extract_contents_from_response(&value).is_none());
    }
  }

  // ── Live tests ──

  #[tokio::test]
  #[ignore] // requires real API key
  async fn poll_completed_image_job() {
    let secret = std::fs::read_to_string("/Users/bt/Artcraft/credentials/fal.api_key.txt")
      .expect("Failed to read fal.api_key.txt");
    let api_key = FalApiKey::from_str(secret.trim());

    let args = PollJobResponseArgs {
      response_url: "https://queue.fal.run/fal-ai/flux/requests/019e18d8-8c36-7bc1-aa77-2bc2f70268c6",
      api_key: &api_key,
    };

    let result = poll_job_response(args).await.expect("poll should succeed");
    println!("Extracted contents: {:?}", result.extracted_contents);

    let extracted = result.extracted_contents.unwrap();
    let images = extracted.images.unwrap();
    assert!(!images.is_empty());
    assert!(images[0].url.is_some());
    println!("Image URL: {}", images[0].url.as_ref().unwrap());
  }

  #[tokio::test]
  #[ignore] // requires real API key
  async fn poll_completed_mesh_job() {
    let secret = std::fs::read_to_string("/Users/bt/Artcraft/credentials/fal.api_key.txt")
      .expect("Failed to read fal.api_key.txt");
    let api_key = FalApiKey::from_str(secret.trim());

    let args = PollJobResponseArgs {
      response_url: "https://queue.fal.run/fal-ai/hunyuan3d-v3/requests/019e194b-f69a-77b1-bada-3f56d7d3c87d",
      api_key: &api_key,
    };

    let result = poll_job_response(args).await.expect("poll should succeed");
    println!("Extracted contents: {:?}", result.extracted_contents);

    let extracted = result.extracted_contents.unwrap();
    let glb = extracted.model_glb.unwrap();
    assert!(glb.url.is_some());
    println!("GLB URL: {}", glb.url.as_ref().unwrap());
  }
}
