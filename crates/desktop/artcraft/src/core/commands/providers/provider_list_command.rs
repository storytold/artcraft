use crate::core::commands::response::shorthand::ResponseOrErrorMessage;
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
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

#[derive(Serialize)]
pub struct ProviderListResponse {
  pub providers: Vec<ProviderListEntry>,
}

impl SerializeMarker for ProviderListResponse {}

#[derive(Serialize)]
pub struct ProviderListEntry {
  pub key: ProviderCredentialKey,
  pub credential_type: ProviderCredentialType,
  pub has_credentials: bool,
}

#[tauri::command]
pub async fn provider_list_command(
  credential_cache: State<'_, ProviderCredentialLoadingCache>,
) -> ResponseOrErrorMessage<ProviderListResponse> {
  info!("provider_list_command called");

  let mut providers = Vec::with_capacity(ALL_KEYS.len());

  for &key in ALL_KEYS {
    let has_credentials = match credential_cache.get_credentials(key) {
      Ok(Some(_)) => true,
      Ok(None) => false,
      Err(err) => {
        warn!("Error checking credential for {:?}: {:?}", key, err);
        false
      }
    };

    providers.push(ProviderListEntry {
      key,
      credential_type: key.get_type(),
      has_credentials,
    });
  }

  Ok(ProviderListResponse { providers }.into())
}
