use crate::core::commands::response::shorthand::ResponseOrErrorMessage;
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
use crate::core::providers::credentials::provider_credential_key::ProviderCredentialKey;
use crate::core::providers::credentials::provider_credential_loading_cache::ProviderCredentialLoadingCache;
use log::{error, info};
use serde_derive::{Deserialize, Serialize};
use tauri::State;

#[derive(Deserialize)]
pub struct ProviderClearRequest {
  pub provider_credential: ProviderCredentialKey,
}

#[derive(Serialize)]
pub struct ProviderClearResponse {}

impl SerializeMarker for ProviderClearResponse {}

#[tauri::command]
pub async fn provider_clear_command(
  request: ProviderClearRequest,
  credential_cache: State<'_, ProviderCredentialLoadingCache>,
) -> ResponseOrErrorMessage<ProviderClearResponse> {
  info!("provider_clear_command called for key: {:?}", request.provider_credential);

  credential_cache.delete_credentials(request.provider_credential)
    .map_err(|err| {
      error!("Failed to clear provider credential: {:?}", err);
      "Failed to clear provider credential"
    })?;

  Ok(ProviderClearResponse {}.into())
}
