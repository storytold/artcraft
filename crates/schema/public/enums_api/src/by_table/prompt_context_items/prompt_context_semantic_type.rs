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
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(PromptContextSemanticType::VidStartFrame, "vid_start_frame");
      assert_serialization(PromptContextSemanticType::VidEndFrame, "vid_end_frame");
      assert_serialization(PromptContextSemanticType::VidRef, "vid_ref");
      assert_serialization(PromptContextSemanticType::Imgsrc, "imgsrc");
      assert_serialization(PromptContextSemanticType::Imgmask, "imgmask");
      assert_serialization(PromptContextSemanticType::Imgref, "imgref");
      assert_serialization(PromptContextSemanticType::ImgrefCharacter, "imgref_character");
      assert_serialization(PromptContextSemanticType::ImgrefStyle, "imgref_style");
      assert_serialization(PromptContextSemanticType::ImgrefBg, "imgref_bg");
      assert_serialization(PromptContextSemanticType::Audioref, "audioref");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("vid_start_frame", PromptContextSemanticType::VidStartFrame);
      assert_deserialization("vid_end_frame", PromptContextSemanticType::VidEndFrame);
      assert_deserialization("vid_ref", PromptContextSemanticType::VidRef);
      assert_deserialization("imgsrc", PromptContextSemanticType::Imgsrc);
      assert_deserialization("imgmask", PromptContextSemanticType::Imgmask);
      assert_deserialization("imgref", PromptContextSemanticType::Imgref);
      assert_deserialization("imgref_character", PromptContextSemanticType::ImgrefCharacter);
      assert_deserialization("imgref_style", PromptContextSemanticType::ImgrefStyle);
      assert_deserialization("imgref_bg", PromptContextSemanticType::ImgrefBg);
      assert_deserialization("audioref", PromptContextSemanticType::Audioref);
    }

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
