use serde_derive::{Deserialize, Serialize};
use crate::core::providers::credentials::provider_credential_type::ProviderCredentialType;

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ProviderCredentialKey {

  // ========== API KEYS==========

  /// BytePlus ModelArk: Seedream, Seedance, Seed 2.0 and the 3D models.
  #[serde(rename = "byteplus_api_key")]
  BytePlusApiKey,
  FalApiKey,
  /// BytePlus AI MediaKit (video upscaling). A separate key from the MediaKit console.
  #[serde(rename = "mediakit_api_key")]
  MediaKitApiKey,
  ReplicateApiKey,
  /// BytePlus Seed Audio. A separate key from the BytePlus Voice console.
  #[serde(rename = "seed_audio_api_key")]
  SeedAudioApiKey,

  // ========== WEB LOGINS ==========

  GrokWebLogin,
  HiggsfieldWebLogin,
  MidjourneyLogin,
  RunwayWebLogin,
}


impl ProviderCredentialKey {
  pub fn get_type(&self) -> ProviderCredentialType {
    match self {
      // Api keys
      Self::BytePlusApiKey => ProviderCredentialType::ApiKey,
      Self::FalApiKey => ProviderCredentialType::ApiKey,
      Self::MediaKitApiKey => ProviderCredentialType::ApiKey,
      Self::ReplicateApiKey => ProviderCredentialType::ApiKey,
      Self::SeedAudioApiKey => ProviderCredentialType::ApiKey,
      // Web logins
      Self::GrokWebLogin => ProviderCredentialType::WebLogin,
      Self::HiggsfieldWebLogin => ProviderCredentialType::WebLogin,
      Self::MidjourneyLogin => ProviderCredentialType::WebLogin,
      Self::RunwayWebLogin => ProviderCredentialType::WebLogin,
    }
  }

  pub fn get_filename(&self) -> &'static str {
    match self {
      // Api keys
      ProviderCredentialKey::BytePlusApiKey => "byteplus.api_key.txt",
      ProviderCredentialKey::FalApiKey => "fal.api_key.txt",
      ProviderCredentialKey::MediaKitApiKey => "mediakit.api_key.txt",
      ProviderCredentialKey::ReplicateApiKey => "replicate.api_key.txt",
      ProviderCredentialKey::SeedAudioApiKey => "seed_audio.api_key.txt",
      // Web logins
      ProviderCredentialKey::GrokWebLogin => "grok.web_login.toml",
      ProviderCredentialKey::HiggsfieldWebLogin => "higgsfield.web_login.toml",
      ProviderCredentialKey::MidjourneyLogin => "midjourney.web_login.toml",
      ProviderCredentialKey::RunwayWebLogin => "runway.web_login.toml",
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn byteplus_keys_serialize_to_the_frontend_names() {
    assert_eq!(serde_json::to_string(&ProviderCredentialKey::BytePlusApiKey).unwrap(), "\"byteplus_api_key\"");
    assert_eq!(serde_json::to_string(&ProviderCredentialKey::MediaKitApiKey).unwrap(), "\"mediakit_api_key\"");
    assert_eq!(serde_json::to_string(&ProviderCredentialKey::SeedAudioApiKey).unwrap(), "\"seed_audio_api_key\"");
  }
}
