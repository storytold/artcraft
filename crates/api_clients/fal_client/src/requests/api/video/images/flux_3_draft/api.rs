use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::video::images::flux_3_draft::raw_request::{
  Flux3DraftFirstLastFrameToVideoInput, Flux3DraftFirstLastFrameToVideoOutput,
};
use crate::requests::api::video::text::flux_3::api::Flux3AspectRatio;
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

/// Flux 3 Draft first-last-frame-to-video: lower cost, lower fidelity (always
/// 720p). The response includes a `draft_cache` that `draft-enhance` can
/// upgrade to a full-quality 1080p render.
#[derive(Clone, Debug)]
pub struct Flux3DraftFirstLastFrameToVideoRequest {
  /// Text prompt for video generation.
  pub prompt: String,

  /// URL of the first frame.
  pub start_image_url: String,

  /// URL of the last frame.
  pub end_image_url: String,

  /// Duration in seconds. Valid range 5–20; fal's default is `5` when `None`.
  pub duration: Option<u8>,

  /// Aspect ratio. fal's default is `auto` when `None`.
  pub aspect_ratio: Option<Flux3AspectRatio>,

  /// Whether to generate synchronized audio. fal's default is `true` when
  /// `None`. Audio does not affect the bill.
  pub generate_audio: Option<bool>,

  /// Safety tolerance, 0 (strictest) to 4 (most permissive). fal's default is
  /// `2` when `None`.
  pub safety_tolerance: Option<u8>,
}

impl FalEndpoint for Flux3DraftFirstLastFrameToVideoRequest {
  const ENDPOINT: &str = "blackforestlabs/flux-3/first-last-frame-to-video/draft";

  type RawRequest = Flux3DraftFirstLastFrameToVideoInput;
  type RawResponse = Flux3DraftFirstLastFrameToVideoOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    Ok(Self::RawRequest {
      prompt: self.prompt.clone(),
      start_image_url: self.start_image_url.clone(),
      end_image_url: self.end_image_url.clone(),
      duration: self.duration,
      aspect_ratio: self.aspect_ratio.map(|ar| ar.to_str().to_string()),
      generate_audio: self.generate_audio,
      safety_tolerance: self.safety_tolerance,
    })
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::traits::fal_endpoint_trait::FalEndpoint;
  use errors::AnyhowResult;
  use std::fs::read_to_string;

  const START_IMAGE_URL: &str =
    "https://storage.googleapis.com/falserverless/example_inputs/veo31-flf2v-input-1.jpeg";
  const END_IMAGE_URL: &str =
    "https://storage.googleapis.com/falserverless/example_inputs/veo31-flf2v-input-2.jpeg";

  // ── Real requests (manually run; require a live key and cost money) ──

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_first_last_frame_to_video_queue() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = Flux3DraftFirstLastFrameToVideoRequest {
      prompt: "the scene smoothly transitions from the first frame to the last".to_string(),
      start_image_url: START_IMAGE_URL.to_string(),
      end_image_url: END_IMAGE_URL.to_string(),
      duration: Some(5),
      aspect_ratio: None,
      generate_audio: Some(false),
      safety_tolerance: None,
    };

    let result = request.send_queue_request(&api_key).await?;
    println!("Queue result — request_id: {}", result.request_id);
    assert!(!result.request_id.is_empty());
    Ok(())
  }

  // ── Wire-shape sanity (no API calls) ──

  #[test]
  fn raw_request_maps_all_fields() {
    let request = Flux3DraftFirstLastFrameToVideoRequest {
      prompt: "p".to_string(),
      start_image_url: "https://example.com/first.png".to_string(),
      end_image_url: "https://example.com/last.png".to_string(),
      duration: Some(7),
      aspect_ratio: Some(Flux3AspectRatio::Square),
      generate_audio: Some(false),
      safety_tolerance: Some(2),
    };
    let raw = request.to_raw_request().unwrap();
    assert_eq!(raw.prompt, "p");
    assert_eq!(raw.start_image_url, "https://example.com/first.png");
    assert_eq!(raw.end_image_url, "https://example.com/last.png");
    assert_eq!(raw.duration, Some(7));
    assert_eq!(raw.aspect_ratio.as_deref(), Some("1:1"));
    assert_eq!(raw.generate_audio, Some(false));
    assert_eq!(raw.safety_tolerance, Some(2));
  }

  #[test]
  fn raw_request_omits_unset_optionals() {
    let request = Flux3DraftFirstLastFrameToVideoRequest {
      prompt: "minimal".to_string(),
      start_image_url: "https://example.com/first.png".to_string(),
      end_image_url: "https://example.com/last.png".to_string(),
      duration: None,
      aspect_ratio: None,
      generate_audio: None,
      safety_tolerance: None,
    };
    let json = serde_json::to_value(request.to_raw_request().unwrap()).unwrap();
    assert_eq!(json, serde_json::json!({
      "prompt": "minimal",
      "start_image_url": "https://example.com/first.png",
      "end_image_url": "https://example.com/last.png",
    }));
  }

  #[test]
  fn endpoint_path_is_canonical() {
    assert_eq!(
      Flux3DraftFirstLastFrameToVideoRequest::ENDPOINT,
      "blackforestlabs/flux-3/first-last-frame-to-video/draft");
  }

  // NB: Pricing tests are in cost.rs
}
