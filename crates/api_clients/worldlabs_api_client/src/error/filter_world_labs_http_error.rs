use crate::error::world_labs_error::WorldLabsError;
use crate::error::world_labs_generic_api_error::WorldLabsGenericApiError;
use crate::error::world_labs_specific_api_error::WorldLabsSpecificApiError;
use wreq::StatusCode;

/// Detect error HTTP responses and coerce the response as a Rust Error.
pub fn filter_world_labs_http_error(status_code: StatusCode, maybe_body: Option<&str>) -> Result<(), WorldLabsError> {
  if status_code.is_success() {
    return Ok(());
  }

  match status_code {
    StatusCode::PAYMENT_REQUIRED => {
      return Err(WorldLabsSpecificApiError::InsufficientCredits.into());
    },
    _ => {},
  }

  // Check for NSFW content policy rejection (403 with nsfw/sexuality keywords).
  if let Some(nsfw_error) = check_nsfw_content_rejection(status_code, maybe_body) {
    return Err(nsfw_error.into());
  }

  if let Some(body) = maybe_body {
    return Err(WorldLabsGenericApiError::UncategorizedBadResponseWithStatusAndBody {
      status_code,
      body: body.to_string(),
    }.into());
  }

  Err(WorldLabsGenericApiError::UncategorizedBadResponseWithStatusAndBody {
    status_code,
    body: String::new(),
  }.into())
}

/// Check if a 403 response is an NSFW content policy rejection.
/// Returns `Some(WorldLabsSpecificApiError)` if it matches, `None` otherwise.
fn check_nsfw_content_rejection(
  status_code: StatusCode,
  maybe_body: Option<&str>,
) -> Option<WorldLabsSpecificApiError> {
  if status_code != StatusCode::FORBIDDEN {
    return None;
  }

  let body = maybe_body?;
  let body_lower = body.to_lowercase();

  if body_lower.contains("nsfw") || body_lower.contains("sexuality") {
    Some(WorldLabsSpecificApiError::NsfwContentPolicyRejected {
      message: Some(body.to_string()),
    })
  } else {
    None
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn success_200_returns_ok() {
    let result = filter_world_labs_http_error(StatusCode::OK, None);
    assert!(result.is_ok());
  }

  #[test]
  fn success_200_with_body_returns_ok() {
    let result = filter_world_labs_http_error(StatusCode::OK, Some("{}"));
    assert!(result.is_ok());
  }

  // --- NSFW 403 ---

  #[test]
  fn nsfw_403_real_response() {
    let body = r#"{"detail":"NSFW Content is not permitted by policy.  Sexuality"}"#;
    let result = filter_world_labs_http_error(StatusCode::FORBIDDEN, Some(body));
    let err = result.unwrap_err();

    assert!(err.is_403_forbidden());
    assert!(matches!(err, WorldLabsError::ApiSpecific(
      WorldLabsSpecificApiError::NsfwContentPolicyRejected { .. }
    )));
  }

  #[test]
  fn nsfw_403_preserves_message() {
    let body = r#"{"detail":"NSFW Content is not permitted by policy.  Sexuality"}"#;
    let result = filter_world_labs_http_error(StatusCode::FORBIDDEN, Some(body));
    let err = result.unwrap_err();

    if let WorldLabsError::ApiSpecific(WorldLabsSpecificApiError::NsfwContentPolicyRejected { message }) = err {
      assert_eq!(message.as_deref(), Some(body));
    } else {
      panic!("expected NsfwContentPolicyRejected, got: {:?}", err);
    }
  }

  #[test]
  fn nsfw_403_case_insensitive_nsfw() {
    let body = r#"{"detail":"nsfw content detected"}"#;
    let result = filter_world_labs_http_error(StatusCode::FORBIDDEN, Some(body));
    assert!(matches!(result.unwrap_err(), WorldLabsError::ApiSpecific(
      WorldLabsSpecificApiError::NsfwContentPolicyRejected { .. }
    )));
  }

  #[test]
  fn nsfw_403_case_insensitive_sexuality() {
    let body = r#"{"detail":"Rejected due to Sexuality content"}"#;
    let result = filter_world_labs_http_error(StatusCode::FORBIDDEN, Some(body));
    assert!(matches!(result.unwrap_err(), WorldLabsError::ApiSpecific(
      WorldLabsSpecificApiError::NsfwContentPolicyRejected { .. }
    )));
  }

  // --- Non-NSFW 403 ---

  #[test]
  fn non_nsfw_403_is_generic_error() {
    let body = r#"{"detail":"Forbidden: invalid API key"}"#;
    let result = filter_world_labs_http_error(StatusCode::FORBIDDEN, Some(body));
    let err = result.unwrap_err();

    assert!(err.is_403_forbidden());
    assert!(matches!(err, WorldLabsError::ApiGeneric(
      WorldLabsGenericApiError::UncategorizedBadResponseWithStatusAndBody { .. }
    )));
  }

  #[test]
  fn non_nsfw_403_no_body_is_generic_error() {
    let result = filter_world_labs_http_error(StatusCode::FORBIDDEN, None);
    let err = result.unwrap_err();
    assert!(err.is_403_forbidden());
    assert!(matches!(err, WorldLabsError::ApiGeneric(
      WorldLabsGenericApiError::UncategorizedBadResponseWithStatusAndBody { .. }
    )));
  }

  // --- 402 Payment Required ---

  #[test]
  fn payment_required_402() {
    let result = filter_world_labs_http_error(StatusCode::PAYMENT_REQUIRED, Some("{}"));
    let err = result.unwrap_err();
    assert!(matches!(err, WorldLabsError::ApiSpecific(
      WorldLabsSpecificApiError::InsufficientCredits
    )));
    assert!(!err.is_403_forbidden());
  }

  // --- Other errors ---

  #[test]
  fn server_error_500_is_generic() {
    let body = r#"{"detail":"Internal server error"}"#;
    let result = filter_world_labs_http_error(StatusCode::INTERNAL_SERVER_ERROR, Some(body));
    let err = result.unwrap_err();
    assert!(!err.is_403_forbidden());
    assert!(matches!(err, WorldLabsError::ApiGeneric(
      WorldLabsGenericApiError::UncategorizedBadResponseWithStatusAndBody { .. }
    )));
  }

  #[test]
  fn bad_request_400_is_generic() {
    let body = r#"{"detail":"Bad request"}"#;
    let result = filter_world_labs_http_error(StatusCode::BAD_REQUEST, Some(body));
    assert!(matches!(result.unwrap_err(), WorldLabsError::ApiGeneric(
      WorldLabsGenericApiError::UncategorizedBadResponseWithStatusAndBody { .. }
    )));
  }

  #[test]
  fn nsfw_keyword_in_non_403_is_not_nsfw_error() {
    // Even if the body mentions "nsfw", a 400 should NOT be classified as NSFW rejection.
    let body = r#"{"detail":"nsfw check failed"}"#;
    let result = filter_world_labs_http_error(StatusCode::BAD_REQUEST, Some(body));
    assert!(matches!(result.unwrap_err(), WorldLabsError::ApiGeneric(
      WorldLabsGenericApiError::UncategorizedBadResponseWithStatusAndBody { .. }
    )));
  }

  #[test]
  fn error_500_no_body() {
    let result = filter_world_labs_http_error(StatusCode::INTERNAL_SERVER_ERROR, None);
    assert!(matches!(result.unwrap_err(), WorldLabsError::ApiGeneric(
      WorldLabsGenericApiError::UncategorizedBadResponseWithStatusAndBody { body, .. }
    ) if body.is_empty()));
  }
}
