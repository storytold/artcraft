use crate::core::providers::credentials::payload::provider_credential_payload::ProviderCredentialPayload;
use crate::core::providers::credentials::provider_credential_key::ProviderCredentialKey;
use crate::core::providers::credentials::provider_credential_loading_cache::{ProviderCredentialLoadingCache, ProviderCredentialLoadingCacheError};
use byteplus_ark_client::creds::ark_api_key::ArkApiKey;
use byteplus_ark_client::error::ark_api_error::{ArkApiError, ArkApiErrorKind};
use byteplus_ark_client::error::ark_error::ArkError;
use enums::tauri::tasks::task_failure_type::TaskFailureType;

/// The saved BytePlus ModelArk API key, or `None` when the user hasn't added one.
pub fn read_byteplus_api_key(
  cache: &ProviderCredentialLoadingCache,
) -> Result<Option<ArkApiKey>, ProviderCredentialLoadingCacheError> {
  Ok(match cache.get_credentials(ProviderCredentialKey::BytePlusApiKey)? {
    Some(ProviderCredentialPayload::ApiKey(data)) if !data.as_str().is_empty() => {
      Some(ArkApiKey::new(data.as_str()))
    }
    _ => None,
  })
}

/// How the task queue should categorize a failed ModelArk call.
pub fn failure_type_for(err: &ArkError) -> TaskFailureType {
  match err {
    ArkError::Api(api_err) => failure_type_for_api_error(api_err),
    _ => TaskFailureType::GenerationFailed,
  }
}

fn failure_type_for_api_error(err: &ArkApiError) -> TaskFailureType {
  if err.kind != ArkApiErrorKind::ContentModeration {
    return TaskFailureType::GenerationFailed;
  }
  match err.maybe_code.as_deref() {
    Some(code) if code.starts_with("InputText") => TaskFailureType::RuleBansUserTextPrompt,
    Some(code) if code.starts_with("InputImage") => TaskFailureType::RuleBansUserImage,
    _ => TaskFailureType::RuleBansGeneratedContent,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn moderation_codes_map_to_task_failure_types() {
    assert_eq!(failure_type_for(&moderation("InputTextSensitiveContentDetected")), TaskFailureType::RuleBansUserTextPrompt);
    assert_eq!(failure_type_for(&moderation("InputImageSensitiveContentDetected")), TaskFailureType::RuleBansUserImage);
    assert_eq!(failure_type_for(&moderation("OutputImageSensitiveContentDetected")), TaskFailureType::RuleBansGeneratedContent);
  }

  #[test]
  fn other_errors_are_generation_failures() {
    let rate_limited = ArkError::Api(ArkApiError {
      kind: ArkApiErrorKind::RateLimited,
      maybe_status_code: Some(429),
      maybe_code: Some("RateLimitExceeded".to_string()),
      maybe_message: None,
    });
    assert_eq!(failure_type_for(&rate_limited), TaskFailureType::GenerationFailed);
  }

  fn moderation(code: &str) -> ArkError {
    ArkError::Api(ArkApiError {
      kind: ArkApiErrorKind::ContentModeration,
      maybe_status_code: Some(400),
      maybe_code: Some(code.to_string()),
      maybe_message: None,
    })
  }
}
