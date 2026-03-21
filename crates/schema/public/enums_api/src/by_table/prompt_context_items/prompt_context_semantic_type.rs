use std::collections::BTreeSet;

use strum::EnumIter;
use utoipa::ToSchema;

/*
Current DB values - this is in conflict with API serializations. Need to fix!
imgref
imgsrc
imgmask
vid_start_frame
vid_end_frame
vidref
*/

/// Used in the `prompt_context_items` table in a `VARCHAR(16)` field.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Ord, PartialOrd, Deserialize, Serialize, ToSchema, EnumIter, Debug)]
#[serde(rename_all = "snake_case")]
pub enum PromptContextSemanticType {
  /// Image-to-Video starting frame
  VidStartFrame,

  /// Image-to-Video ending frame
  VidEndFrame,

  /// Reference image for video generation (e.g. Seedance "vidref" mode)
  VidRef,

  /// Source image, eg. for inpainting.
  Imgsrc,

  /// Image mask, eg. for inpainting.
  Imgmask,

  /// Standard image reference without a semantic type (e.g. Sora/ChatGPT 4o/gpt-image-1)
  Imgref,

  ImgrefCharacter,
  ImgrefStyle,
  ImgrefBg,

  /// Audio reference (e.g. for audio-to-video generation)
  Audioref,
}

/// NB: Legacy API for older code.
impl PromptContextSemanticType {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::VidStartFrame => "vid_start_frame",
      Self::VidEndFrame => "vid_end_frame",
      Self::VidRef => "vidref",
      Self::Imgsrc => "imgsrc",
      Self::Imgmask => "imgmask",
      Self::Imgref => "imgref",
      Self::ImgrefCharacter => "imgref_character",
      Self::ImgrefStyle => "imgref_style",
      Self::ImgrefBg => "imgref_bg",
      Self::Audioref => "audioref",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "vid_start_frame" => Ok(Self::VidStartFrame),
      "vid_end_frame" => Ok(Self::VidEndFrame),
      "vidref" => Ok(Self::VidRef),
      "imgsrc" => Ok(Self::Imgsrc),
      "imgmask" => Ok(Self::Imgmask),
      "imgref" => Ok(Self::Imgref),
      "imgref_character" => Ok(Self::ImgrefCharacter),
      "imgref_style" => Ok(Self::ImgrefStyle),
      "imgref_bg" => Ok(Self::ImgrefBg),
      "audioref" => Ok(Self::Audioref),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::VidStartFrame,
      Self::VidEndFrame,
      Self::VidRef,
      Self::Imgsrc,
      Self::Imgmask,
      Self::Imgref,
      Self::ImgrefCharacter,
      Self::ImgrefStyle,
      Self::ImgrefBg,
      Self::Audioref,
    ])
  }
}

#[cfg(test)]
mod tests {
  use super::PromptContextSemanticType;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in PromptContextSemanticType::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: PromptContextSemanticType = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
