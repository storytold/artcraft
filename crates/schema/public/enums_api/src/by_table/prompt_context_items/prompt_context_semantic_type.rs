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

#[cfg(test)]
mod tests {
  use super::PromptContextSemanticType;
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn variants_count_check() {
      assert_eq!(PromptContextSemanticType::iter().count(), 10);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in PromptContextSemanticType::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: PromptContextSemanticType = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
