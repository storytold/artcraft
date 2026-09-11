use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

use crate::error::enum_error::EnumError;

/// Maximum serialized string length for future database storage.
pub const MAX_LENGTH: usize = 24;

/// The broad class of model (image, video, audio, 3D, etc.)
///
/// NB: This is not currently stored in the database, so it does not need
/// `impl_mysql_enum_coders!` or `impl_mysql_from_row!` macros. If it is
/// stored in the future, add those macros and a migration.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, Deserialize, ToSchema)]
pub enum CommonModelClass {
  #[serde(rename = "image")]
  Image,

  #[serde(rename = "video")]
  Video,

  #[serde(rename = "audio")]
  Audio,

  #[serde(rename = "audio_music")]
  AudioMusic,

  #[serde(rename = "audio_voice")]
  AudioVoice,

  #[serde(rename = "3d")]
  Dimensional,

  #[serde(rename = "3d_mesh")]
  DimensionalMesh,

  #[serde(rename = "3d_splat")]
  DimensionalSplat,
}

impl_enum_display_and_debug_using_to_str!(CommonModelClass);

impl CommonModelClass {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Image => "image",
      Self::Video => "video",
      Self::Audio => "audio",
      Self::AudioMusic => "audio_music",
      Self::AudioVoice => "audio_voice",
      Self::Dimensional => "3d",
      Self::DimensionalMesh => "3d_mesh",
      Self::DimensionalSplat => "3d_splat",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, EnumError> {
    match value {
      "image" => Ok(Self::Image),
      "video" => Ok(Self::Video),
      "audio" => Ok(Self::Audio),
      "audio_music" => Ok(Self::AudioMusic),
      "audio_voice" => Ok(Self::AudioVoice),
      "3d" => Ok(Self::Dimensional),
      "3d_mesh" => Ok(Self::DimensionalMesh),
      "3d_splat" => Ok(Self::DimensionalSplat),
      _ => Err(EnumError::CouldNotConvertFromString(value.to_string())),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    BTreeSet::from([
      Self::Image,
      Self::Video,
      Self::Audio,
      Self::AudioMusic,
      Self::AudioVoice,
      Self::Dimensional,
      Self::DimensionalMesh,
      Self::DimensionalSplat,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::common::generation::common_model_class::CommonModelClass;
  use crate::common::generation::common_model_class::MAX_LENGTH;
  use crate::test_helpers::assert_serialization;

  mod explicit_checks {
    use super::*;
    use crate::error::enum_error::EnumError;

    #[test]
    fn test_serialization() {
      assert_serialization(CommonModelClass::Image, "image");
      assert_serialization(CommonModelClass::Video, "video");
      assert_serialization(CommonModelClass::Audio, "audio");
      assert_serialization(CommonModelClass::AudioMusic, "audio_music");
      assert_serialization(CommonModelClass::AudioVoice, "audio_voice");
      assert_serialization(CommonModelClass::Dimensional, "3d");
      assert_serialization(CommonModelClass::DimensionalMesh, "3d_mesh");
      assert_serialization(CommonModelClass::DimensionalSplat, "3d_splat");
    }

    #[test]
    fn to_str() {
      assert_eq!(CommonModelClass::Image.to_str(), "image");
      assert_eq!(CommonModelClass::Video.to_str(), "video");
      assert_eq!(CommonModelClass::Audio.to_str(), "audio");
      assert_eq!(CommonModelClass::AudioMusic.to_str(), "audio_music");
      assert_eq!(CommonModelClass::AudioVoice.to_str(), "audio_voice");
      assert_eq!(CommonModelClass::Dimensional.to_str(), "3d");
      assert_eq!(CommonModelClass::DimensionalMesh.to_str(), "3d_mesh");
      assert_eq!(CommonModelClass::DimensionalSplat.to_str(), "3d_splat");
    }

    #[test]
    fn from_str() {
      assert_eq!(CommonModelClass::from_str("image").unwrap(), CommonModelClass::Image);
      assert_eq!(CommonModelClass::from_str("video").unwrap(), CommonModelClass::Video);
      assert_eq!(CommonModelClass::from_str("audio").unwrap(), CommonModelClass::Audio);
      assert_eq!(CommonModelClass::from_str("audio_music").unwrap(), CommonModelClass::AudioMusic);
      assert_eq!(CommonModelClass::from_str("audio_voice").unwrap(), CommonModelClass::AudioVoice);
      assert_eq!(CommonModelClass::from_str("3d").unwrap(), CommonModelClass::Dimensional);
      assert_eq!(CommonModelClass::from_str("3d_mesh").unwrap(), CommonModelClass::DimensionalMesh);
      assert_eq!(CommonModelClass::from_str("3d_splat").unwrap(), CommonModelClass::DimensionalSplat);
    }

    #[test]
    fn from_str_err() {
      let result = CommonModelClass::from_str("invalid");
      assert!(result.is_err());
      if let Err(EnumError::CouldNotConvertFromString(value)) = result {
        assert_eq!(value, "invalid");
      } else {
        panic!("Expected EnumError::CouldNotConvertFromString");
      }
    }

    #[test]
    fn all_variants() {
      let mut variants = CommonModelClass::all_variants();
      assert_eq!(variants.len(), 8);
      assert_eq!(variants.pop_first(), Some(CommonModelClass::Image));
      assert_eq!(variants.pop_first(), Some(CommonModelClass::Video));
      assert_eq!(variants.pop_first(), Some(CommonModelClass::Audio));
      assert_eq!(variants.pop_first(), Some(CommonModelClass::AudioMusic));
      assert_eq!(variants.pop_first(), Some(CommonModelClass::AudioVoice));
      assert_eq!(variants.pop_first(), Some(CommonModelClass::Dimensional));
      assert_eq!(variants.pop_first(), Some(CommonModelClass::DimensionalMesh));
      assert_eq!(variants.pop_first(), Some(CommonModelClass::DimensionalSplat));
      assert_eq!(variants.pop_first(), None);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(CommonModelClass::all_variants().len(), CommonModelClass::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in CommonModelClass::all_variants() {
        assert_eq!(variant, CommonModelClass::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, CommonModelClass::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, CommonModelClass::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      for variant in CommonModelClass::all_variants() {
        let serialized = variant.to_str();
        assert!(serialized.len() > 0, "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }

    #[test]
    fn serialized_names_must_not_contain_dots() {
      for variant in CommonModelClass::all_variants() {
        let to_str_value = variant.to_str();
        assert!(!to_str_value.contains('.'), "to_str() for {:?} contains a dot: {:?}", variant, to_str_value);

        let json_value = serde_json::to_string(&variant).unwrap().replace('"', "");
        assert!(!json_value.contains('.'), "JSON serialization for {:?} contains a dot: {:?}", variant, json_value);
      }
    }

    #[test]
    fn serialized_names_must_only_contain_lowercase_alphanumeric_and_underscore() {
      let valid_pattern = regex::Regex::new(r"^[a-z0-9_]+$").unwrap();

      for variant in CommonModelClass::all_variants() {
        let to_str_value = variant.to_str();
        assert!(valid_pattern.is_match(to_str_value),
          "to_str() for {:?} contains invalid characters: {:?} (only a-z, 0-9, _ allowed)", variant, to_str_value);

        let json_value = serde_json::to_string(&variant).unwrap().replace('"', "");
        assert!(valid_pattern.is_match(&json_value),
          "JSON serialization for {:?} contains invalid characters: {:?} (only a-z, 0-9, _ allowed)", variant, json_value);
      }
    }
  }
}
