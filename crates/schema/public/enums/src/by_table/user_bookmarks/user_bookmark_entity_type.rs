use serde::Deserialize;
use serde::Serialize;
#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `user_bookmarks` table in a `VARCHAR(32)` field named `entity_type`.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Hash, Deserialize, Serialize, ToSchema)]
pub enum UserBookmarkEntityType {
    /// User
    #[serde(rename = "user")]
    User,

    /// TTS model (architecture does not matter)
    #[serde(rename = "tts_model")]
    TtsModel,

    /// TTS result (architecture does not matter)
    #[serde(rename = "tts_result")]
    TtsResult,

    /// W2L template
    #[serde(rename = "w2l_template")]
    W2lTemplate,

    /// W2L result
    #[serde(rename = "w2l_result")]
    W2lResult,

    /// MediaFile
    #[serde(rename = "media_file")]
    MediaFile,

    /// ModelWeight (the new way to store models)
    #[serde(rename = "model_weight")]
    ModelWeight,

    /// VoiceConversionModel
    #[serde(rename = "voice_conversion_model")]
    VoiceConversionModel,

    /// ZsVoice
    #[serde(rename = "zs_voice")]
    ZsVoice,
}

// TODO(bt, 2023-01-17): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(UserBookmarkEntityType);
impl_mysql_enum_coders!(UserBookmarkEntityType);
impl_mysql_from_row!(UserBookmarkEntityType);

/// NB: Legacy API for older code.
impl UserBookmarkEntityType {
    pub fn to_str(&self) -> &'static str {
        match self {
            Self::User => "user",
            Self::TtsModel => "tts_model",
            Self::TtsResult => "tts_result",
            Self::W2lTemplate => "w2l_template",
            Self::W2lResult => "w2l_result",
            Self::MediaFile => "media_file",
            Self::ModelWeight => "model_weight",
            Self::VoiceConversionModel => "voice_conversion_model",
            Self::ZsVoice => "zs_voice",
        }
    }

    pub fn from_str(value: &str) -> Result<Self, String> {
        match value {
            "user" => Ok(Self::User),
            "tts_model" => Ok(Self::TtsModel),
            "tts_result" => Ok(Self::TtsResult),
            "w2l_template" => Ok(Self::W2lTemplate),
            "w2l_result" => Ok(Self::W2lResult),
            "media_file" => Ok(Self::MediaFile),
            "model_weight" => Ok(Self::ModelWeight),
            "voice_conversion_model" => Ok(Self::VoiceConversionModel),
            "zs_voice" => Ok(Self::ZsVoice),
            _ => Err(format!("invalid value: {:?}", value)),
        }
    }
}

#[cfg(test)]
mod tests {
  use crate::by_table::user_bookmarks::user_bookmark_entity_type::UserBookmarkEntityType;
  use crate::test_helpers::assert_serialization;

  mod serde {
    use super::*;

    #[test]
        fn test_serialization() {
            assert_serialization(UserBookmarkEntityType::User, "user");
            assert_serialization(UserBookmarkEntityType::TtsModel, "tts_model");
            assert_serialization(UserBookmarkEntityType::TtsResult, "tts_result");
            assert_serialization(UserBookmarkEntityType::W2lTemplate, "w2l_template");
            assert_serialization(UserBookmarkEntityType::W2lResult, "w2l_result");
            assert_serialization(UserBookmarkEntityType::MediaFile, "media_file");
            assert_serialization(UserBookmarkEntityType::ModelWeight, "model_weight");
            assert_serialization(UserBookmarkEntityType::VoiceConversionModel, "voice_conversion_model");
            assert_serialization(UserBookmarkEntityType::ZsVoice, "zs_voice");
        }
    }

    mod impl_methods {
      use super::*;

      #[test]
        fn test_to_str() {
            assert_eq!(UserBookmarkEntityType::User.to_str(), "user");
            assert_eq!(UserBookmarkEntityType::TtsModel.to_str(), "tts_model");
            assert_eq!(UserBookmarkEntityType::TtsResult.to_str(), "tts_result");
            assert_eq!(UserBookmarkEntityType::W2lTemplate.to_str(), "w2l_template");
            assert_eq!(UserBookmarkEntityType::W2lResult.to_str(), "w2l_result");
            assert_eq!(UserBookmarkEntityType::MediaFile.to_str(), "media_file");
            assert_eq!(UserBookmarkEntityType::ModelWeight.to_str(), "model_weight");
            assert_eq!(UserBookmarkEntityType::VoiceConversionModel.to_str(), "voice_conversion_model");
            assert_eq!(UserBookmarkEntityType::ZsVoice.to_str(), "zs_voice");
        }

        #[test]
        fn test_from_str() {
            assert_eq!(UserBookmarkEntityType::from_str("user").unwrap(), UserBookmarkEntityType::User);
            assert_eq!(UserBookmarkEntityType::from_str("tts_model").unwrap(), UserBookmarkEntityType::TtsModel);
            assert_eq!(UserBookmarkEntityType::from_str("tts_result").unwrap(), UserBookmarkEntityType::TtsResult);
            assert_eq!(UserBookmarkEntityType::from_str("w2l_template").unwrap(), UserBookmarkEntityType::W2lTemplate);
            assert_eq!(UserBookmarkEntityType::from_str("w2l_result").unwrap(), UserBookmarkEntityType::W2lResult);
            assert_eq!(UserBookmarkEntityType::from_str("media_file").unwrap(), UserBookmarkEntityType::MediaFile);
            assert_eq!(UserBookmarkEntityType::from_str("model_weight").unwrap(), UserBookmarkEntityType::ModelWeight);
            assert_eq!(UserBookmarkEntityType::from_str("voice_conversion_model").unwrap(), UserBookmarkEntityType::VoiceConversionModel);
            assert_eq!(UserBookmarkEntityType::from_str("zs_voice").unwrap(), UserBookmarkEntityType::ZsVoice);
            assert!(UserBookmarkEntityType::from_str("foo").is_err());
        }
    }
}
