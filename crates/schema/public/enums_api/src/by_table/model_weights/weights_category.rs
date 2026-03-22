use strum::EnumIter;
use utoipa::ToSchema;

#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, ToSchema, EnumIter, Debug)]

pub enum WeightsCategory {
    #[serde(rename = "image_generation")]
    ImageGeneration,
    #[serde(rename = "text_to_speech")]
    TextToSpeech,
    #[serde(rename = "vocoder")]
    Vocoder,
    #[serde(rename = "voice_conversion")]
    VoiceConversion,
    #[serde(rename = "workflow_config")]
    WorkflowConfig,
}

#[cfg(test)]
mod tests {
  use super::WeightsCategory;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(WeightsCategory::ImageGeneration, "image_generation");
      assert_serialization(WeightsCategory::TextToSpeech, "text_to_speech");
      assert_serialization(WeightsCategory::Vocoder, "vocoder");
      assert_serialization(WeightsCategory::VoiceConversion, "voice_conversion");
      assert_serialization(WeightsCategory::WorkflowConfig, "workflow_config");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("image_generation", WeightsCategory::ImageGeneration);
      assert_deserialization("text_to_speech", WeightsCategory::TextToSpeech);
      assert_deserialization("vocoder", WeightsCategory::Vocoder);
      assert_deserialization("voice_conversion", WeightsCategory::VoiceConversion);
      assert_deserialization("workflow_config", WeightsCategory::WorkflowConfig);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(WeightsCategory::iter().count(), 5);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in WeightsCategory::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: WeightsCategory = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
