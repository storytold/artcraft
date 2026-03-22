use strum::EnumCount;
use strum::EnumIter;

/// Used in the `generic_inference_jobs` table in `VARCHAR(32)` field `on_success_result_entity_type`.
///
/// Our "generic inference" pipeline supports a wide variety of output types.
/// Each "result type" is identified by the following enum variants.
///
/// These types are present in the HTTP API and database columns as serialized here.
///
/// YOU CAN ADD NEW VALUES, BUT DO NOT CHANGE EXISTING VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, EnumIter, EnumCount)]
pub enum InferenceResultType {
  /// Result is stored in the "media_files" table.
  /// (The upstream model could have produced any type of media - image, video, audio. That is irrelevant.)
  #[serde(rename = "media_file")]
  MediaFile,

  #[serde(rename = "text_to_speech")]
  TextToSpeech,

  #[serde(rename = "voice_conversion")]
  VoiceConversion,

  #[serde(rename = "zs_voice_embedding")]
  ZeroShotVoiceEmbedding,

  #[serde(rename = "upload_model")]
  UploadModel
}

// TODO(bt, 2022-12-21): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(InferenceResultType);
impl_mysql_enum_coders!(InferenceResultType);
impl_mysql_from_row!(InferenceResultType);

/// NB: Legacy API for older code.
impl InferenceResultType {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::MediaFile => "media_file",
      Self::TextToSpeech => "text_to_speech",
      Self::VoiceConversion => "voice_conversion",
      Self::ZeroShotVoiceEmbedding => "zs_voice_embedding",
      Self::UploadModel => "upload_model",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "media_file" => Ok(Self::MediaFile),
      "text_to_speech" => Ok(Self::TextToSpeech),
      "voice_conversion" => Ok(Self::VoiceConversion),
      "zs_voice_embedding" => Ok(Self::ZeroShotVoiceEmbedding),
      "upload_model" => Ok(Self::UploadModel),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

}

#[cfg(test)]
mod tests {
  use super::super::inference_result_type::InferenceResultType;
  use enums_shared::test_helpers::assert_serialization;

  #[test]
  fn test_serialization() {
    assert_serialization(InferenceResultType::MediaFile, "media_file");
    assert_serialization(InferenceResultType::TextToSpeech, "text_to_speech");
    assert_serialization(InferenceResultType::VoiceConversion, "voice_conversion");
    assert_serialization(InferenceResultType::ZeroShotVoiceEmbedding, "zs_voice_embedding");
    assert_serialization(InferenceResultType::UploadModel, "upload_model");
  }

  #[test]
  fn to_str() {
    assert_eq!(InferenceResultType::MediaFile.to_str(), "media_file");
    assert_eq!(InferenceResultType::TextToSpeech.to_str(), "text_to_speech");
    assert_eq!(InferenceResultType::VoiceConversion.to_str(), "voice_conversion");
    assert_eq!(InferenceResultType::ZeroShotVoiceEmbedding.to_str(), "zs_voice_embedding");
    assert_eq!(InferenceResultType::UploadModel.to_str(), "upload_model");
  }

  #[test]
  fn from_str() {
    assert_eq!(InferenceResultType::from_str("media_file").unwrap(), InferenceResultType::MediaFile);
    assert_eq!(InferenceResultType::from_str("text_to_speech").unwrap(), InferenceResultType::TextToSpeech);
    assert_eq!(InferenceResultType::from_str("voice_conversion").unwrap(), InferenceResultType::VoiceConversion);
    assert_eq!(InferenceResultType::from_str("zs_voice_embedding").unwrap(), InferenceResultType::ZeroShotVoiceEmbedding);
    assert_eq!(InferenceResultType::from_str("upload_model").unwrap(), InferenceResultType::UploadModel);
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip() {
      use strum::IntoEnumIterator;
      for variant in InferenceResultType::iter() {
        assert_eq!(variant, InferenceResultType::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, InferenceResultType::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, InferenceResultType::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      const MAX_LENGTH: usize = 32; // TODO(bt): Confirm database column width, then remove this comment.
      use strum::IntoEnumIterator;
      for variant in InferenceResultType::iter() {
        let serialized = variant.to_str();
        assert!(!serialized.is_empty(), "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
