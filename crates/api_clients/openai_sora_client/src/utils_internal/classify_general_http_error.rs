use crate::error::sora_error::SoraError;
use crate::error::sora_generic_api_error::SoraGenericApiError;
use crate::utils_internal::classify_general_http_status_code_and_body::classify_general_http_status_code_and_body;

/// This assumes the request failed and returned a non-200.
/// The caller should check.
pub async fn classify_general_http_error(response: wreq::Response) -> SoraError {
  let status = response.status();
  let message = match response.text().await {
    Ok(text) => text,
    Err(err) => return SoraGenericApiError::WreqError(err).into(),
  };
  
  classify_general_http_status_code_and_body(status, &message)
}
