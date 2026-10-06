use crate::core::commands::response::shorthand::ResponseOrErrorMessage;
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
use byteplus_ark_client::creds::ark_api_key::ArkApiKey;
use byteplus_ark_client::error::ark_api_error::ArkApiErrorKind;
use byteplus_ark_client::error::ark_error::ArkError;
use byteplus_ark_client::requests::validate_api_key::validate_api_key;
use log::{info, warn};
use serde_derive::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct ProviderValidateBytePlusApiKeyRequest {
  pub api_key: String,
}

#[derive(Serialize)]
pub struct ProviderValidateBytePlusApiKeyResponse {
  pub outcome: ApiKeyValidationOutcome,
  pub maybe_message: Option<String>,
}

impl SerializeMarker for ProviderValidateBytePlusApiKeyResponse {}

#[derive(Serialize)]
#[serde(rename_all = "snake_case")]
pub enum ApiKeyValidationOutcome {
  /// ModelArk accepted the key.
  Valid,
  /// ModelArk rejected the key; don't save it.
  Invalid,
  /// Couldn't tell (offline, BytePlus outage); the key can still be saved.
  Unverified,
}

/// Checks a BytePlus key with a free, read-only ModelArk call before the user saves it.
#[tauri::command]
pub async fn provider_validate_byteplus_api_key_command(
  request: ProviderValidateBytePlusApiKeyRequest,
) -> ResponseOrErrorMessage<ProviderValidateBytePlusApiKeyResponse> {
  // NB: Never log the key itself.
  info!("provider_validate_byteplus_api_key_command called");

  let api_key = ArkApiKey::new(&request.api_key);
  if api_key.is_empty() {
    return Ok(ProviderValidateBytePlusApiKeyResponse {
      outcome: ApiKeyValidationOutcome::Invalid,
      maybe_message: Some("Enter an API key.".to_string()),
    }.into());
  }

  let (outcome, maybe_message) = match validate_api_key(&api_key).await {
    Ok(()) => (ApiKeyValidationOutcome::Valid, None),
    Err(ArkError::Api(err)) if err.kind == ArkApiErrorKind::InvalidApiKey => {
      warn!("BytePlus rejected the API key: {:?}", err.maybe_code);
      (ApiKeyValidationOutcome::Invalid, Some(err.user_message()))
    }
    Err(err) => {
      warn!("Could not verify BytePlus API key: {:?}", err);
      (ApiKeyValidationOutcome::Unverified, Some(err.user_message()))
    }
  };

  Ok(ProviderValidateBytePlusApiKeyResponse { outcome, maybe_message }.into())
}
