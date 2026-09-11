//! Self-contained, forward-compatible binding for `GET /v1/omni_gen/models/video`.
//!
//! IMPORTANT: This module deliberately does NOT reuse any types from
//! `artcraft_api_defs`. Client builds may be deployed in the wild long after the
//! server's models, enums, and response shapes have changed, so every request /
//! response type is copied here and made permissive:
//!   - Unknown JSON fields are ignored (serde default behavior).
//!   - Missing collection/flag fields default rather than fail (`serde(default)`).
//!   - Every string-valued enum has an `Unknown(String)` catch-all so new server
//!     variants deserialize instead of erroring.

use serde_derive::{Deserialize, Serialize};

use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::basic_json_get_request::basic_json_get_request;
use crate::datatypes::common_enums::generation::api_client_aspect_ratio::ApiClientAspectRatio;
use crate::datatypes::common_enums::generation::api_client_bitrate::ApiClientBitrate;
use crate::datatypes::common_enums::generation::api_client_generation_provider::ApiClientGenerationProvider;
use crate::datatypes::common_enums::generation::api_client_model_creator::ApiClientModelCreator;
use crate::datatypes::common_enums::generation::api_client_quality::ApiClientQuality;
use crate::datatypes::common_enums::generation::api_client_resolution::ApiClientResolution;
use crate::datatypes::common_enums::generation::api_client_video_model::ApiClientVideoModel;

pub const OMNI_GEN_VIDEO_MODELS_PATH: &str = "/v1/omni_gen/models/video";

/// Arguments for [`omni_gen_list_video_models`].
pub struct OmniGenListVideoModelsArgs<'a> {
  pub api_host: &'a ApiHost,
  pub maybe_creds: Option<&'a StorytellerCredentialSet>,
  /// Which provider's models to list. `None` lets the server default (artcraft).
  pub provider: Option<OmniGenVideoModelsProvider>,
}

/// List available video models.
pub async fn omni_gen_list_video_models(
  args: OmniGenListVideoModelsArgs<'_>,
) -> Result<OmniGenVideoModelsResponse, StorytellerError> {
  let path = match args.provider {
    Some(provider) => format!("{}?provider={}", OMNI_GEN_VIDEO_MODELS_PATH, provider.as_query_value()),
    None => OMNI_GEN_VIDEO_MODELS_PATH.to_string(),
  };

  Ok(basic_json_get_request(args.api_host, &path, args.maybe_creds).await?)
}

/// The provider filter for the models endpoint (a client-supplied request value).
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum OmniGenVideoModelsProvider {
  /// Only models available through ArtCraft.
  Artcraft,
  /// All known models across all providers.
  All,
}

impl OmniGenVideoModelsProvider {
  pub fn as_query_value(self) -> &'static str {
    match self {
      Self::Artcraft => "artcraft",
      Self::All => "all",
    }
  }
}

impl Default for OmniGenVideoModelsProvider {
  fn default() -> Self {
    Self::Artcraft
  }
}

// ============================ Response types ============================

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct OmniGenVideoModelsResponse {
  #[serde(default)]
  pub success: bool,
  #[serde(default)]
  pub models: Vec<OmniGenVideoModelDetails>,
  #[serde(default)]
  pub providers: Vec<OmniGenVideoModelProviderDetails>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct OmniGenVideoModelProviderDetails {
  pub provider: ApiClientGenerationProvider,
  #[serde(default)]
  pub models: Vec<OmniGenVideoProviderModelDetails>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct OmniGenVideoProviderModelDetails {
  pub model: ApiClientVideoModel,
  #[serde(default)]
  pub overrides: Option<OmniGenVideoModelDetails>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct OmniGenVideoModelDetails {
  pub model: ApiClientVideoModel,
  #[serde(default)]
  pub model_creator: Option<ApiClientModelCreator>,
  #[serde(default)]
  pub full_name: Option<String>,
  #[serde(default)]
  pub extra_info: Option<String>,
  #[serde(default)]
  pub extra_info_short: Option<String>,
  #[serde(default)]
  pub text_to_video_supported: Option<bool>,
  #[serde(default)]
  pub text_prompt_supported: Option<bool>,
  #[serde(default)]
  pub text_prompt_max_length: Option<u16>,
  #[serde(default)]
  pub negative_text_prompt_supported: Option<bool>,
  #[serde(default)]
  pub negative_text_prompt_max_length: Option<u16>,
  #[serde(default)]
  pub starting_keyframe_supported: Option<bool>,
  #[serde(default)]
  pub starting_keyframe_required: Option<bool>,
  #[serde(default)]
  pub ending_keyframe_supported: Option<bool>,
  #[serde(default)]
  pub image_references_supported: Option<bool>,
  #[serde(default)]
  pub image_references_max: Option<u16>,
  #[serde(default)]
  pub video_references_supported: Option<bool>,
  #[serde(default)]
  pub video_references_max: Option<u16>,
  #[serde(default)]
  pub video_references_max_total_duration_seconds: Option<u16>,
  #[serde(default)]
  pub audio_references_supported: Option<bool>,
  #[serde(default)]
  pub audio_references_max: Option<u16>,
  #[serde(default)]
  pub audio_references_max_total_duration_seconds: Option<u16>,
  #[serde(default)]
  pub character_references_supported: Option<bool>,
  #[serde(default)]
  pub character_references_max: Option<u16>,
  #[serde(default)]
  pub show_generate_with_sound_toggle: Option<bool>,
  #[serde(default)]
  pub aspect_ratio_options: Option<Vec<ApiClientAspectRatio>>,
  #[serde(default)]
  pub aspect_ratio_default: Option<ApiClientAspectRatio>,
  #[serde(default)]
  pub resolution_options: Option<Vec<ApiClientResolution>>,
  #[serde(default)]
  pub resolution_default: Option<ApiClientResolution>,
  #[serde(default)]
  pub bitrate_options: Option<Vec<ApiClientBitrate>>,
  #[serde(default)]
  pub bitrate_default: Option<ApiClientBitrate>,
  #[serde(default)]
  pub quality_options: Option<Vec<ApiClientQuality>>,
  #[serde(default)]
  pub default_quality: Option<ApiClientQuality>,
  #[serde(default)]
  pub duration_seconds_min: Option<u16>,
  #[serde(default)]
  pub duration_seconds_max: Option<u16>,
  #[serde(default)]
  pub duration_seconds_max_with_image_references: Option<u16>,
  #[serde(default)]
  pub duration_seconds_options: Option<Vec<u16>>,
  #[serde(default)]
  pub duration_seconds_default: Option<u16>,
  #[serde(default)]
  pub batch_size_min: Option<u16>,
  #[serde(default)]
  pub batch_size_max: Option<u16>,
  #[serde(default)]
  pub batch_size_options: Option<Vec<u16>>,
  #[serde(default)]
  pub batch_size_default: Option<u16>,
  #[serde(default)]
  pub is_disabled: Option<bool>,
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn unknown_enum_value_is_preserved_and_round_trips() {
    let known: ApiClientVideoModel = serde_json::from_str("\"seedance_2p0\"").unwrap();
    assert_eq!(known, ApiClientVideoModel::Seedance2p0);
    assert_eq!(serde_json::to_string(&known).unwrap(), "\"seedance_2p0\"");

    // A value this build has never heard of does NOT fail — it is captured verbatim.
    let unknown: ApiClientVideoModel = serde_json::from_str("\"future_model_9000\"").unwrap();
    assert_eq!(unknown, ApiClientVideoModel::Unknown("future_model_9000".to_string()));
    // ...and serializes back to exactly what came in.
    assert_eq!(serde_json::to_string(&unknown).unwrap(), "\"future_model_9000\"");
  }

  #[test]
  fn response_tolerates_unknown_fields_and_variants() {
    let json = r#"{
      "success": true,
      "models": [
        {
          "model": "brand_new_model",
          "model_creator": "some_new_studio",
          "aspect_ratio_options": ["wide_sixteen_by_nine", "some_new_ratio"],
          "surprise_new_field": 123
        }
      ],
      "providers": [
        { "provider": "new_provider", "models": [ { "model": "seedance_2p0" } ] }
      ],
      "another_unexpected_top_level_field": "ignored"
    }"#;

    let resp: OmniGenVideoModelsResponse = serde_json::from_str(json).unwrap();
    assert!(resp.success);
    assert_eq!(resp.models.len(), 1);
    assert_eq!(resp.models[0].model, ApiClientVideoModel::Unknown("brand_new_model".to_string()));
    assert_eq!(resp.models[0].model_creator, Some(ApiClientModelCreator::Unknown("some_new_studio".to_string())));
    let ratios = resp.models[0].aspect_ratio_options.as_ref().unwrap();
    assert_eq!(ratios[0], ApiClientAspectRatio::WideSixteenByNine);
    assert_eq!(ratios[1], ApiClientAspectRatio::Unknown("some_new_ratio".to_string()));
    assert_eq!(resp.models[0].is_disabled, None); // missing optional -> None
    assert_eq!(resp.providers[0].provider, ApiClientGenerationProvider::Unknown("new_provider".to_string()));
    assert_eq!(resp.providers[0].models[0].model, ApiClientVideoModel::Seedance2p0);
  }

  #[test]
  fn empty_object_uses_defaults() {
    let resp: OmniGenVideoModelsResponse = serde_json::from_str("{}").unwrap();
    assert!(!resp.success);
    assert!(resp.models.is_empty());
    assert!(resp.providers.is_empty());
  }
}

/// Live tests that hit real servers. All `#[ignore]` so they never run by default.
/// Run explicitly, e.g.:
///   cargo test -p artcraft_client omni_gen_list_video_models::live_tests -- --ignored --nocapture
#[cfg(test)]
mod live_tests {
  mod localhost {
    use super::super::{omni_gen_list_video_models, OmniGenListVideoModelsArgs};
    use crate::utils::api_host::ApiHost;

    #[tokio::test]
    #[ignore] // live: hits http://localhost:12345
    async fn list_video_models() {
      let api_host = ApiHost::Localhost { port: 12345 };
      let response = omni_gen_list_video_models(OmniGenListVideoModelsArgs {
        api_host: &api_host,
        maybe_creds: None,
        provider: None,
      })
      .await
      .expect("request should succeed");

      println!("[localhost] video models response: {:#?}", response);
      assert!(response.success);
      assert!(!response.models.is_empty(), "expected at least one video model");
    }
  }

  mod production {
    use super::super::{omni_gen_list_video_models, OmniGenListVideoModelsArgs};
    use crate::utils::api_host::ApiHost;

    #[tokio::test]
    #[ignore] // live: hits https://api.storyteller.ai
    async fn list_video_models() {
      let api_host = ApiHost::Storyteller;
      let response = omni_gen_list_video_models(OmniGenListVideoModelsArgs {
        api_host: &api_host,
        maybe_creds: None,
        provider: None,
      })
      .await
      .expect("request should succeed");

      println!("[production] video models response: {:#?}", response);
      assert!(response.success);
      assert!(!response.models.is_empty(), "expected at least one video model");
    }
  }
}
