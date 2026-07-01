//! Self-contained, forward-compatible binding for `GET /v1/omni_gen/models/image`.
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
use crate::datatypes::common_enums::generation::api_client_aspect_ratio::ApiClientAspectRatio;
use crate::datatypes::common_enums::generation::api_client_generation_provider::ApiClientGenerationProvider;
use crate::datatypes::common_enums::generation::api_client_image_model::ApiClientImageModel;
use crate::datatypes::common_enums::generation::api_client_model_creator::ApiClientModelCreator;
use crate::datatypes::common_enums::generation::api_client_quality::ApiClientQuality;
use crate::datatypes::common_enums::generation::api_client_resolution::ApiClientResolution;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::basic_json_get_request::basic_json_get_request;

pub const OMNI_GEN_IMAGE_MODELS_PATH: &str = "/v1/omni_gen/models/image";

/// Arguments for [`omni_gen_list_image_models`].
pub struct OmniGenListImageModelsArgs<'a> {
  pub api_host: &'a ApiHost,
  pub maybe_creds: Option<&'a StorytellerCredentialSet>,
  /// Which provider's models to list. `None` lets the server default (artcraft).
  pub provider: Option<OmniGenImageModelsProvider>,
}

/// List available image models.
pub async fn omni_gen_list_image_models(
  args: OmniGenListImageModelsArgs<'_>,
) -> Result<OmniGenImageModelsResponse, StorytellerError> {
  let path = match args.provider {
    Some(provider) => format!("{}?provider={}", OMNI_GEN_IMAGE_MODELS_PATH, provider.as_query_value()),
    None => OMNI_GEN_IMAGE_MODELS_PATH.to_string(),
  };

  Ok(basic_json_get_request(args.api_host, &path, args.maybe_creds).await?)
}

/// The provider filter for the models endpoint (a client-supplied request value).
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum OmniGenImageModelsProvider {
  /// Only models available through ArtCraft.
  Artcraft,
  /// All known models across all providers.
  All,
}

impl OmniGenImageModelsProvider {
  pub fn as_query_value(self) -> &'static str {
    match self {
      Self::Artcraft => "artcraft",
      Self::All => "all",
    }
  }
}

impl Default for OmniGenImageModelsProvider {
  fn default() -> Self {
    Self::Artcraft
  }
}

// ============================ Response types ============================

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct OmniGenImageModelsResponse {
  #[serde(default)]
  pub success: bool,
  #[serde(default)]
  pub models: Vec<OmniGenImageModelDetails>,
  #[serde(default)]
  pub providers: Vec<OmniGenImageModelProviderDetails>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct OmniGenImageModelProviderDetails {
  pub provider: ApiClientGenerationProvider,
  #[serde(default)]
  pub models: Vec<OmniGenImageProviderModelDetails>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct OmniGenImageProviderModelDetails {
  pub model: ApiClientImageModel,
  #[serde(default)]
  pub overrides: Option<OmniGenImageModelDetails>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct OmniGenImageModelDetails {
  pub model: ApiClientImageModel,
  #[serde(default)]
  pub model_creator: Option<ApiClientModelCreator>,
  #[serde(default)]
  pub full_name: Option<String>,
  #[serde(default)]
  pub text_prompt_supported: Option<bool>,
  #[serde(default)]
  pub text_prompt_max_length: Option<u16>,
  #[serde(default)]
  pub negative_text_prompt_supported: Option<bool>,
  #[serde(default)]
  pub negative_text_prompt_max_length: Option<u16>,
  #[serde(default)]
  pub image_refs_supported: Option<bool>,
  #[serde(default)]
  pub image_refs_max: Option<u16>,
  #[serde(default)]
  pub has_fixed_editing_aspect_ratio: Option<bool>,
  #[serde(default)]
  pub aspect_ratio_options: Option<Vec<ApiClientAspectRatio>>,
  #[serde(default)]
  pub aspect_ratio_default: Option<ApiClientAspectRatio>,
  #[serde(default)]
  pub aspect_ratio_default_when_editing: Option<ApiClientAspectRatio>,
  #[serde(default)]
  pub resolution_options: Option<Vec<ApiClientResolution>>,
  #[serde(default)]
  pub resolution_default: Option<ApiClientResolution>,
  #[serde(default)]
  pub quality_options: Option<Vec<ApiClientQuality>>,
  #[serde(default)]
  pub default_quality: Option<ApiClientQuality>,
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
  fn response_tolerates_unknown_fields_and_variants() {
    let json = r#"{
      "success": true,
      "models": [
        {
          "model": "brand_new_image_model",
          "model_creator": "some_new_studio",
          "aspect_ratio_options": ["square", "some_new_ratio"],
          "surprise_new_field": 123
        }
      ],
      "providers": [
        { "provider": "new_provider", "models": [ { "model": "nano_banana_pro" } ] }
      ],
      "another_unexpected_top_level_field": "ignored"
    }"#;

    let resp: OmniGenImageModelsResponse = serde_json::from_str(json).unwrap();
    assert!(resp.success);
    assert_eq!(resp.models.len(), 1);
    assert_eq!(resp.models[0].model, ApiClientImageModel::Unknown("brand_new_image_model".to_string()));
    assert_eq!(resp.models[0].model_creator, Some(ApiClientModelCreator::Unknown("some_new_studio".to_string())));
    let ratios = resp.models[0].aspect_ratio_options.as_ref().unwrap();
    assert_eq!(ratios[0], ApiClientAspectRatio::Square);
    assert_eq!(ratios[1], ApiClientAspectRatio::Unknown("some_new_ratio".to_string()));
    assert_eq!(resp.models[0].is_disabled, None);
    assert_eq!(resp.providers[0].provider, ApiClientGenerationProvider::Unknown("new_provider".to_string()));
    assert_eq!(resp.providers[0].models[0].model, ApiClientImageModel::NanoBananaPro);
  }

  #[test]
  fn empty_object_uses_defaults() {
    let resp: OmniGenImageModelsResponse = serde_json::from_str("{}").unwrap();
    assert!(!resp.success);
    assert!(resp.models.is_empty());
    assert!(resp.providers.is_empty());
  }
}

/// Live tests that hit real servers. All `#[ignore]` so they never run by default.
/// Run explicitly, e.g.:
///   cargo test -p artcraft_client omni_gen_list_image_models::live_tests -- --ignored --nocapture
#[cfg(test)]
mod live_tests {
  mod localhost {
    use super::super::{omni_gen_list_image_models, OmniGenListImageModelsArgs};
    use crate::utils::api_host::ApiHost;

    #[tokio::test]
    #[ignore] // live: hits http://localhost:12345
    async fn list_image_models() {
      let api_host = ApiHost::Localhost { port: 12345 };
      let response = omni_gen_list_image_models(OmniGenListImageModelsArgs {
        api_host: &api_host,
        maybe_creds: None,
        provider: None,
      })
      .await
      .expect("request should succeed");

      println!("[localhost] image models response: {:#?}", response);
      assert!(response.success);
      assert!(!response.models.is_empty(), "expected at least one image model");
    }
  }

  mod production {
    use super::super::{omni_gen_list_image_models, OmniGenListImageModelsArgs};
    use crate::utils::api_host::ApiHost;

    #[tokio::test]
    #[ignore] // live: hits https://api.storyteller.ai
    async fn list_image_models() {
      let api_host = ApiHost::Storyteller;
      let response = omni_gen_list_image_models(OmniGenListImageModelsArgs {
        api_host: &api_host,
        maybe_creds: None,
        provider: None,
      })
      .await
      .expect("request should succeed");

      println!("[production] image models response: {:#?}", response);
      assert!(response.success);
      assert!(!response.models.is_empty(), "expected at least one image model");
    }
  }
}
