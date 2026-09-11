use crate::error::api_error::ApiError;
use crate::utils::status_codes::*;
use anyhow::anyhow;
use cloudflare_errors::filter_cloudflare_errors::filter_cloudflare_errors;
use log::error;

/// Pass request errors to this method for standard error handling behavior.
/// This function needs to take temporary ownership, but will return it to the caller.
///
/// Example use:
///   let response = client.get().await?;
///   let response = filter_bad_response(response).await?;
///   ... 200 or other valid response
pub async fn filter_bad_response(response: reqwest::Response) -> Result<reqwest::Response, ApiError> {
  let status = response.status();

  if status.is_success() {
    return Ok(response);
  }

  // The host in the fleet that handled the request.
  let backend_hostname= response.headers()
      .get("x-backend-hostname")
      .map(|header| header.to_str().unwrap_or_else(|err| {
        error!("Failed to parse x-backend-hostname header: {:?}", err);
        "unknown"
      }))
      .map(|s| s.to_string());

  let response_body = match response.text().await {
    Ok(text) => text.to_string(),
    Err(err) => format!("Could not read response body: {:?}", err),
  };
  
  let status_code = status.as_u16();

  filter_cloudflare_errors(status_code, &response_body)?;

  match status_code {
    STATUS_400_BAD_REQUEST => Err(ApiError::InvalidRequest(response_body)),
    STATUS_401_UNAUTHORIZED => Err(ApiError::Unauthorized(response_body)),
    STATUS_402_PAYMENT_REQUIRED => Err(ApiError::PaymentRequired(response_body)),
    STATUS_403_FORBIDDEN => Err(ApiError::Forbidden(response_body)),
    STATUS_404_NOT_FOUND => Err(ApiError::NotFound(response_body)),
    STATUS_429_TOO_MANY_REQUESTS => Err(ApiError::TooManyRequests(response_body)),
    STATUS_500_INTERNAL_SERVER_ERROR => Err(ApiError::InternalServerError { body: response_body, backend_hostname }),
    _ => Err(ApiError::Other(anyhow!("Bad status code: {}; message: {:?}", status, response_body))),
  }
}
