use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::video::text::flux_3::api::{Flux3AspectRatio, Flux3Duration};
use crate::requests::api::video::text::flux_3_draft::raw_request::{
  Flux3DraftTextToVideoInput, Flux3DraftTextToVideoOutput,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

/// Flux 3 Draft text-to-video: lower cost, lower fidelity (always 720p). The
/// response includes a `draft_cache` that `draft-enhance` can upgrade to a
/// full-quality 1080p render.
#[derive(Clone, Debug)]
pub struct Flux3DraftTextToVideoRequest {
  /// Text prompt for video generation.
  pub prompt: String,

  /// Duration in seconds. fal's default is `auto` when `None` (the model
  /// picks a duration that fits the prompt).
  pub duration: Option<Flux3Duration>,

  /// Aspect ratio. fal's default is `auto` when `None`.
  pub aspect_ratio: Option<Flux3AspectRatio>,

  /// Whether to generate synchronized audio. fal's default is `true` when
  /// `None`. Audio does not affect the bill.
  pub generate_audio: Option<bool>,

  /// Safety tolerance, 0 (strictest) to 4 (most permissive). fal's default is
  /// `2` when `None`.
  pub safety_tolerance: Option<u8>,
}

impl FalEndpoint for Flux3DraftTextToVideoRequest {
  const ENDPOINT: &str = "blackforestlabs/flux-3/text-to-video/draft";

  type RawRequest = Flux3DraftTextToVideoInput;
  type RawResponse = Flux3DraftTextToVideoOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    Ok(Self::RawRequest {
      prompt: self.prompt.clone(),
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

  // ── Real requests (manually run; require a live key and cost money) ──

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_text_to_video_webhook() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = Flux3DraftTextToVideoRequest {
      prompt: "a white kitten chases a butterfly across a sunlit garden".to_string(),
      duration: Some(Flux3Duration::Seconds(5)),
      aspect_ratio: Some(Flux3AspectRatio::SixteenByNine),
      generate_audio: Some(false),
      safety_tolerance: None,
    };

    let result = request.send_webhook_request(&api_key, "https://example.com/webhook").await?;
    println!("Webhook result: {:?}", result);
    assert!(result.request_id.is_some() || result.gateway_request_id.is_some());
    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_text_to_video_queue() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = Flux3DraftTextToVideoRequest {
      prompt: "a wave crashes against a rocky shoreline at sunset".to_string(),
      duration: Some(Flux3Duration::Seconds(5)),
      aspect_ratio: Some(Flux3AspectRatio::SixteenByNine),
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
    let request = Flux3DraftTextToVideoRequest {
      prompt: "p".to_string(),
      duration: Some(Flux3Duration::Seconds(12)),
      aspect_ratio: Some(Flux3AspectRatio::ThreeByFour),
      generate_audio: Some(false),
      safety_tolerance: Some(4),
    };
    let raw = request.to_raw_request().unwrap();
    assert_eq!(raw.prompt, "p");
    assert_eq!(raw.duration, Some(Flux3Duration::Seconds(12)));
    assert_eq!(raw.aspect_ratio.as_deref(), Some("3:4"));
    assert_eq!(raw.generate_audio, Some(false));
    assert_eq!(raw.safety_tolerance, Some(4));
  }

  #[test]
  fn raw_request_omits_unset_optionals() {
    let request = Flux3DraftTextToVideoRequest {
      prompt: "minimal".to_string(),
      duration: None,
      aspect_ratio: None,
      generate_audio: None,
      safety_tolerance: None,
    };
    let json = serde_json::to_value(request.to_raw_request().unwrap()).unwrap();
    assert_eq!(json, serde_json::json!({ "prompt": "minimal" }));
  }

  #[test]
  fn draft_output_parses_video_and_draft_cache() {
    let json = serde_json::json!({
      "video": { "url": "https://example.com/draft.mp4" },
      "draft_cache": { "url": "https://example.com/cache.bin" },
      "extra_field": true,
    });
    let output: Flux3DraftTextToVideoOutput = serde_json::from_value(json).unwrap();
    assert_eq!(output.video.url, "https://example.com/draft.mp4");
    assert_eq!(output.draft_cache.url, "https://example.com/cache.bin");
  }

  #[test]
  fn endpoint_path_is_canonical() {
    assert_eq!(Flux3DraftTextToVideoRequest::ENDPOINT, "blackforestlabs/flux-3/text-to-video/draft");
  }

  // NB: Pricing tests are in cost.rs
}
