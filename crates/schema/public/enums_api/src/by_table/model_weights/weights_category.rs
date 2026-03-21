use std::collections::BTreeSet;

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

impl WeightsCategory {
    pub fn to_str(&self) -> &'static str {
        match self {
            Self::ImageGeneration => "image_generation",
            Self::TextToSpeech => "text_to_speech",
            Self::Vocoder => "vocoder",
            Self::VoiceConversion => "voice_conversion",
            Self::WorkflowConfig => "workflow_config",
        }
    }

    pub fn from_str(value: &str) -> Result<Self, String> {
        match value {
            "image_generation" => Ok(Self::ImageGeneration),
            "text_to_speech" => Ok(Self::TextToSpeech),
            "vocoder" => Ok(Self::Vocoder),
            "voice_conversion" => Ok(Self::VoiceConversion),
            "workflow_config" => Ok(Self::WorkflowConfig),
            _ => Err(format!("invalid value: {:?}", value)),
        }
    }

    pub fn all_variants() -> BTreeSet<Self> {
        BTreeSet::from([
            Self::ImageGeneration,
            Self::TextToSpeech,
            Self::Vocoder,
            Self::VoiceConversion,
            Self::WorkflowConfig,
        ])
    }
}

#[cfg(test)]
mod tests {
  use super::WeightsCategory;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in WeightsCategory::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: WeightsCategory = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
