use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, ToSchema)]
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
impl_enum_display_and_debug_using_to_str!(WeightsCategory);
impl_mysql_enum_coders!(WeightsCategory);
impl_mysql_from_row!(WeightsCategory);

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
    fn test_to_str() {
        assert_eq!(WeightsCategory::ImageGeneration.to_str(), "image_generation");
        assert_eq!(WeightsCategory::TextToSpeech.to_str(), "text_to_speech");
        assert_eq!(WeightsCategory::Vocoder.to_str(), "vocoder");
        assert_eq!(WeightsCategory::VoiceConversion.to_str(), "voice_conversion");
        assert_eq!(WeightsCategory::WorkflowConfig.to_str(), "workflow_config");
    }

    #[test]
    fn test_from_str() {
        assert_eq!(WeightsCategory::from_str("image_generation").unwrap(), WeightsCategory::ImageGeneration);
        assert_eq!(WeightsCategory::from_str("text_to_speech").unwrap(), WeightsCategory::TextToSpeech);
        assert_eq!(WeightsCategory::from_str("vocoder").unwrap(), WeightsCategory::Vocoder);
        assert_eq!(WeightsCategory::from_str("voice_conversion").unwrap(), WeightsCategory::VoiceConversion);
        assert_eq!(WeightsCategory::from_str("workflow_config").unwrap(), WeightsCategory::WorkflowConfig);
        assert!(WeightsCategory::from_str("invalid").is_err());
    }

    #[test]
    fn test_all_variants() {
        let variants = WeightsCategory::all_variants();
        assert_eq!(variants.len(), 5);
        assert!(variants.contains(&WeightsCategory::ImageGeneration));
        assert!(variants.contains(&WeightsCategory::TextToSpeech));
        assert!(variants.contains(&WeightsCategory::Vocoder));
        assert!(variants.contains(&WeightsCategory::VoiceConversion));
        assert!(variants.contains(&WeightsCategory::WorkflowConfig));
    }
}