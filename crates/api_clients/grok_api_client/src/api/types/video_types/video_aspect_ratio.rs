/// Aspect ratios accepted by `/v1/videos/generations`.
///
/// The wire format is `"<width>:<height>"` — e.g. [`VideoAspectRatio::Square`]
/// serialises as `"1:1"`, [`VideoAspectRatio::Landscape16x9`] as `"16:9"`.
///
/// Note: the video endpoint accepts FEWER aspect ratios than image endpoints
/// — there's no `auto`, no ultra-portrait `9:19.5` or `9:20`, no `1:2`/`2:1`.
/// xAI documents this closed set of 7.
///
/// Video edits (`/v1/videos/edits`) and extensions (`/v1/videos/extensions`)
/// don't accept this field — they inherit the source video's dimensions.
///
/// Docs:
/// - <https://docs.x.ai/developers/model-capabilities/video/generation>
/// - <https://docs.x.ai/developers/rest-api-reference/inference/videos>
#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub enum VideoAspectRatio {
  /// 1:1 square.
  Square,

  /// 16:9 landscape (widescreen / YouTube). xAI default.
  Landscape16x9,

  /// 9:16 portrait (phone / vertical video).
  Portrait9x16,

  /// 4:3 landscape (classic TV).
  Landscape4x3,

  /// 3:4 portrait.
  Portrait3x4,

  /// 3:2 landscape (photo).
  Landscape3x2,

  /// 2:3 portrait (photo).
  Portrait2x3,
}

impl VideoAspectRatio {
  /// Wire representation — the exact string xAI expects in the
  /// `"aspect_ratio"` field.
  pub fn as_str(&self) -> &'static str {
    match self {
      Self::Square        => "1:1",
      Self::Landscape16x9 => "16:9",
      Self::Portrait9x16  => "9:16",
      Self::Landscape4x3  => "4:3",
      Self::Portrait3x4   => "3:4",
      Self::Landscape3x2  => "3:2",
      Self::Portrait2x3   => "2:3",
    }
  }
}

// Serialize as the wire string ("1:1", "16:9", …) rather than the default
// external-tag enum form.
impl serde::Serialize for VideoAspectRatio {
  fn serialize<S: serde::Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
    s.serialize_str(self.as_str())
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn every_variant_maps_to_a_distinct_string() {
    let all = [
      VideoAspectRatio::Square,
      VideoAspectRatio::Landscape16x9,
      VideoAspectRatio::Portrait9x16,
      VideoAspectRatio::Landscape4x3,
      VideoAspectRatio::Portrait3x4,
      VideoAspectRatio::Landscape3x2,
      VideoAspectRatio::Portrait2x3,
    ];
    let mut strs: Vec<&str> = all.iter().map(|v| v.as_str()).collect();
    strs.sort();
    strs.dedup();
    assert_eq!(strs.len(), 7, "expected 7 distinct wire values, got {:?}", strs);
  }

  #[test]
  fn matches_docs_strings() {
    assert_eq!(VideoAspectRatio::Square.as_str(), "1:1");
    assert_eq!(VideoAspectRatio::Landscape16x9.as_str(), "16:9");
    assert_eq!(VideoAspectRatio::Portrait9x16.as_str(), "9:16");
    assert_eq!(VideoAspectRatio::Landscape4x3.as_str(), "4:3");
    assert_eq!(VideoAspectRatio::Portrait3x4.as_str(), "3:4");
    assert_eq!(VideoAspectRatio::Landscape3x2.as_str(), "3:2");
    assert_eq!(VideoAspectRatio::Portrait2x3.as_str(), "2:3");
  }

  #[test]
  fn serializes_as_plain_wire_string() {
    assert_eq!(serde_json::to_string(&VideoAspectRatio::Landscape16x9).unwrap(), "\"16:9\"");
    assert_eq!(serde_json::to_string(&VideoAspectRatio::Square).unwrap(), "\"1:1\"");
  }
}
