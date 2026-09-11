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
  /// If the job is not complete, this call will fail in error.
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

    #[test]
    fn parse_real_image_response_offline() {
      let json = r#"{"images":[{"url":"https://v3b.fal.media/files/b/0a99d392/qzx8aXgWTbf5tVcYEF0S8.jpg","width":1024,"height":768,"content_type":"image/jpeg"}],"timings":{"inference":1.1978995269964798},"seed":1248735483,"has_nsfw_concepts":[false],"prompt":"a giant robot fighting a dragon in a futuristic city"}"#;
      let value: Value = serde_json::from_str(json).unwrap();
      let extracted = extract_contents_from_response(&value).expect("should extract contents");

      // Should have images, not video or mesh
      assert!(extracted.video.is_none());
      assert!(extracted.model_glb.is_none());
      assert!(extracted.thumbnail.is_none());

      let images = extracted.images.expect("should have images");
      assert_eq!(images.len(), 1);

      let image = &images[0];
      assert_eq!(image.url.as_deref(), Some("https://v3b.fal.media/files/b/0a99d392/qzx8aXgWTbf5tVcYEF0S8.jpg"));
      assert_eq!(image.width, Some(1024));
      assert_eq!(image.height, Some(768));
      assert_eq!(image.content_type.as_deref(), Some("image/jpeg"));

      // Verify raw payload also has seed, prompt, timings
      assert_eq!(value.get("seed").and_then(|v| v.as_u64()), Some(1248735483));
      assert_eq!(value.get("prompt").and_then(|v| v.as_str()), Some("a giant robot fighting a dragon in a futuristic city"));
      let inference_time = value.get("timings").and_then(|v| v.get("inference")).and_then(|v| v.as_f64()).unwrap();
      assert!((inference_time - 1.198).abs() < 0.001);
    }

    #[test]
    fn parse_real_mesh_response_offline() {
      let json = r#"{"model_glb":{"url":"https://v3b.fal.media/files/b/0a99d693/98becABi5mxR6w5Svy4oB_model.glb","content_type":"model/gltf-binary","file_name":"model.glb","file_size":33352724},"thumbnail":{"url":"https://v3b.fal.media/files/b/0a99d693/_wB78l-a_WmrlAzaKyTWy_preview.png","content_type":"image/png","file_name":"preview.png","file_size":99797},"model_urls":{"glb":{"url":"https://v3b.fal.media/files/b/0a99d693/98becABi5mxR6w5Svy4oB_model.glb","content_type":"model/gltf-binary","file_name":"model.glb","file_size":33352724},"fbx":null,"obj":{"url":"https://v3b.fal.media/files/b/0a99d693/_sxg6RiOiz_N9Eut1uFQo_model.obj","content_type":"text/plain","file_name":"model.obj","file_size":26194790},"usdz":null},"seed":null}"#;
      let value: Value = serde_json::from_str(json).unwrap();
      let extracted = extract_contents_from_response(&value).expect("should extract contents");

      // Should have model_glb + thumbnail, not images or video
      assert!(extracted.images.is_none());
      assert!(extracted.video.is_none());

      let glb = extracted.model_glb.expect("should have model_glb");
      assert_eq!(glb.url.as_deref(), Some("https://v3b.fal.media/files/b/0a99d693/98becABi5mxR6w5Svy4oB_model.glb"));
      assert_eq!(glb.content_type.as_deref(), Some("model/gltf-binary"));
      assert_eq!(glb.file_name.as_deref(), Some("model.glb"));
      assert_eq!(glb.file_size, Some(33352724));

      let thumbnail = extracted.thumbnail.expect("should have thumbnail");
      assert_eq!(thumbnail.url.as_deref(), Some("https://v3b.fal.media/files/b/0a99d693/_wB78l-a_WmrlAzaKyTWy_preview.png"));
      assert_eq!(thumbnail.content_type.as_deref(), Some("image/png"));
      assert_eq!(thumbnail.file_name.as_deref(), Some("preview.png"));
      assert_eq!(thumbnail.file_size, Some(99797));

      // Verify raw payload also has model_urls with OBJ
      let obj = value.get("model_urls").and_then(|v| v.get("obj")).unwrap();
      assert_eq!(obj.get("url").and_then(|v| v.as_str()), Some("https://v3b.fal.media/files/b/0a99d693/_sxg6RiOiz_N9Eut1uFQo_model.obj"));
      assert_eq!(obj.get("content_type").and_then(|v| v.as_str()), Some("text/plain"));
      assert_eq!(obj.get("file_name").and_then(|v| v.as_str()), Some("model.obj"));
      assert_eq!(obj.get("file_size").and_then(|v| v.as_u64()), Some(26194790));

      // FBX and USDZ are null
      assert!(value.get("model_urls").and_then(|v| v.get("fbx")).and_then(|v| v.as_object()).is_none());
      assert!(value.get("model_urls").and_then(|v| v.get("usdz")).and_then(|v| v.as_object()).is_none());
    }

    #[test]
    fn parse_real_kling3_video_response_offline() {
      let json = r#"{"video":{"url":"https://v3b.fal.media/files/b/0a99d90a/v1tQEfvnY2bVcn38IvmfD_output.mp4","content_type":"video/mp4","file_name":"output.mp4","file_size":3096422}}"#;
      let value: Value = serde_json::from_str(json).unwrap();
      let extracted = extract_contents_from_response(&value).expect("should extract contents");

      // Should have video, not images or mesh
      assert!(extracted.image.is_none());
      assert!(extracted.images.is_none());
      assert!(extracted.model_glb.is_none());
      assert!(extracted.thumbnail.is_none());

      let video = extracted.video.expect("should have video");
      assert_eq!(video.url.as_deref(), Some("https://v3b.fal.media/files/b/0a99d90a/v1tQEfvnY2bVcn38IvmfD_output.mp4"));
      assert_eq!(video.content_type.as_deref(), Some("video/mp4"));
      assert_eq!(video.file_name.as_deref(), Some("output.mp4"));
      assert_eq!(video.file_size, Some(3096422));
    }

    #[test]
    fn parse_real_nano_banana_pro_edit_response_offline() {
      let json = r#"{"images":[{"url":"https://v3b.fal.media/files/b/0a99d90e/IXN1B_4MHnozvltxEHfvX_BwTMO9xM.png","content_type":"image/png","file_name":"IXN1B_4MHnozvltxEHfvX_BwTMO9xM.png","file_size":null,"width":null,"height":null},{"url":"https://v3b.fal.media/files/b/0a99d90e/aj_Xu0cIUoVSZ6qSSxaZf_wy3l60NO.png","content_type":"image/png","file_name":"aj_Xu0cIUoVSZ6qSSxaZf_wy3l60NO.png","file_size":null,"width":null,"height":null}],"description":"**Developing Spooky Atmosphere**\n\ntest description"}"#;
      let value: Value = serde_json::from_str(json).unwrap();
      let extracted = extract_contents_from_response(&value).expect("should extract contents");

      // Should have images, not video or mesh
      assert!(extracted.image.is_none());
      assert!(extracted.video.is_none());
      assert!(extracted.model_glb.is_none());
      assert!(extracted.thumbnail.is_none());

      let images = extracted.images.expect("should have images");
      assert_eq!(images.len(), 2);

      assert_eq!(images[0].url.as_deref(), Some("https://v3b.fal.media/files/b/0a99d90e/IXN1B_4MHnozvltxEHfvX_BwTMO9xM.png"));
      assert_eq!(images[0].content_type.as_deref(), Some("image/png"));
      assert!(images[0].width.is_none(), "nano banana pro edit returns null width");
      assert!(images[0].height.is_none(), "nano banana pro edit returns null height");
      assert!(images[0].file_size.is_none(), "nano banana pro edit returns null file_size");

      assert_eq!(images[1].url.as_deref(), Some("https://v3b.fal.media/files/b/0a99d90e/aj_Xu0cIUoVSZ6qSSxaZf_wy3l60NO.png"));
      assert_eq!(images[1].content_type.as_deref(), Some("image/png"));
    }

    #[test]
    fn parse_real_flux_angle_lora_response_offline() {
      let json = r#"{"images":[{"url":"https://v3b.fal.media/files/b/0a99d915/_61CGILQXk8A7A6FrAbdu_uytUbw2B.png","content_type":"image/png","file_name":"_61CGILQXk8A7A6FrAbdu_uytUbw2B.png","file_size":null,"width":1024,"height":1024}],"seed":225652535,"prompt":"<sks> front-right quarter view elevated shot medium shot"}"#;
      let value: Value = serde_json::from_str(json).unwrap();
      let extracted = extract_contents_from_response(&value).expect("should extract contents");

      // Should have images, not video or mesh
      assert!(extracted.image.is_none());
      assert!(extracted.video.is_none());
      assert!(extracted.model_glb.is_none());
      assert!(extracted.thumbnail.is_none());

      let images = extracted.images.expect("should have images");
      assert_eq!(images.len(), 1);

      let image = &images[0];
      assert_eq!(image.url.as_deref(), Some("https://v3b.fal.media/files/b/0a99d915/_61CGILQXk8A7A6FrAbdu_uytUbw2B.png"));
      assert_eq!(image.content_type.as_deref(), Some("image/png"));
      assert_eq!(image.width, Some(1024));
      assert_eq!(image.height, Some(1024));
      assert!(image.file_size.is_none());

      // Verify raw payload fields
      assert_eq!(value.get("seed").and_then(|v| v.as_u64()), Some(225652535));
      assert_eq!(value.get("prompt").and_then(|v| v.as_str()), Some("<sks> front-right quarter view elevated shot medium shot"));
    }

    #[test]
    fn parse_real_remove_bg_response_offline() {
      let json = r#"{"image":{"url":"https://v3b.fal.media/files/b/0a99d916/J7OyBamMKRI_RUbkUxnJE_f5b8faa705534b19ad87bc3d48b5c6c5.png","content_type":"image/png","file_name":"f5b8faa705534b19ad87bc3d48b5c6c5.png","file_size":496291,"width":1000,"height":664}}"#;
      let value: Value = serde_json::from_str(json).unwrap();
      let extracted = extract_contents_from_response(&value).expect("should extract contents");

      // Should have single image, not images (plural), video, or mesh
      assert!(extracted.images.is_none());
      assert!(extracted.video.is_none());
      assert!(extracted.model_glb.is_none());
      assert!(extracted.thumbnail.is_none());

      let image = extracted.image.expect("should have single image");
      assert_eq!(image.url.as_deref(), Some("https://v3b.fal.media/files/b/0a99d916/J7OyBamMKRI_RUbkUxnJE_f5b8faa705534b19ad87bc3d48b5c6c5.png"));
      assert_eq!(image.content_type.as_deref(), Some("image/png"));
      assert_eq!(image.file_name.as_deref(), Some("f5b8faa705534b19ad87bc3d48b5c6c5.png"));
      assert_eq!(image.file_size, Some(496291));
      assert_eq!(image.width, Some(1000));
      assert_eq!(image.height, Some(664));
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
    let extracted = result.extracted_contents.expect("should have extracted contents");

    // Should have images, not video or mesh
    assert!(extracted.video.is_none());
    assert!(extracted.model_glb.is_none());
    assert!(extracted.thumbnail.is_none());

    let images = extracted.images.expect("should have images");
    assert_eq!(images.len(), 1);

    let image = &images[0];
    assert_eq!(image.url.as_deref(), Some("https://v3b.fal.media/files/b/0a99d392/qzx8aXgWTbf5tVcYEF0S8.jpg"));
    assert_eq!(image.width, Some(1024));
    assert_eq!(image.height, Some(768));
    assert_eq!(image.content_type.as_deref(), Some("image/jpeg"));
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
    let extracted = result.extracted_contents.expect("should have extracted contents");

    // Should have model_glb + thumbnail, not images or video
    assert!(extracted.images.is_none());
    assert!(extracted.video.is_none());

    let glb = extracted.model_glb.expect("should have model_glb");
    assert_eq!(glb.url.as_deref(), Some("https://v3b.fal.media/files/b/0a99d693/98becABi5mxR6w5Svy4oB_model.glb"));
    assert_eq!(glb.content_type.as_deref(), Some("model/gltf-binary"));
    assert_eq!(glb.file_name.as_deref(), Some("model.glb"));
    assert_eq!(glb.file_size, Some(33352724));

    let thumbnail = extracted.thumbnail.expect("should have thumbnail");
    assert_eq!(thumbnail.url.as_deref(), Some("https://v3b.fal.media/files/b/0a99d693/_wB78l-a_WmrlAzaKyTWy_preview.png"));
    assert_eq!(thumbnail.content_type.as_deref(), Some("image/png"));
    assert_eq!(thumbnail.file_name.as_deref(), Some("preview.png"));
    assert_eq!(thumbnail.file_size, Some(99797));
  }
}
