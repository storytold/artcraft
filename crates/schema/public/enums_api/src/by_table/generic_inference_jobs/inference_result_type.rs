use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `generic_inference_jobs` table in `VARCHAR(32)` field `on_success_result_entity_type`.
///
/// Our "generic inference" pipeline supports a wide variety of output types.
/// Each "result type" is identified by the following enum variants.
///
/// These types are present in the HTTP API and database columns as serialized here.
///
/// YOU CAN ADD NEW VALUES, BUT DO NOT CHANGE EXISTING VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, ToSchema, EnumIter, Debug)]

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

#[cfg(test)]
mod tests {
  use super::InferenceResultType;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(InferenceResultType::MediaFile, "media_file");
      assert_serialization(InferenceResultType::TextToSpeech, "text_to_speech");
      assert_serialization(InferenceResultType::VoiceConversion, "voice_conversion");
      assert_serialization(InferenceResultType::ZeroShotVoiceEmbedding, "zs_voice_embedding");
      assert_serialization(InferenceResultType::UploadModel, "upload_model");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("media_file", InferenceResultType::MediaFile);
      assert_deserialization("text_to_speech", InferenceResultType::TextToSpeech);
      assert_deserialization("voice_conversion", InferenceResultType::VoiceConversion);
      assert_deserialization("zs_voice_embedding", InferenceResultType::ZeroShotVoiceEmbedding);
      assert_deserialization("upload_model", InferenceResultType::UploadModel);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(InferenceResultType::iter().count(), 5);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in InferenceResultType::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: InferenceResultType = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
