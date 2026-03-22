use enums_db::by_table::voice_conversion_models::voice_conversion_model_type::VoiceConversionModelType;
use tokens::tokens::voice_conversion_models::VoiceConversionModelToken;

/// This is meant to be used for quick in-memory caches,
/// particularly the one that serves the voice conversion enqueue API.
#[derive(Serialize, Clone, Debug)]
pub struct VoiceConversionModelInfoLite {
  pub token: VoiceConversionModelToken,
  pub model_type: VoiceConversionModelType,
}
