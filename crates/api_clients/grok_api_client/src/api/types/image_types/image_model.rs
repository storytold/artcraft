/// Models accepted by the xAI image endpoints (`/v1/images/generations` and
/// `/v1/images/edits`). Both endpoints accept all variants here.
///
/// xAI may add or deprecate models faster than this crate ships releases, so
/// the [`ImageModel::Custom`] escape hatch lets callers pass an arbitrary
/// identifier without waiting for a code change.
///
/// Docs:
/// - Models list: <https://docs.x.ai/docs/models>
/// - <https://docs.x.ai/developers/model-capabilities/images/generation>
/// - <https://docs.x.ai/developers/model-capabilities/images/editing>
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum ImageModel {
  /// `grok-imagine-image` — the standard image model. $0.02 / image as of
  /// the docs at time of writing; lower cost and faster than the `-quality`
  /// variant, at the expense of fidelity.
  GrokImagineImage,

  /// `grok-imagine-image-quality` — the higher-quality image model. $0.05 /
  /// image as of the docs at time of writing. xAI recommends this as the
  /// default for new requests.
  GrokImagineImageQuality,

  /// Escape hatch for model identifiers not yet enumerated here.
  ///
  /// Useful for forward compat and for legacy/deprecated identifiers (e.g.
  /// `grok-imagine-image-pro`, deprecated as of 2026-05-15) that still
  /// function until xAI removes them.
  Custom(String),
}

impl ImageModel {
  /// Wire representation — the exact string xAI expects in the `"model"` field.
  pub fn as_str(&self) -> &str {
    match self {
      Self::GrokImagineImage        => "grok-imagine-image",
      Self::GrokImagineImageQuality => "grok-imagine-image-quality",
      Self::Custom(s)               => s.as_str(),
    }
  }
}

// Serialize as the wire string ("grok-imagine-image", "grok-imagine-image-quality",
// or the Custom inner string) rather than the default external-tag enum format.
// Lets `ImageGenerationRequest` / `ImageEditRequest` round-trip through any
// log/audit pipeline as readable JSON.
impl serde::Serialize for ImageModel {
  fn serialize<S: serde::Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
    s.serialize_str(self.as_str())
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn standard_model_serializes() {
    assert_eq!(ImageModel::GrokImagineImage.as_str(), "grok-imagine-image");
  }

  #[test]
  fn quality_model_serializes() {
    assert_eq!(ImageModel::GrokImagineImageQuality.as_str(), "grok-imagine-image-quality");
  }

  #[test]
  fn custom_model_passes_through() {
    let m = ImageModel::Custom("grok-imagine-image-future".to_string());
    assert_eq!(m.as_str(), "grok-imagine-image-future");
  }

  #[test]
  fn deprecated_pro_model_still_usable_via_custom() {
    let m = ImageModel::Custom("grok-imagine-image-pro".to_string());
    assert_eq!(m.as_str(), "grok-imagine-image-pro");
  }

  #[test]
  fn standard_and_quality_are_distinct_strings() {
    assert_ne!(
      ImageModel::GrokImagineImage.as_str(),
      ImageModel::GrokImagineImageQuality.as_str()
    );
  }

  #[test]
  fn serializes_as_plain_wire_string() {
    let m = ImageModel::GrokImagineImageQuality;
    assert_eq!(serde_json::to_string(&m).unwrap(), "\"grok-imagine-image-quality\"");
    let m = ImageModel::GrokImagineImage;
    assert_eq!(serde_json::to_string(&m).unwrap(), "\"grok-imagine-image\"");
    let m = ImageModel::Custom("grok-imagine-image-pro".to_string());
    assert_eq!(serde_json::to_string(&m).unwrap(), "\"grok-imagine-image-pro\"");
  }
}
