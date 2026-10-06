use crate::error::ark_api_error::{classify_error_kind, ArkApiError};
use reqwest::StatusCode;

/// Turns a non-2xx ModelArk response into an `ArkApiError`. ModelArk error bodies look like
/// `{"error": {"code": "...", "message": "...", "param": "...", "type": "..."}}`.
pub(crate) fn classify_ark_http_error(status_code: StatusCode, body: &str) -> Result<(), ArkApiError> {
  if status_code.is_success() {
    return Ok(());
  }

  let (maybe_code, maybe_message) = parse_error_envelope(body);
  let status = status_code.as_u16();

  Err(ArkApiError {
    kind: classify_error_kind(Some(status), maybe_code.as_deref()),
    maybe_status_code: Some(status),
    maybe_code,
    maybe_message,
  })
}

fn parse_error_envelope(body: &str) -> (Option<String>, Option<String>) {
  let Ok(parsed) = serde_json::from_str::<serde_json::Value>(body) else {
    return (None, None);
  };
  let error = parsed.get("error");
  let field = |name: &str| {
    error
        .and_then(|e| e.get(name))
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
  };
  (field("code"), field("message"))
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::error::ark_api_error::ArkApiErrorKind;

  #[test]
  fn success_is_ok() {
    assert!(classify_ark_http_error(StatusCode::OK, "{}").is_ok());
  }

  mod by_code {
    use super::*;

    #[test]
    fn model_not_open_is_not_activated() {
      let body = r#"{"error":{"code":"ModelNotOpen","message":"not activated"}}"#;
      assert_eq!(kind(StatusCode::NOT_FOUND, body), ArkApiErrorKind::ModelNotActivated);
    }

    #[test]
    fn unknown_model_and_endpoint_only_accounts() {
      let not_found = r#"{"error":{"code":"InvalidEndpointOrModel.NotFound"}}"#;
      let endpoint = r#"{"error":{"code":"InvalidEndpointOrModel.ModelIDAccessDisabled"}}"#;
      assert_eq!(kind(StatusCode::NOT_FOUND, not_found), ArkApiErrorKind::ModelNotFound);
      assert_eq!(kind(StatusCode::FORBIDDEN, endpoint), ArkApiErrorKind::EndpointRequired);
    }

    #[test]
    fn sensitive_content_is_moderation_even_on_400() {
      let body = r#"{"error":{"code":"InputTextSensitiveContentDetected","message":"blocked"}}"#;
      assert_eq!(kind(StatusCode::BAD_REQUEST, body), ArkApiErrorKind::ContentModeration);
    }

    #[test]
    fn quota_and_overload_codes_are_rate_limited() {
      for code in ["RateLimitExceeded.EndpointRPMExceeded", "QuotaExceeded", "ServerOverloaded"] {
        let body = format!(r#"{{"error":{{"code":"{}"}}}}"#, code);
        assert_eq!(kind(StatusCode::TOO_MANY_REQUESTS, &body), ArkApiErrorKind::RateLimited, "{}", code);
      }
    }

    #[test]
    fn overdue_account() {
      let body = r#"{"error":{"code":"AccountOverdueError"}}"#;
      assert_eq!(kind(StatusCode::FORBIDDEN, body), ArkApiErrorKind::AccountOverdue);
    }
  }

  mod by_status {
    use super::*;

    #[test]
    fn unauthorized_without_body_is_invalid_key() {
      assert_eq!(kind(StatusCode::UNAUTHORIZED, ""), ArkApiErrorKind::InvalidApiKey);
    }

    #[test]
    fn bad_request_keeps_code_and_message() {
      let body = r#"{"error":{"code":"InvalidParameter","message":"size is too small"}}"#;
      let err = classify_ark_http_error(StatusCode::BAD_REQUEST, body).unwrap_err();
      assert_eq!(err.kind, ArkApiErrorKind::BadRequest);
      assert_eq!(err.maybe_code.as_deref(), Some("InvalidParameter"));
      assert_eq!(err.maybe_message.as_deref(), Some("size is too small"));
      assert_eq!(err.maybe_status_code, Some(400));
    }

    #[test]
    fn server_errors_and_unparseable_bodies() {
      let err = classify_ark_http_error(StatusCode::BAD_GATEWAY, "<html>oops</html>").unwrap_err();
      assert_eq!(err.kind, ArkApiErrorKind::ServerError);
      assert_eq!(err.maybe_code, None);
      assert_eq!(err.maybe_message, None);
    }
  }

  fn kind(status: StatusCode, body: &str) -> ArkApiErrorKind {
    classify_ark_http_error(status, body).unwrap_err().kind
  }
}
