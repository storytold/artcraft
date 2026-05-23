/// Models accepted by the xAI image endpoints (`/v1/images/generations` and
/// `/v1/images/edits`).
///
/// xAI may add or deprecate models faster than this crate ships releases, so
/// the [`ImageModel::Custom`] escape hatch lets callers pass an arbitrary
/// identifier without waiting for a code change.
///
/// Docs:
/// - <https://docs.x.ai/developers/model-capabilities/images/generation>
/// - <https://docs.x.ai/developers/model-capabilities/images/editing>
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum ImageModel {
  /// `grok-imagine-image-quality` — the current default high-quality model.
  GrokImagineImageQuality,

  /// Escape hatch for model identifiers not yet enumerated here (e.g. a
  /// newly-released model or a deprecated one xAI hasn't yet removed).
  Custom(String),
}

impl ImageModel {
  /// Wire representation — the exact string xAI expects in the `"model"` field.
  pub fn as_str(&self) -> &str {
    match self {
      Self::GrokImagineImageQuality => "grok-imagine-image-quality",
      Self::Custom(s) => s.as_str(),
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn known_model_serializes() {
    assert_eq!(ImageModel::GrokImagineImageQuality.as_str(), "grok-imagine-image-quality");
  }

  #[test]
  fn custom_model_passes_through() {
    let m = ImageModel::Custom("grok-imagine-image-future".to_string());
    assert_eq!(m.as_str(), "grok-imagine-image-future");
  }
}
