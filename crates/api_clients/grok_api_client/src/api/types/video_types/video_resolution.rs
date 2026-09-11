/// Output resolution for `/v1/videos/generations`.
///
/// `480p` (server default), `720p`, and `1080p`. The 1.5 model produces
/// genuine 1080p output (the original `grok-imagine-video` capped at 720p).
///
/// Video edits (`/v1/videos/edits`) and extensions (`/v1/videos/extensions`)
/// don't accept this field — they inherit the source video's resolution
/// (capped at 720p).
///
/// Docs:
/// - <https://docs.x.ai/developers/model-capabilities/video/generation>
/// - <https://docs.x.ai/developers/rest-api-reference/inference/videos>
#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub enum VideoResolution {
  /// `"480p"` — standard definition, faster processing. Server default.
  FourEightyP,

  /// `"720p"` — HD quality.
  SevenTwentyP,

  /// `"1080p"` — full HD. Supported by `grok-imagine-video-1.5`.
  TenEightyP,
}

impl VideoResolution {
  /// Wire representation — the exact string xAI expects in the
  /// `"resolution"` field.
  pub fn as_str(&self) -> &'static str {
    match self {
      Self::FourEightyP  => "480p",
      Self::SevenTwentyP => "720p",
      Self::TenEightyP   => "1080p",
    }
  }
}

// Serialize as the wire string ("480p", "720p", "1080p").
impl serde::Serialize for VideoResolution {
  fn serialize<S: serde::Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
    s.serialize_str(self.as_str())
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn matches_docs_strings() {
    assert_eq!(VideoResolution::FourEightyP.as_str(), "480p");
    assert_eq!(VideoResolution::SevenTwentyP.as_str(), "720p");
    assert_eq!(VideoResolution::TenEightyP.as_str(), "1080p");
  }

  #[test]
  fn serializes_as_plain_wire_string() {
    assert_eq!(serde_json::to_string(&VideoResolution::FourEightyP).unwrap(), "\"480p\"");
    assert_eq!(serde_json::to_string(&VideoResolution::SevenTwentyP).unwrap(), "\"720p\"");
    assert_eq!(serde_json::to_string(&VideoResolution::TenEightyP).unwrap(), "\"1080p\"");
  }
}
