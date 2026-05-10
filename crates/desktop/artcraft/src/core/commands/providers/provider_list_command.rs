use crate::core::commands::response::shorthand::ResponseOrErrorMessage;
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
use crate::core::providers::credentials::payload::provider_credential_payload::ProviderCredentialPayload;
use crate::core::providers::credentials::provider_credential_key::ProviderCredentialKey;
use crate::core::providers::credentials::provider_credential_loading_cache::ProviderCredentialLoadingCache;
use crate::core::providers::credentials::provider_credential_type::ProviderCredentialType;
use log::{info, warn};
use serde_derive::Serialize;
use tauri::State;

/// All known credential keys. Add new ones here as providers are added.
const ALL_KEYS: &[ProviderCredentialKey] = &[
  ProviderCredentialKey::FalApiKey,
  ProviderCredentialKey::ReplicateApiKey,
  ProviderCredentialKey::GrokWebLogin,
  ProviderCredentialKey::HiggsfieldWebLogin,
  ProviderCredentialKey::MidjourneyLogin,
  ProviderCredentialKey::RunwayWebLogin,
];

const REDACTED_KEY_VISIBLE_CHARS: usize = 6;

#[derive(Serialize)]
pub struct ProviderListResponse {
  pub providers: Vec<ProviderListEntry>,
}

impl SerializeMarker for ProviderListResponse {}

#[derive(Serialize)]
pub struct ProviderListEntry {
  pub provider_credential: ProviderCredentialKey,
  pub credential_type: ProviderCredentialType,
  pub has_credentials: bool,
  pub maybe_details: Option<ProviderCredentialDetails>,
}

#[derive(Serialize)]
pub struct ProviderCredentialDetails {
  /// For API keys: the first few characters followed by asterisks.
  pub maybe_key_start: Option<String>,
  /// For API keys: the full key value.
  pub maybe_full_key: Option<String>,
  /// For web logins: the email address if available.
  pub maybe_email_address: Option<String>,
  /// For web logins: the username if available.
  pub maybe_username: Option<String>,
}

#[tauri::command]
pub async fn provider_list_command(
  credential_cache: State<'_, ProviderCredentialLoadingCache>,
) -> ResponseOrErrorMessage<ProviderListResponse> {
  info!("provider_list_command called");

  let mut providers = Vec::with_capacity(ALL_KEYS.len());

  for &key in ALL_KEYS {
    let maybe_payload = match credential_cache.get_credentials(key) {
      Ok(payload) => payload,
      Err(err) => {
        warn!("Error checking credential for {:?}: {:?}", key, err);
        None
      }
    };

    let has_credentials = maybe_payload.is_some();

    let maybe_details = maybe_payload.map(|payload| match payload {
      ProviderCredentialPayload::ApiKey(data) => {
        ProviderCredentialDetails {
          maybe_key_start: Some(redact_key(data.as_str())),
          maybe_full_key: Some(data.as_str().to_string()),
          maybe_email_address: None,
          maybe_username: None,
        }
      }
      ProviderCredentialPayload::WebLogin(data) => {
        ProviderCredentialDetails {
          maybe_key_start: None,
          maybe_full_key: None,
          maybe_email_address: data.email_address,
          maybe_username: data.username,
        }
      }
    });

    providers.push(ProviderListEntry {
      provider_credential: key,
      credential_type: key.get_type(),
      has_credentials,
      maybe_details,
    });
  }

  Ok(ProviderListResponse { providers }.into())
}

fn redact_key(key: &str) -> String {
  if key.len() <= REDACTED_KEY_VISIBLE_CHARS {
    "********".to_string()
  } else {
    let visible = &key[..REDACTED_KEY_VISIBLE_CHARS];
    format!("{}********", visible)
  }
}
