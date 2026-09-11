use crate::core::commands::response::shorthand::ResponseOrErrorMessage;
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
use crate::core::providers::credentials::payload::api_key::ApiKeyData;
use crate::core::providers::credentials::payload::provider_credential_payload::ProviderCredentialPayload;
use crate::core::providers::credentials::provider_credential_key::ProviderCredentialKey;
use crate::core::providers::credentials::provider_credential_loading_cache::ProviderCredentialLoadingCache;
use log::{error, info};
use serde_derive::{Deserialize, Serialize};
use tauri::State;

#[derive(Deserialize)]
pub struct ProviderSetApiKeyRequest {
  pub provider_credential: ProviderCredentialKey,
  pub api_key: String,
}

#[derive(Serialize)]
pub struct ProviderSetApiKeyResponse {}

impl SerializeMarker for ProviderSetApiKeyResponse {}

#[tauri::command]
pub async fn provider_set_api_key_command(
  request: ProviderSetApiKeyRequest,
  credential_cache: State<'_, ProviderCredentialLoadingCache>,
) -> ResponseOrErrorMessage<ProviderSetApiKeyResponse> {
  info!("provider_set_api_key_command called for provider: {:?}", request.provider_credential);

  let api_key_data = ApiKeyData::from_str(&request.api_key);
  let payload = ProviderCredentialPayload::ApiKey(api_key_data);

  credential_cache.save_credentials(request.provider_credential, payload)
    .map_err(|err| {
      error!("Failed to save API key: {:?}", err);
      "Failed to save API key"
    })?;

  Ok(ProviderSetApiKeyResponse {}.into())
}
