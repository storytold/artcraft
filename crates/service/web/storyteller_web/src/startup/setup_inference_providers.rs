use beeble_client::creds::beeble_api_key::BeebleApiKey;
use errors::AnyhowResult;
use fal_client::creds::fal_api_key::FalApiKey;

/// All third-party inference provider credentials and configuration grouped together.
pub struct InferenceProviders {
  pub fal: FalData,
  pub gmicloud: GmiCloudData,
  pub grok_api: GrokApiData,
  pub beeble: BeebleData,
  pub seedance2pro: Seedance2ProData,
  pub openai: OpenAiData,
  pub worldlabs: WorldLabsData,
}

/// Fal integration
#[derive(Clone)]
pub struct FalData {
  pub api_key: FalApiKey,
  pub webhook_url: String,
}

/// GmiCloud integration
#[derive(Clone)]
pub struct GmiCloudData {
  pub api_key: gmicloud_client::creds::gmicloud_api_key::GmiCloudApiKey,
}

/// Grok (xAI) API integration
#[derive(Clone)]
pub struct GrokApiData {
  pub api_key: grok_api_client::creds::grok_api_key::GrokApiKey,
}

/// Beeble SwitchX integration
#[derive(Clone)]
pub struct BeebleData {
  pub api_key: BeebleApiKey,
  pub webhook_url: String,
}

/// Seedance 2 Pro integration
#[derive(Clone)]
pub struct Seedance2ProData {
  pub cookies_volcengine: String,

  pub cookies_byteplus: String,

  pub cookies_byteplus_ultra: String,
}

/// OpenAI integration
#[derive(Clone)]
pub struct OpenAiData {
  pub api_key: String,
}

/// World Labs integration
#[derive(Clone)]
pub struct WorldLabsData {
  pub api_key: String,
}

pub fn setup_inference_providers() -> AnyhowResult<InferenceProviders> {
  Ok(InferenceProviders {
    fal: FalData {
      api_key: FalApiKey::new(easyenv::get_env_string_required("FAL_API_KEY")?),
      webhook_url: easyenv::get_env_string_required("FAL_WEBHOOK_URL")?,
    },
    gmicloud: GmiCloudData {
      api_key: gmicloud_client::creds::gmicloud_api_key::GmiCloudApiKey::new(
        easyenv::get_env_string_required("GMICLOUD_API_KEY")?,
      ),
    },
    grok_api: GrokApiData {
      api_key: grok_api_client::creds::grok_api_key::GrokApiKey::new(
        easyenv::get_env_string_required("GROK_API_KEY")?,
      ),
    },
    beeble: BeebleData {
      api_key: BeebleApiKey::new(easyenv::get_env_string_required("BEEBLE_API_KEY")?),
      webhook_url: easyenv::get_env_string_required("BEEBLE_WEBHOOK_URL")?,
    },
    seedance2pro: Seedance2ProData {
      cookies_volcengine: easyenv::get_env_string_required("SEEDANCE2PRO_COOKIES")?,
      cookies_byteplus: easyenv::get_env_string_required("SEEDANCE2PRO_WHITELIST_COOKIES")?,
      cookies_byteplus_ultra: easyenv::get_env_string_required("SEEDANCE2PRO_BYTEPLUS_ULTRA_COOKIES")?,
    },
    openai: OpenAiData {
      api_key: easyenv::get_env_string_required("OPENAI_API_KEY")?,
    },
    worldlabs: WorldLabsData {
      api_key: easyenv::get_env_string_required("WORLDLABS_API_KEY")?,
    },
  })
}
