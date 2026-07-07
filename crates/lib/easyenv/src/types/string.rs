use std::env;

use log::warn;

use crate::error::EnvError;

/// Get an environment variable as an optional `String`.
pub fn get_env_string_optional(env_name: &str) -> Option<String> {
  match env::var(env_name).as_ref().ok() {
    Some(s) => Some(s.to_string()),
    None => {
      warn!("Env var '{}' not supplied.", env_name);
      None
    },
  }
}

/// Get an environment variable as a `String`, or fall back to the provided default.
pub fn get_env_string_or_default(env_name: &str, default: &str) -> String {
  match env::var(env_name).as_ref().ok() {
    Some(s) => s.to_string(),
    None => {
      warn!("Env var '{}' not supplied. Using default '{}'.", env_name, default);
      default.to_string()
    },
  }
}

/// Get an environment variable as a `String`, or return an error.
pub fn get_env_string_required(env_name: &str) -> Result<String, EnvError> {
  match env::var(env_name).as_ref().ok() {
    Some(s) => Ok(s.to_string()),
    None => {
      warn!("Required env var '{}' not supplied.", env_name);
      Err(EnvError::RequiredNotPresent { name: env_name.to_string() })
    },
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  use crate::tests_common::EnvVarGuard;

  #[test]
  fn returns_empty_string_when_set_to_empty() {
    let _g = EnvVarGuard::set("STRING_TEST_EMPTY", "");
    assert_eq!(get_env_string_optional("STRING_TEST_EMPTY"), Some("".to_string()));
    assert_eq!(get_env_string_required("STRING_TEST_EMPTY").unwrap(), "");
    assert_eq!(get_env_string_or_default("STRING_TEST_EMPTY", "default"), "");
  }

  #[test]
  fn preserves_unicode() {
    let _g = EnvVarGuard::set("STRING_TEST_UNICODE", "café🎨");
    assert_eq!(get_env_string_optional("STRING_TEST_UNICODE"), Some("café🎨".to_string()));
    assert_eq!(get_env_string_required("STRING_TEST_UNICODE").unwrap(), "café🎨");
    assert_eq!(get_env_string_or_default("STRING_TEST_UNICODE", "default"), "café🎨");
  }

  #[test]
  fn preserves_whitespace() {
    let _g = EnvVarGuard::set("STRING_TEST_WHITESPACE", "  hello  \t");
    assert_eq!(get_env_string_optional("STRING_TEST_WHITESPACE"), Some("  hello  \t".to_string()));
    assert_eq!(get_env_string_required("STRING_TEST_WHITESPACE").unwrap(), "  hello  \t");
    assert_eq!(get_env_string_or_default("STRING_TEST_WHITESPACE", "default"), "  hello  \t");
  }

  #[test]
  fn missing_returns_none_required_error_and_default() {
    let _g = EnvVarGuard::unset("STRING_TEST_MISSING");
    assert_eq!(get_env_string_optional("STRING_TEST_MISSING"), None);
    assert!(matches!(get_env_string_required("STRING_TEST_MISSING"), Err(EnvError::RequiredNotPresent { .. })));
    assert_eq!(get_env_string_or_default("STRING_TEST_MISSING", "fallback"), "fallback");
  }

  #[test]
  fn required_not_present_carries_env_var_name() {
    let _g = EnvVarGuard::unset("STRING_TEST_REQUIRED_NAME");
    match get_env_string_required("STRING_TEST_REQUIRED_NAME") {
      Err(EnvError::RequiredNotPresent { name }) => {
        assert_eq!(name, "STRING_TEST_REQUIRED_NAME");
      },
      other => panic!("unexpected result: {:?}", other),
    }
  }
}
