use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::video::enhance::flux_3_draft_enhance::raw_request::{
  Flux3DraftEnhanceInput, Flux3DraftEnhanceOutput,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

/// Re-render a Flux 3 Draft generation at full quality (1080p, with
/// synchronized audio) from its `draft_cache` bundle.
#[derive(Clone, Debug)]
pub struct Flux3DraftEnhanceRequest {
  /// URL of the `draft_cache` bundle returned by a Flux 3 Draft generation.
  pub draft_cache_url: String,

  /// Safety tolerance, 0 (strictest) to 4 (most permissive). fal's default is
  /// `2` when `None`.
  pub safety_tolerance: Option<u8>,

  /// Duration of the draft being enhanced, in seconds. NOT sent to fal — the
  /// cache bundle already fixes the duration — but used by the cost
  /// calculator, which otherwise cannot know the billable length. Estimated
  /// at 5 seconds (the shortest draft) when `None`.
  pub expected_duration_seconds: Option<u8>,
}

impl FalEndpoint for Flux3DraftEnhanceRequest {
  const ENDPOINT: &str = "blackforestlabs/flux-3/draft-enhance";

  type RawRequest = Flux3DraftEnhanceInput;
  type RawResponse = Flux3DraftEnhanceOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    Ok(Self::RawRequest {
      draft_cache_url: self.draft_cache_url.clone(),
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
  #[ignore] // manually run — needs a fresh draft_cache URL from a prior draft run, and incurs cost
  async fn test_draft_enhance_queue() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    // Paste a `draft_cache` URL from a recent Flux 3 Draft generation here.
    let draft_cache_url = read_to_string("/tmp/flux3_draft_cache_url.txt")?;

    let request = Flux3DraftEnhanceRequest {
      draft_cache_url: draft_cache_url.trim().to_string(),
      safety_tolerance: None,
      expected_duration_seconds: Some(5),
    };

    let result = request.send_queue_request(&api_key).await?;
    println!("Queue result — request_id: {}", result.request_id);
    assert!(!result.request_id.is_empty());
    Ok(())
  }

  // ── Wire-shape sanity (no API calls) ──

  #[test]
  fn raw_request_maps_all_fields() {
    let request = Flux3DraftEnhanceRequest {
      draft_cache_url: "https://example.com/cache.bin".to_string(),
      safety_tolerance: Some(3),
      expected_duration_seconds: Some(10),
    };
    let raw = request.to_raw_request().unwrap();
    assert_eq!(raw.draft_cache_url, "https://example.com/cache.bin");
    assert_eq!(raw.safety_tolerance, Some(3));
  }

  /// `expected_duration_seconds` is cost-calculator metadata and must never
  /// reach the wire.
  #[test]
  fn expected_duration_is_not_serialized() {
    let request = Flux3DraftEnhanceRequest {
      draft_cache_url: "https://example.com/cache.bin".to_string(),
      safety_tolerance: None,
      expected_duration_seconds: Some(20),
    };
    let json = serde_json::to_value(request.to_raw_request().unwrap()).unwrap();
    assert_eq!(json, serde_json::json!({
      "draft_cache_url": "https://example.com/cache.bin",
    }));
  }

  #[test]
  fn endpoint_path_is_canonical() {
    assert_eq!(Flux3DraftEnhanceRequest::ENDPOINT, "blackforestlabs/flux-3/draft-enhance");
  }

  // NB: Pricing tests are in cost.rs
}
