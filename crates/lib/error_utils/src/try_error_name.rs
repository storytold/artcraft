use regex::Regex;
use std::sync::LazyLock;

/// Regex that matches CamelCase type names with an optional `::Variant` suffix.
/// E.g. `CommonWebError::InvalidRequest`, `EnvError`, `KinoviError::RequestError`.
static ERROR_NAME_RE: LazyLock<Regex> = LazyLock::new(|| {
  Regex::new(r"[A-Z][0-9a-z]+(?:[A-Z][0-9a-z]+)*(?:::[A-Z][0-9a-z]+(?:[A-Z][0-9a-z]+)*)?")
      .expect("error name regex should compile")
});

/// Try to extract a human-readable error title from the causal error's Debug
/// representation. Looks for CamelCase type names like `EnvError::NotUnicode`.
pub fn try_error_name(error: &dyn std::error::Error) -> Option<String> {
  let debug_str = format!("{:?}", error);
  try_extract_error_name(&debug_str)
}

/// Extract the leading CamelCase error name (with optional `::Variant`) from
/// a Debug-formatted error string. Returns `None` if no match is found.
///
/// ```text
/// "CommonWebError::InvalidRequest(\"bad\")" → Some("CommonWebError::InvalidRequest")
/// "EnvError::ParseError { reason: \"foo\" }" → Some("EnvError::ParseError")
/// "just a plain string"                      → None
/// ```
pub (crate) fn try_extract_error_name(debug_str: &str) -> Option<String> {
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
    let title = try_error_name(err.as_ref());
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
    let title = try_error_name(&err);
    assert_eq!(title, Some("DatabaseTimeout".to_string()));
  }

  #[test]
  fn title_from_custom_tuple_variant() {
    let err = TestAppError::InvalidInput("bad data".to_string());
    let title = try_error_name(&err);
    assert_eq!(title, Some("InvalidInput".to_string()));
  }
}
