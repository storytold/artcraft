use strum::EnumCount;
use strum::EnumIter;

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
#[derive(Clone, Copy, Eq, PartialEq, Ord, PartialOrd, Deserialize, Serialize, EnumIter, EnumCount)]
#[serde(rename_all = "snake_case")]
pub enum PromptContextSemanticType {
  /// Image-to-Video starting frame
  VidStartFrame,

  /// Image-to-Video ending frame
  VidEndFrame,

  /// Reference image for video generation (e.g. Seedance "vidref" mode)
  #[serde(rename = "vidref")]
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

// TODO(bt, 2022-12-21): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(PromptContextSemanticType);
impl_mysql_enum_coders!(PromptContextSemanticType);
impl_mysql_from_row!(PromptContextSemanticType);

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

}

#[cfg(test)]
mod tests {
  use super::super::prompt_context_semantic_type::PromptContextSemanticType;
  use enums_shared::test_helpers::assert_serialization;

  mod serde {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(PromptContextSemanticType::VidStartFrame, "vid_start_frame");
      assert_serialization(PromptContextSemanticType::VidEndFrame, "vid_end_frame");
      assert_serialization(PromptContextSemanticType::VidRef, "vidref");
      assert_serialization(PromptContextSemanticType::Imgsrc, "imgsrc");
      assert_serialization(PromptContextSemanticType::Imgmask, "imgmask");
      assert_serialization(PromptContextSemanticType::Imgref, "imgref");
      assert_serialization(PromptContextSemanticType::ImgrefCharacter, "imgref_character");
      assert_serialization(PromptContextSemanticType::ImgrefStyle, "imgref_style");
      assert_serialization(PromptContextSemanticType::ImgrefBg, "imgref_bg");
      assert_serialization(PromptContextSemanticType::Audioref, "audioref");
    }
  }

  mod impl_methods {
    use super::*;

    #[test]
    fn to_str() {
      assert_eq!(PromptContextSemanticType::VidStartFrame.to_str(), "vid_start_frame");
      assert_eq!(PromptContextSemanticType::VidEndFrame.to_str(), "vid_end_frame");
      assert_eq!(PromptContextSemanticType::VidRef.to_str(), "vidref");
      assert_eq!(PromptContextSemanticType::Imgsrc.to_str(), "imgsrc");
      assert_eq!(PromptContextSemanticType::Imgmask.to_str(), "imgmask");
      assert_eq!(PromptContextSemanticType::Imgref.to_str(), "imgref");
      assert_eq!(PromptContextSemanticType::ImgrefCharacter.to_str(), "imgref_character");
      assert_eq!(PromptContextSemanticType::ImgrefStyle.to_str(), "imgref_style");
      assert_eq!(PromptContextSemanticType::ImgrefBg.to_str(), "imgref_bg");
      assert_eq!(PromptContextSemanticType::Audioref.to_str(), "audioref");
    }

    #[test]
    fn from_str() {
      assert_eq!(PromptContextSemanticType::from_str("vid_start_frame").unwrap(), PromptContextSemanticType::VidStartFrame);
      assert_eq!(PromptContextSemanticType::from_str("vid_end_frame").unwrap(), PromptContextSemanticType::VidEndFrame);
      assert_eq!(PromptContextSemanticType::from_str("vidref").unwrap(), PromptContextSemanticType::VidRef);
      assert_eq!(PromptContextSemanticType::from_str("imgsrc").unwrap(), PromptContextSemanticType::Imgsrc);
      assert_eq!(PromptContextSemanticType::from_str("imgmask").unwrap(), PromptContextSemanticType::Imgmask);
      assert_eq!(PromptContextSemanticType::from_str("imgref").unwrap(), PromptContextSemanticType::Imgref);
      assert_eq!(PromptContextSemanticType::from_str("imgref_character").unwrap(), PromptContextSemanticType::ImgrefCharacter);
      assert_eq!(PromptContextSemanticType::from_str("imgref_style").unwrap(), PromptContextSemanticType::ImgrefStyle);
      assert_eq!(PromptContextSemanticType::from_str("imgref_bg").unwrap(), PromptContextSemanticType::ImgrefBg);
      assert_eq!(PromptContextSemanticType::from_str("audioref").unwrap(), PromptContextSemanticType::Audioref);
      assert!(PromptContextSemanticType::from_str("foo").is_err());
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip() {
      use strum::IntoEnumIterator;
      for variant in PromptContextSemanticType::iter() {
        assert_eq!(variant, PromptContextSemanticType::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, PromptContextSemanticType::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, PromptContextSemanticType::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      use strum::IntoEnumIterator;
      const MAX_LENGTH : usize = 16;
      for variant in PromptContextSemanticType::iter() {
        let serialized = variant.to_str();
        assert!(serialized.len() > 0, "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
