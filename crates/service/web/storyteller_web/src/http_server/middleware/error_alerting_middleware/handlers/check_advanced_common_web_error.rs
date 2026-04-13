use log::{debug, warn};
use regex::Regex;
use std::sync::LazyLock;

use pager::client::pager::Pager;
use pager::notification::notification_details_builder::NotificationDetailsBuilder;
use pager::notification::notification_urgency::NotificationUrgency;

use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;
use crate::http_server::middleware::error_alerting_middleware::request_debugging_metadata::RequestDebuggingMetadata;

/// Check `AdvancedCommonWebError` and alert on uncaught server errors.
/// Returns `true` if the error was handled (alerted or intentionally skipped).
pub(crate) fn check_advanced_common_web_error(
  pager: &Pager,
  method: &str,
  path: &str,
  metadata: &RequestDebuggingMetadata,
  error: &AdvancedCommonWebError,
) -> bool {
  if !error.is_server_error() {
    // Non-500 errors (400, 401, 404, 402) are intentional — don't alert.
    return true;
  }

  let maybe_error_name = error.cause()
      .and_then(|cause| try_error_title(cause));

  let title = match maybe_error_name {
    Some(name) => format!("{} on {} {}", name, method, path),
    None => format!("UncaughtServerError on {} {}", method, path),
  };

  // Clone the Arc'd causal error so the notification owns a reference to it.
  let cause_arc = error.clone_cause_arc();

  let mut builder = if let Some(arc_err) = cause_arc {
    NotificationDetailsBuilder::from_error(arc_err)
        .set_title(title)
  } else {
    NotificationDetailsBuilder::from_title(title)
  };

  builder = builder
      .set_urgency(Some(NotificationUrgency::Medium))
      .set_http_method(Some(method.to_string()))
      .set_http_path(Some(path.to_string()))
      .set_http_status_code(Some(500))
      .set_request_ip_address(metadata.request_ip_address.clone())
      .set_avt_cookie_token(metadata.avt_cookie_token.clone())
      .set_session_token(metadata.session_token.clone())
      .set_session_user_token(metadata.session_user_token.clone());

  let notification = builder.build();

  if let Err(err) = pager.enqueue_page(notification) {
    warn!("Error alerting middleware: failed to enqueue page: {:?}", err);
  } else {
    debug!("Error alerting middleware: enqueued alert for AdvancedCommonWebError::UncaughtServerError");
  }

  true
}

/// Try to extract a human-readable error title from the causal error's Debug
/// representation. Looks for CamelCase type names like `EnvError::NotUnicode`.
fn try_error_title(error: &dyn std::error::Error) -> Option<String> {
  let debug_str = format!("{:?}", error);
  try_extract_error_name(&debug_str)
}

/// Regex that matches CamelCase type names with an optional `::Variant` suffix.
/// E.g. `CommonWebError::InvalidRequest`, `EnvError`, `KinoviError::RequestError`.
static ERROR_NAME_RE: LazyLock<Regex> = LazyLock::new(|| {
  Regex::new(r"[A-Z][0-9a-z]+(?:[A-Z][0-9a-z]+)*(?:::[A-Z][0-9a-z]+(?:[A-Z][0-9a-z]+)*)?")
      .expect("error name regex should compile")
});

/// Extract the leading CamelCase error name (with optional `::Variant`) from
/// a Debug-formatted error string. Returns `None` if no match is found.
///
/// ```text
/// "CommonWebError::InvalidRequest(\"bad\")" → Some("CommonWebError::InvalidRequest")
/// "EnvError::ParseError { reason: \"foo\" }" → Some("EnvError::ParseError")
/// "just a plain string"                      → None
/// ```
fn try_extract_error_name(debug_str: &str) -> Option<String> {
  ERROR_NAME_RE.find(debug_str)
      .map(|m| m.as_str().to_string())
}

#[cfg(test)]
mod tests {
  use super::*;

  // --- try_extract_error_name tests ---

  #[test]
  fn extract_just_error_name() {
    assert_eq!(
      try_extract_error_name("JustErrorName"),
      Some("JustErrorName".to_string()),
    );
  }

  #[test]
  fn extract_error_with_variant_and_string_payload() {
    assert_eq!(
      try_extract_error_name(r#"CommonWebError::InvalidRequest("Invalid request")"#),
      Some("CommonWebError::InvalidRequest".to_string()),
    );
  }

  #[test]
  fn extract_error_with_unit_variant() {
    assert_eq!(
      try_extract_error_name("EnvError::NotUnicode"),
      Some("EnvError::NotUnicode".to_string()),
    );
  }

  #[test]
  fn extract_error_with_struct_payload() {
    assert_eq!(
      try_extract_error_name(r#"EnvError::ParseError { reason: "foo" }"#),
      Some("EnvError::ParseError".to_string()),
    );
  }

  #[test]
  fn extract_error_with_tuple_payload() {
    assert_eq!(
      try_extract_error_name("KinoviError::RequestError(asdf)"),
      Some("KinoviError::RequestError".to_string()),
    );
  }

  #[test]
  fn extract_error_with_nested_errors() {
    // Should only grab the outermost error name.
    assert_eq!(
      try_extract_error_name(
        "ComplexError::SomeError(SomeError::SomeVariant(SomeInnerError::SomeInnerVariant))"
      ),
      Some("ComplexError::SomeError".to_string()),
    );
  }

  #[test]
  fn extract_error_with_struct_containing_nested() {
    assert_eq!(
      try_extract_error_name(
        "WrappedError::Variant { inner: SomeInnerError::SomeInnerVariant }"
      ),
      Some("WrappedError::Variant".to_string()),
    );
  }

  #[test]
  fn no_match_for_lowercase_string() {
    assert_eq!(
      try_extract_error_name("just a plain error message with no type name"),
      None,
    );
  }

  #[test]
  fn no_match_for_empty_string() {
    assert_eq!(try_extract_error_name(""), None);
  }

  #[test]
  fn single_word_camel_case() {
    // A single CamelCase word like "Error" should not match because
    // the regex requires at least two segments (e.g. "Ab" = A + b).
    // "Error" = E + rror — "rror" has 4 lowercase chars which is fine.
    assert_eq!(
      try_extract_error_name("Error"),
      Some("Error".to_string()),
    );
  }

  // --- try_error_title tests (with real error types) ---

  #[test]
  fn title_from_io_error() {
    let err: Box<dyn std::error::Error> = Box::new(
      std::io::Error::new(std::io::ErrorKind::NotFound, "file not found"),
    );
    // io::Error Debug looks like: `Custom { kind: NotFound, error: "file not found" }`
    // "Custom" doesn't match CamelCase with 2+ segments... but we get what we get.
    let title = try_error_title(err.as_ref());
    // The exact output depends on Debug formatting. Just verify it doesn't panic.
    // Custom has one uppercase + lowercase sequence = "Custom" which matches [A-Z][0-9a-z]+
    assert!(title.is_some());
  }

  #[test]
  fn title_from_serde_json_error() {
    let err: serde_json::Error = serde_json::from_str::<String>("not json").unwrap_err();
    let title = try_error_title(&err);
    // serde_json::Error Debug typically starts with "Error(...)"
    assert!(title.is_some());
  }

  /// A simple custom error for testing.
  #[derive(Debug)]
  enum TestAppError {
    DatabaseTimeout,
    InvalidInput(String),
  }

  impl std::fmt::Display for TestAppError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
      write!(f, "{:?}", self)
    }
  }

  impl std::error::Error for TestAppError {}

  #[test]
  fn title_from_custom_unit_variant() {
    let err = TestAppError::DatabaseTimeout;
    let title = try_error_title(&err);
    assert_eq!(title, Some("DatabaseTimeout".to_string()));
  }

  #[test]
  fn title_from_custom_tuple_variant() {
    let err = TestAppError::InvalidInput("bad data".to_string());
    let title = try_error_title(&err);
    assert_eq!(title, Some("InvalidInput".to_string()));
  }
}
