/// Output resolution for `/v1/videos/generations`.
///
/// Currently `480p` (server default) and `720p` are the only supported output
/// resolutions. The xAI REST schema also lists `"1080p"`, but the capability
/// page contradicts this — it documents that "a 1080p input will be downsized
/// to 720p", indicating 720p is the actual output cap. We follow the
/// capability page since it describes observed behavior rather than just the
/// wire schema.
///
/// If/when xAI removes the cap and 1080p is genuinely produced as output,
/// add a `TenEightyP` variant here.
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

  /// `"720p"` — HD quality. Currently the maximum supported output resolution.
  SevenTwentyP,
}

impl VideoResolution {
  /// Wire representation — the exact string xAI expects in the
  /// `"resolution"` field.
  pub fn as_str(&self) -> &'static str {
    match self {
      Self::FourEightyP  => "480p",
      Self::SevenTwentyP => "720p",
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
  }

  #[test]
  fn serializes_as_plain_wire_string() {
    assert_eq!(serde_json::to_string(&VideoResolution::FourEightyP).unwrap(), "\"480p\"");
    assert_eq!(serde_json::to_string(&VideoResolution::SevenTwentyP).unwrap(), "\"720p\"");
  }
}
