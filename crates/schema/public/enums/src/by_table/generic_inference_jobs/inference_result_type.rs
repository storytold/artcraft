use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;

/// Used in the `generic_inference_jobs` table in `VARCHAR(32)` field `on_success_result_entity_type`.
///
/// Our "generic inference" pipeline supports a wide variety of output types.
/// Each "result type" is identified by the following enum variants.
///
/// These types are present in the HTTP API and database columns as serialized here.
///
/// YOU CAN ADD NEW VALUES, BUT DO NOT CHANGE EXISTING VALUES WITHOUT A MIGRATION STRATEGY.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize)]
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
  UploadModel,

  /// Result is a character record.
  #[serde(rename = "character")]
  Character,
}

// TODO(bt, 2022-12-21): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(InferenceResultType);
impl_mysql_enum_coders!(InferenceResultType);

/// NB: Legacy API for older code.
impl InferenceResultType {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::MediaFile => "media_file",
      Self::TextToSpeech => "text_to_speech",
      Self::VoiceConversion => "voice_conversion",
      Self::ZeroShotVoiceEmbedding => "zs_voice_embedding",
      Self::UploadModel => "upload_model",
      Self::Character => "character",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "media_file" => Ok(Self::MediaFile),
      "text_to_speech" => Ok(Self::TextToSpeech),
      "voice_conversion" => Ok(Self::VoiceConversion),
      "zs_voice_embedding" => Ok(Self::ZeroShotVoiceEmbedding),
      "upload_model" => Ok(Self::UploadModel),
      "character" => Ok(Self::Character),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

  pub fn all_variants() -> BTreeSet<InferenceResultType> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      InferenceResultType::MediaFile,
      InferenceResultType::TextToSpeech,
      InferenceResultType::VoiceConversion,
      InferenceResultType::ZeroShotVoiceEmbedding,
      InferenceResultType::UploadModel,
      InferenceResultType::Character,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::by_table::generic_inference_jobs::inference_result_type::InferenceResultType;
  use crate::test_helpers::assert_serialization;

  #[test]
  fn test_serialization() {
    assert_serialization(InferenceResultType::MediaFile, "media_file");
    assert_serialization(InferenceResultType::TextToSpeech, "text_to_speech");
    assert_serialization(InferenceResultType::VoiceConversion, "voice_conversion");
    assert_serialization(InferenceResultType::ZeroShotVoiceEmbedding, "zs_voice_embedding");
    assert_serialization(InferenceResultType::UploadModel, "upload_model");
    assert_serialization(InferenceResultType::Character, "character");
  }

  #[test]
  fn to_str() {
    assert_eq!(InferenceResultType::MediaFile.to_str(), "media_file");
    assert_eq!(InferenceResultType::TextToSpeech.to_str(), "text_to_speech");
    assert_eq!(InferenceResultType::VoiceConversion.to_str(), "voice_conversion");
    assert_eq!(InferenceResultType::ZeroShotVoiceEmbedding.to_str(), "zs_voice_embedding");
    assert_eq!(InferenceResultType::UploadModel.to_str(), "upload_model");
    assert_eq!(InferenceResultType::Character.to_str(), "character");
  }

  #[test]
  fn from_str() {
    assert_eq!(InferenceResultType::from_str("media_file").unwrap(), InferenceResultType::MediaFile);
    assert_eq!(InferenceResultType::from_str("text_to_speech").unwrap(), InferenceResultType::TextToSpeech);
    assert_eq!(InferenceResultType::from_str("voice_conversion").unwrap(), InferenceResultType::VoiceConversion);
    assert_eq!(InferenceResultType::from_str("zs_voice_embedding").unwrap(), InferenceResultType::ZeroShotVoiceEmbedding);
    assert_eq!(InferenceResultType::from_str("upload_model").unwrap(), InferenceResultType::UploadModel);
    assert_eq!(InferenceResultType::from_str("character").unwrap(), InferenceResultType::Character);
    assert_eq!(InferenceResultType::from_str("invalid").is_err(), true);
  }

  #[test]
  fn all_variants() {
    // Static check
    let mut variants = InferenceResultType::all_variants();
    assert_eq!(variants.len(), 6);
    assert_eq!(variants.pop_first(), Some(InferenceResultType::MediaFile));
    assert_eq!(variants.pop_first(), Some(InferenceResultType::TextToSpeech));
    assert_eq!(variants.pop_first(), Some(InferenceResultType::VoiceConversion));
    assert_eq!(variants.pop_first(), Some(InferenceResultType::ZeroShotVoiceEmbedding));
    assert_eq!(variants.pop_first(), Some(InferenceResultType::UploadModel));
    assert_eq!(variants.pop_first(), Some(InferenceResultType::Character));
    assert_eq!(variants.pop_first(), None);

    // Generated check
    use strum::IntoEnumIterator;
    assert_eq!(InferenceResultType::all_variants().len(), InferenceResultType::iter().len());
  }
}
