use reqwest::StatusCode;

use crate::error::grok_error::GrokError;
use crate::error::grok_generic_api_error::GrokGenericApiError;
use crate::error::grok_specific_api_error::GrokSpecificApiError;

/// Convert a non-2xx HTTP response into a `GrokError`.
///
/// On 2xx returns `Ok(())`; on any error status returns the most-specific
/// `GrokError` variant we can classify from the status code and (optional)
/// response body.
pub fn classify_grok_http_error(status_code: StatusCode, maybe_body: Option<&str>) -> Result<(), GrokError> {
  if status_code.is_success() {
    return Ok(());
  }

  match status_code {
    StatusCode::UNAUTHORIZED   => return Err(GrokSpecificApiError::Unauthorized.into()),
    StatusCode::PAYMENT_REQUIRED => return Err(GrokSpecificApiError::InsufficientCredits.into()),
    StatusCode::NOT_FOUND      => return Err(GrokSpecificApiError::NotFound.into()),
    StatusCode::TOO_MANY_REQUESTS => return Err(GrokSpecificApiError::RateLimited.into()),
    _ => {}
  }

  // 403 is Forbidden unless the body indicates content moderation.
  if status_code == StatusCode::FORBIDDEN {
    if let Some(body) = maybe_body {
      if body_indicates_moderation(body) {
        let message = extract_xai_error_message(body).unwrap_or_else(|| body.to_string());
        return Err(GrokSpecificApiError::PromptModerated(message).into());
      }
    }
    return Err(GrokSpecificApiError::Forbidden.into());
  }

  // 400 Bad Request is usually a malformed body or moderation rejection.
  if status_code == StatusCode::BAD_REQUEST {
    if let Some(body) = maybe_body {
      if body_indicates_moderation(body) {
        let message = extract_xai_error_message(body).unwrap_or_else(|| body.to_string());
        return Err(GrokSpecificApiError::PromptModerated(message).into());
      }
      let message = extract_xai_error_message(body).unwrap_or_else(|| body.to_string());
      return Err(GrokSpecificApiError::BadRequest(message).into());
    }
    return Err(GrokSpecificApiError::BadRequest(String::new()).into());
  }

  // Everything else falls through to the generic catch-all.
  Err(GrokGenericApiError::UncategorizedBadResponseWithStatusAndBody {
    status_code,
    body: maybe_body.unwrap_or("").to_string(),
  }.into())
}

/// xAI returns OpenAI-compatible error envelopes:
///
/// ```json
/// { "error": { "code": "...", "message": "..." } }
/// ```
///
/// Extract `error.message` if present.
fn extract_xai_error_message(body: &str) -> Option<String> {
  let parsed: serde_json::Value = serde_json::from_str(body).ok()?;
  parsed.get("error")?.get("message")?.as_str().map(|s| s.to_string())
}

/// Heuristic: does this response body mention content moderation? xAI's
/// safety filter rejections include words like "moderation", "safety",
/// "content_policy", or "blocked".
pub(crate) fn body_indicates_moderation(body: &str) -> bool {
  let lower = body.to_lowercase();
  lower.contains("moderat")          // moderation / moderated
    || lower.contains("safety")
    || lower.contains("content_policy")
    || lower.contains("content policy")
    || lower.contains("blocked by")
    || lower.contains("disallowed")
}

#[cfg(test)]
mod tests {
  use super::*;

  // ── Success ──

  #[test]
  fn ok_200_returns_ok() {
    assert!(classify_grok_http_error(StatusCode::OK, None).is_ok());
  }

  #[test]
  fn created_201_returns_ok() {
    assert!(classify_grok_http_error(StatusCode::CREATED, Some("{}")).is_ok());
  }

  // ── Direct status mappings ──

  #[test]
  fn unauthorized_401() {
    let err = classify_grok_http_error(StatusCode::UNAUTHORIZED, None).unwrap_err();
    assert!(matches!(err, GrokError::ApiSpecific(GrokSpecificApiError::Unauthorized)));
  }

  #[test]
  fn payment_required_402() {
    let err = classify_grok_http_error(StatusCode::PAYMENT_REQUIRED, None).unwrap_err();
    assert!(matches!(err, GrokError::ApiSpecific(GrokSpecificApiError::InsufficientCredits)));
  }

  #[test]
  fn not_found_404() {
    let err = classify_grok_http_error(StatusCode::NOT_FOUND, None).unwrap_err();
    assert!(matches!(err, GrokError::ApiSpecific(GrokSpecificApiError::NotFound)));
  }

  #[test]
  fn rate_limited_429() {
    let err = classify_grok_http_error(StatusCode::TOO_MANY_REQUESTS, None).unwrap_err();
    assert!(matches!(err, GrokError::ApiSpecific(GrokSpecificApiError::RateLimited)));
  }

  // ── 403 Forbidden ──

  #[test]
  fn plain_403_is_forbidden() {
    let err = classify_grok_http_error(StatusCode::FORBIDDEN, Some(r#"{"error":{"message":"Forbidden"}}"#)).unwrap_err();
    assert!(matches!(err, GrokError::ApiSpecific(GrokSpecificApiError::Forbidden)));
  }

  #[test]
  fn moderation_403_is_prompt_moderated() {
    let body = r#"{"error":{"message":"Content moderation blocked this prompt","code":"content_policy"}}"#;
    let err = classify_grok_http_error(StatusCode::FORBIDDEN, Some(body)).unwrap_err();
    assert!(matches!(err, GrokError::ApiSpecific(GrokSpecificApiError::PromptModerated(_))));
  }

  // ── 400 Bad Request ──

  #[test]
  fn bad_request_400_extracts_message() {
    let body = r#"{"error":{"code":"invalid_argument","message":"unknown field 'foo'"}}"#;
    let err = classify_grok_http_error(StatusCode::BAD_REQUEST, Some(body)).unwrap_err();
    match err {
      GrokError::ApiSpecific(GrokSpecificApiError::BadRequest(msg)) => {
        assert_eq!(msg, "unknown field 'foo'");
      }
      other => panic!("expected BadRequest, got: {:?}", other),
    }
  }

  #[test]
  fn bad_request_400_unparseable_body_falls_back_to_raw() {
    let body = "definitely not json";
    let err = classify_grok_http_error(StatusCode::BAD_REQUEST, Some(body)).unwrap_err();
    match err {
      GrokError::ApiSpecific(GrokSpecificApiError::BadRequest(msg)) => {
        assert_eq!(msg, "definitely not json");
      }
      other => panic!("expected BadRequest, got: {:?}", other),
    }
  }

  #[test]
  fn bad_request_400_no_body_is_empty_string() {
    let err = classify_grok_http_error(StatusCode::BAD_REQUEST, None).unwrap_err();
    match err {
      GrokError::ApiSpecific(GrokSpecificApiError::BadRequest(msg)) => {
        assert!(msg.is_empty());
      }
      other => panic!("expected BadRequest, got: {:?}", other),
    }
  }

  #[test]
  fn moderation_400_is_prompt_moderated() {
    // Some APIs return moderation as 400 rather than 403.
    let body = r#"{"error":{"message":"Safety filter blocked this request"}}"#;
    let err = classify_grok_http_error(StatusCode::BAD_REQUEST, Some(body)).unwrap_err();
    assert!(matches!(err, GrokError::ApiSpecific(GrokSpecificApiError::PromptModerated(_))));
  }

  // ── Generic fallback ──

  #[test]
  fn server_error_500_is_generic() {
    let err = classify_grok_http_error(StatusCode::INTERNAL_SERVER_ERROR, Some("oops")).unwrap_err();
    assert!(matches!(err, GrokError::ApiGeneric(GrokGenericApiError::UncategorizedBadResponseWithStatusAndBody { .. })));
  }

  #[test]
  fn bad_gateway_502_is_generic() {
    let err = classify_grok_http_error(StatusCode::BAD_GATEWAY, None).unwrap_err();
    assert!(matches!(err, GrokError::ApiGeneric(GrokGenericApiError::UncategorizedBadResponseWithStatusAndBody { .. })));
  }
}
