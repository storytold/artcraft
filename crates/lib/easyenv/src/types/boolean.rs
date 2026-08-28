use std::env;
use std::env::VarError;

use log::warn;

use crate::error::EnvError;
use crate::validate::validate_env_name;

/// Get an environment variable as a bool.
/// If not present or there is an error in parsing, return `None`.
pub fn get_env_bool_optional(env_name: &str) -> Option<bool> {
  if let Err(e) = validate_env_name(env_name) {
    warn!("Env var '{}': invalid name: {:?}. Returning no value.", env_name, e);
    return None;
  }
  match env::var(env_name).as_ref().ok() {
    None => {
      warn!("Env var '{}' not supplied.", env_name);
      None
    },
    Some(val) => match val.as_ref() {
      "TRUE" => Some(true),
      "true" => Some(true),
      "FALSE" => Some(false),
      "false" => Some(false),
      _ => {
        warn!("Env var '{}': error parsing boolean value: {:?}", env_name, val);
        None
      },
    }
  }
}

/// Get an environment variable as a bool, or fall back to the provided default.
/// Returns the default in the event of a parse error.
pub fn get_env_bool_or_default(env_name: &str, default: bool) -> bool {
  if let Err(e) = validate_env_name(env_name) {
    warn!("Env var '{}': invalid name: {:?}. Using default '{}'.", env_name, e, default);
    return default;
  }
  get_env_bool_internal(env_name)
      .map(|maybe| match maybe {
        None => {
          warn!("Env var '{}' not supplied. Using default '{}'.", env_name, default);
          default
        },
        Some(val) => val,
      })
      .unwrap_or_else(|e| {
        warn!("Env var '{}': error parsing boolean value: {:?}. Using default '{}'.",
            env_name, e, default);
        default
      })
}

/// Get an environment variable as a bool.
/// If not provided or cannot parse, return an error.
pub fn get_env_bool_required(env_name: &str) -> Result<bool, EnvError> {
  validate_env_name(env_name)?;
  get_env_bool_internal(env_name)
      .and_then(|maybe| match maybe {
        None => {
          warn!("Env var '{}' not supplied.", env_name);
          Err(EnvError::RequiredNotPresent { name: env_name.to_string() })
        },
        Some(val) => Ok(val),
      })
}

fn get_env_bool_internal(env_name: &str) -> Result<Option<bool>, EnvError> {
  match env::var(env_name).as_deref() {
    Err(err) => match err {
      VarError::NotPresent => Ok(None),
      VarError::NotUnicode(_) => Err(EnvError::NotUnicode),
    }
    Ok(val) => match val {
      "TRUE" => Ok(Some(true)),
      "true" => Ok(Some(true)),
      "FALSE" => Ok(Some(false)),
      "false" => Ok(Some(false)),
      _ => {
        Err(EnvError::ParseError { reason: format!("Couldn't parse as bool: '{}'", val) })
      },
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  use crate::tests_common::EnvVarGuard;

  #[test]
  fn literals_round_trip_through_optional_required_and_or_default() {
    let _g = EnvVarGuard::set("BOOLEAN_TEST_TRUE_LOWER", "true");
    assert_eq!(get_env_bool_optional("BOOLEAN_TEST_TRUE_LOWER"), Some(true));
    assert_eq!(get_env_bool_required("BOOLEAN_TEST_TRUE_LOWER").unwrap(), true);
    assert_eq!(get_env_bool_or_default("BOOLEAN_TEST_TRUE_LOWER", false), true);

    let _g = EnvVarGuard::set("BOOLEAN_TEST_TRUE_UPPER", "TRUE");
    assert_eq!(get_env_bool_optional("BOOLEAN_TEST_TRUE_UPPER"), Some(true));
    assert_eq!(get_env_bool_required("BOOLEAN_TEST_TRUE_UPPER").unwrap(), true);
    assert_eq!(get_env_bool_or_default("BOOLEAN_TEST_TRUE_UPPER", false), true);

    let _g = EnvVarGuard::set("BOOLEAN_TEST_FALSE_LOWER", "false");
    assert_eq!(get_env_bool_optional("BOOLEAN_TEST_FALSE_LOWER"), Some(false));
    assert_eq!(get_env_bool_required("BOOLEAN_TEST_FALSE_LOWER").unwrap(), false);
    assert_eq!(get_env_bool_or_default("BOOLEAN_TEST_FALSE_LOWER", true), false);

    let _g = EnvVarGuard::set("BOOLEAN_TEST_FALSE_UPPER", "FALSE");
    assert_eq!(get_env_bool_optional("BOOLEAN_TEST_FALSE_UPPER"), Some(false));
    assert_eq!(get_env_bool_required("BOOLEAN_TEST_FALSE_UPPER").unwrap(), false);
    assert_eq!(get_env_bool_or_default("BOOLEAN_TEST_FALSE_UPPER", true), false);
  }

  #[test]
  fn missing_returns_none_required_error_and_default() {
    let _g = EnvVarGuard::unset("BOOLEAN_TEST_MISSING");
    assert_eq!(get_env_bool_optional("BOOLEAN_TEST_MISSING"), None);
    assert!(matches!(get_env_bool_required("BOOLEAN_TEST_MISSING"), Err(EnvError::RequiredNotPresent { .. })));
    assert_eq!(get_env_bool_or_default("BOOLEAN_TEST_MISSING", true), true);
    assert_eq!(get_env_bool_or_default("BOOLEAN_TEST_MISSING", false), false);
  }

  #[test]
  fn yes_is_unparseable() {
    let _g = EnvVarGuard::set("BOOLEAN_TEST_YES", "yes");
    assert_eq!(get_env_bool_optional("BOOLEAN_TEST_YES"), None);
    assert!(matches!(get_env_bool_required("BOOLEAN_TEST_YES"), Err(EnvError::ParseError { .. })));
    assert_eq!(get_env_bool_or_default("BOOLEAN_TEST_YES", true), true);
    assert_eq!(get_env_bool_or_default("BOOLEAN_TEST_YES", false), false);
  }

  #[test]
  fn one_is_not_treated_as_true() {
    let _g = EnvVarGuard::set("BOOLEAN_TEST_ONE", "1");
    assert_eq!(get_env_bool_optional("BOOLEAN_TEST_ONE"), None);
    assert!(matches!(get_env_bool_required("BOOLEAN_TEST_ONE"), Err(EnvError::ParseError { .. })));
    assert_eq!(get_env_bool_or_default("BOOLEAN_TEST_ONE", true), true);
    assert_eq!(get_env_bool_or_default("BOOLEAN_TEST_ONE", false), false);
  }

  #[test]
  fn empty_string_is_unparseable() {
    let _g = EnvVarGuard::set("BOOLEAN_TEST_EMPTY", "");
    assert_eq!(get_env_bool_optional("BOOLEAN_TEST_EMPTY"), None);
    assert!(matches!(get_env_bool_required("BOOLEAN_TEST_EMPTY"), Err(EnvError::ParseError { .. })));
    assert_eq!(get_env_bool_or_default("BOOLEAN_TEST_EMPTY", true), true);
  }

  #[test]
  fn mixed_case_true_is_unparseable() {
    let _g = EnvVarGuard::set("BOOLEAN_TEST_MIXED_CASE", "TrUe");
    assert_eq!(get_env_bool_optional("BOOLEAN_TEST_MIXED_CASE"), None);
    assert!(matches!(get_env_bool_required("BOOLEAN_TEST_MIXED_CASE"), Err(EnvError::ParseError { .. })));
    assert_eq!(get_env_bool_or_default("BOOLEAN_TEST_MIXED_CASE", false), false);
  }

  #[test]
  fn required_not_present_carries_env_var_name() {
    let _g = EnvVarGuard::unset("BOOLEAN_TEST_REQUIRED_NAME");
    match get_env_bool_required("BOOLEAN_TEST_REQUIRED_NAME") {
      Err(EnvError::RequiredNotPresent { name }) => {
        assert_eq!(name, "BOOLEAN_TEST_REQUIRED_NAME");
      },
      other => panic!("unexpected result: {:?}", other),
    }
  }
}

#[cfg(test)]
mod tests {
  use crate::error::{EnvError, InvalidNameReason};

  use super::*;

  #[test]
  fn rejects_empty_name_optional() {
    assert_eq!(get_env_bool_optional(""), None);
  }

  #[test]
  fn rejects_name_with_equals_sign_optional() {
    assert_eq!(get_env_bool_optional("FOO=BAR"), None);
  }

  #[test]
  fn rejects_name_with_nul_byte_optional() {
    assert_eq!(get_env_bool_optional("FOO\0BAR"), None);
  }

  #[test]
  fn rejects_empty_name_or_default() {
    assert_eq!(get_env_bool_or_default("", true), true);
    assert_eq!(get_env_bool_or_default("", false), false);
  }

  #[test]
  fn rejects_name_with_equals_sign_or_default() {
    assert_eq!(get_env_bool_or_default("FOO=BAR", true), true);
    assert_eq!(get_env_bool_or_default("FOO=BAR", false), false);
  }

  #[test]
  fn rejects_empty_name_required() {
    assert!(matches!(
      get_env_bool_required(""),
      Err(EnvError::InvalidVariableName {
        reason: InvalidNameReason::Empty,
        ..
      })
    ));
  }

  #[test]
  fn rejects_name_with_equals_sign_required() {
    assert!(matches!(
      get_env_bool_required("FOO=BAR"),
      Err(EnvError::InvalidVariableName {
        reason: InvalidNameReason::ContainsEquals,
        ..
      })
    ));
  }

  #[test]
  fn rejects_name_with_nul_byte_required() {
    assert!(matches!(
      get_env_bool_required("FOO\0BAR"),
      Err(EnvError::InvalidVariableName {
        reason: InvalidNameReason::ContainsNul,
        ..
      })
    ));
  }
}
