use crate::error::sora_error::SoraError;
use crate::error::sora_generic_api_error::SoraGenericApiError;
use crate::error::sora_specific_api_error::SoraSpecificApiError;
use cloudflare_errors::filter_cloudflare_errors::filter_cloudflare_errors;
use wreq::StatusCode;
/*

Old cookie - 

Message: {
  "error": {
    "message": "Your authentication token has expired. Please try signing in again.",
    "type": "invalid_request_error",
    "param": null,
    "code": "token_expired"
  }
}

No cookie - 

Message: {
  "error": {
    "message": "Your authentication token has expired. Please try signing in again.",
    "type": "invalid_request_error",
    "param": null,
    "code": "token_expired"
  }
}

*/

/// Classify the type of error that occurred.
/// This first assumes the request failed and returned a non-200.
pub fn classify_general_http_status_code_and_body(status: StatusCode, response_body: &str) -> SoraError {
  let message = response_body.to_string();

  // TODO: I *think* this is just the bearer token, not the cookie.
  let cookie_expired =
      message.contains("Your authentication token has expired. Please try signing in again.")
          || message.contains("token_expired");

  if cookie_expired {
    return SoraSpecificApiError::UnauthorizedCookieOrBearerExpired.into();
  }
  
  let needs_onboarding = 
      message.contains("You must onboard before using this service") 
          || message.contains("onboarding_required");

  if needs_onboarding {
    return SoraSpecificApiError::SoraUsernameNotYetCreated.into();
  }

  let status_code = status.as_u16();

  if let Err(err) = filter_cloudflare_errors(status_code, &response_body) {
    return SoraGenericApiError::CloudflareError(err).into();
  }

  match status_code {
    502 => {
      return SoraGenericApiError::Http502ErrorBadGateway(message.to_string()).into();
    }
    _ => {}, // Fall-through
  }

  SoraGenericApiError::UncategorizedBadResponseWithStatusAndBody {
    status_code: status,
    body: response_body.to_string(),
  }.into()
}
