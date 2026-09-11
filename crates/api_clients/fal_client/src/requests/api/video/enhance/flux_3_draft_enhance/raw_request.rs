use serde::{Deserialize, Serialize};

/// Over-the-wire input shape for `blackforestlabs/flux-3/draft-enhance`.
/// fal's schema: <https://fal.ai/models/blackforestlabs/flux-3/draft-enhance/api>
#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Flux3DraftEnhanceInput {
  /// URL of the `draft_cache` bundle returned by a Flux 3 Draft generation.
  pub draft_cache_url: String,

  /// Safety tolerance, 0 (strictest) to 4 (most permissive). fal default: 2.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub safety_tolerance: Option<u8>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Flux3DraftEnhanceVideoFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Flux3DraftEnhanceOutput {
  pub video: Flux3DraftEnhanceVideoFile,
}
