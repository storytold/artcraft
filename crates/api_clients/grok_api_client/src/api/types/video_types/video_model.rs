/// Models accepted by the xAI video endpoints (`/v1/videos/generations`,
/// `/v1/videos/edits`, `/v1/videos/extensions`). All three endpoints accept
/// the same model identifier.
///
/// xAI may add or deprecate models faster than this crate ships releases, so
/// the [`VideoModel::Custom`] escape hatch lets callers pass an arbitrary
/// identifier without waiting for a code change.
///
/// Docs:
/// - Models list: <https://docs.x.ai/docs/models>
/// - <https://docs.x.ai/developers/model-capabilities/video/generation>
/// - <https://docs.x.ai/developers/model-capabilities/video/editing>
/// - <https://docs.x.ai/developers/model-capabilities/video/extension>
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum VideoModel {
  /// `grok-imagine-video` — the (currently sole) video model. Used by
  /// generation, editing, and extension endpoints.
  GrokImagineVideo,

  /// Escape hatch for model identifiers not yet enumerated here.
  Custom(String),
}

impl VideoModel {
  /// Wire representation — the exact string xAI expects in the `"model"` field.
  pub fn as_str(&self) -> &str {
    match self {
      Self::GrokImagineVideo => "grok-imagine-video",
      Self::Custom(s)        => s.as_str(),
    }
  }
}

// Serialize as the wire string ("grok-imagine-video" or the Custom inner
// string) rather than the default external-tag enum format. Lets the public
// VideoGeneration/Edit/ExtensionRequest types round-trip through any
// log/audit pipeline as readable JSON.
impl serde::Serialize for VideoModel {
  fn serialize<S: serde::Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
    s.serialize_str(self.as_str())
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn known_model_serializes() {
    assert_eq!(VideoModel::GrokImagineVideo.as_str(), "grok-imagine-video");
  }

  #[test]
  fn custom_model_passes_through() {
    let m = VideoModel::Custom("grok-imagine-video-future".to_string());
    assert_eq!(m.as_str(), "grok-imagine-video-future");
  }

  #[test]
  fn serializes_as_plain_wire_string() {
    assert_eq!(serde_json::to_string(&VideoModel::GrokImagineVideo).unwrap(), "\"grok-imagine-video\"");
    let m = VideoModel::Custom("grok-imagine-video-v2".to_string());
    assert_eq!(serde_json::to_string(&m).unwrap(), "\"grok-imagine-video-v2\"");
  }
}
