/// Aspect ratios accepted by the xAI image endpoints.
///
/// The wire format is `"<width>:<height>"` — e.g. `Square` serialises as
/// `"1:1"`, `Cinematic20x9` as `"20:9"`. `Auto` defers to xAI to pick.
///
/// xAI documents this closed set; see
/// <https://docs.x.ai/developers/rest-api-reference/inference/images>.
#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub enum ImageAspectRatio {
  /// 1:1 square.
  Square,

  /// 3:4 portrait (slight tall).
  Portrait3x4,

  /// 4:3 landscape (slight wide).
  Landscape4x3,

  /// 9:16 portrait (phone/vertical-video).
  Portrait9x16,

  /// 16:9 landscape (widescreen / YouTube).
  Landscape16x9,

  /// 2:3 portrait (photo).
  Portrait2x3,

  /// 3:2 landscape (photo).
  Landscape3x2,

  /// 9:19.5 portrait (modern phone screens).
  Portrait9x19_5,

  /// 19.5:9 landscape (modern phone screens, rotated).
  Landscape19_5x9,

  /// 9:20 portrait (taller phone).
  Portrait9x20,

  /// 20:9 landscape (taller phone, rotated).
  Landscape20x9,

  /// 1:2 ultra-portrait.
  Portrait1x2,

  /// 2:1 ultra-landscape.
  Landscape2x1,

  /// Let xAI pick the aspect ratio (typically matches the source image for edits).
  Auto,
}

impl ImageAspectRatio {
  /// Wire representation — the exact string xAI expects in the
  /// `"aspect_ratio"` field.
  pub fn as_str(&self) -> &'static str {
    match self {
      Self::Square           => "1:1",
      Self::Portrait3x4      => "3:4",
      Self::Landscape4x3     => "4:3",
      Self::Portrait9x16     => "9:16",
      Self::Landscape16x9    => "16:9",
      Self::Portrait2x3      => "2:3",
      Self::Landscape3x2     => "3:2",
      Self::Portrait9x19_5   => "9:19.5",
      Self::Landscape19_5x9  => "19.5:9",
      Self::Portrait9x20     => "9:20",
      Self::Landscape20x9    => "20:9",
      Self::Portrait1x2      => "1:2",
      Self::Landscape2x1     => "2:1",
      Self::Auto             => "auto",
    }
  }
}

// Serialize as the wire string ("1:1", "16:9", "auto", …) rather than the
// default external-tag enum form. Lets request structs round-trip cleanly
// through a log/audit pipeline.
impl serde::Serialize for ImageAspectRatio {
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
      ImageAspectRatio::Square,
      ImageAspectRatio::Portrait3x4,
      ImageAspectRatio::Landscape4x3,
      ImageAspectRatio::Portrait9x16,
      ImageAspectRatio::Landscape16x9,
      ImageAspectRatio::Portrait2x3,
      ImageAspectRatio::Landscape3x2,
      ImageAspectRatio::Portrait9x19_5,
      ImageAspectRatio::Landscape19_5x9,
      ImageAspectRatio::Portrait9x20,
      ImageAspectRatio::Landscape20x9,
      ImageAspectRatio::Portrait1x2,
      ImageAspectRatio::Landscape2x1,
      ImageAspectRatio::Auto,
    ];
    let mut strs: Vec<&str> = all.iter().map(|v| v.as_str()).collect();
    strs.sort();
    strs.dedup();
    assert_eq!(strs.len(), 14, "expected 14 distinct wire values, got {:?}", strs);
  }

  #[test]
  fn matches_docs_strings() {
    assert_eq!(ImageAspectRatio::Square.as_str(), "1:1");
    assert_eq!(ImageAspectRatio::Landscape16x9.as_str(), "16:9");
    assert_eq!(ImageAspectRatio::Portrait9x19_5.as_str(), "9:19.5");
    assert_eq!(ImageAspectRatio::Landscape19_5x9.as_str(), "19.5:9");
    assert_eq!(ImageAspectRatio::Auto.as_str(), "auto");
  }

  #[test]
  fn serializes_as_plain_wire_string() {
    assert_eq!(serde_json::to_string(&ImageAspectRatio::Square).unwrap(), "\"1:1\"");
    assert_eq!(serde_json::to_string(&ImageAspectRatio::Portrait9x19_5).unwrap(), "\"9:19.5\"");
    assert_eq!(serde_json::to_string(&ImageAspectRatio::Auto).unwrap(), "\"auto\"");
  }
}
