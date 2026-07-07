use std::env;
use std::fmt::{Debug, Display};
use std::str::FromStr;

use log::{error, warn};

use crate::error::EnvError;
use crate::validate::validate_env_name;

/// Get an environment variable as a number, or fall back to the provided default if not set.
/// If the env var is present but can't be parsed, an error is returned instead.
pub fn get_env_num<T>(env_name: &str, default: T) -> Result<T, EnvError>
  where T: FromStr + Display,
        T::Err: Debug
{
  validate_env_name(env_name)?;
  match env::var(env_name).as_ref().ok() {
    None => {
      warn!("Env var '{}' not supplied. Using default '{}'.", env_name, default);
      Ok(default)
    },
    Some(val) => {
      val.parse::<T>()
          .map_err(|e| {
            error!("Can't parse value '{:?}'. Error: {:?}", val, e);
            EnvError::ParseError { reason: format!("Can't parse value: {:?}", e) }
          })
    },
  }
}

/// Get an environment variable as an optional number.
/// Returns `Ok(None)` if the env var is not set.
/// Returns `Err` if the env var is set but can't be parsed.
pub fn try_get_env_num_optional<T>(env_name: &str) -> Result<Option<T>, EnvError>
  where T: FromStr,
        T::Err: Debug
{
  validate_env_name(env_name)?;
  match env::var(env_name).as_ref().ok() {
    None => {
      warn!("Env var '{}' not supplied.", env_name);
      Ok(None)
    },
    Some(val) => {
      val.parse::<T>()
          .map(Some)
          .map_err(|e| {
            error!("Can't parse env var '{}' value '{:?}'. Error: {:?}", env_name, val, e);
            EnvError::ParseError { reason: format!("Can't parse value: {:?}", e) }
          })
    },
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  use crate::tests_common::EnvVarGuard;

  #[test]
  fn parses_i32() {
    let _g = EnvVarGuard::set("NUM_TEST_I32", "-42");
    assert_eq!(get_env_num("NUM_TEST_I32", 0i32).unwrap(), -42);
    assert_eq!(try_get_env_num_optional::<i32>("NUM_TEST_I32").unwrap(), Some(-42));
  }

  #[test]
  fn parses_u64() {
    let _g = EnvVarGuard::set("NUM_TEST_U64", "18446744073709551615");
    assert_eq!(get_env_num("NUM_TEST_U64", 0u64).unwrap(), u64::MAX);
    assert_eq!(try_get_env_num_optional::<u64>("NUM_TEST_U64").unwrap(), Some(u64::MAX));
  }

  #[test]
  fn parses_f64() {
    let _g = EnvVarGuard::set("NUM_TEST_F64", "3.14");
    assert_eq!(get_env_num("NUM_TEST_F64", 0.0f64).unwrap(), 3.14);
    assert_eq!(try_get_env_num_optional::<f64>("NUM_TEST_F64").unwrap(), Some(3.14));
  }

  #[test]
  fn u8_overflow_returns_parse_error() {
    let _g = EnvVarGuard::set("NUM_TEST_U8_OVERFLOW", "256");
    assert!(get_env_num("NUM_TEST_U8_OVERFLOW", 0u8).is_err());
    assert!(try_get_env_num_optional::<u8>("NUM_TEST_U8_OVERFLOW").is_err());
  }

  #[test]
  fn missing_returns_default_and_none() {
    let _g = EnvVarGuard::unset("NUM_TEST_MISSING");
    assert_eq!(get_env_num("NUM_TEST_MISSING", 99i32).unwrap(), 99);
    assert_eq!(try_get_env_num_optional::<i32>("NUM_TEST_MISSING").unwrap(), None);
  }

  #[test]
  fn unparseable_returns_parse_error() {
    let _g = EnvVarGuard::set("NUM_TEST_UNPARSEABLE", "not_a_number");
    assert!(get_env_num("NUM_TEST_UNPARSEABLE", 0i32).is_err());
    assert!(try_get_env_num_optional::<i32>("NUM_TEST_UNPARSEABLE").is_err());
  }
}

#[cfg(test)]
mod tests {
  use crate::error::{EnvError, InvalidNameReason};

  use super::*;

  #[test]
  fn rejects_empty_name_get_env_num() {
    assert!(matches!(
      get_env_num::<u32>("", 42),
      Err(EnvError::InvalidVariableName {
        reason: InvalidNameReason::Empty,
        ..
      })
    ));
  }

  #[test]
  fn rejects_name_with_equals_sign_get_env_num() {
    assert!(matches!(
      get_env_num::<u32>("FOO=BAR", 42),
      Err(EnvError::InvalidVariableName {
        reason: InvalidNameReason::ContainsEquals,
        ..
      })
    ));
  }

  #[test]
  fn rejects_name_with_nul_byte_get_env_num() {
    assert!(matches!(
      get_env_num::<u32>("FOO\0BAR", 42),
      Err(EnvError::InvalidVariableName {
        reason: InvalidNameReason::ContainsNul,
        ..
      })
    ));
  }

  #[test]
  fn rejects_empty_name_try_get_env_num_optional() {
    assert!(matches!(
      try_get_env_num_optional::<u32>(""),
      Err(EnvError::InvalidVariableName {
        reason: InvalidNameReason::Empty,
        ..
      })
    ));
  }

  #[test]
  fn rejects_name_with_equals_sign_try_get_env_num_optional() {
    assert!(matches!(
      try_get_env_num_optional::<u32>("FOO=BAR"),
      Err(EnvError::InvalidVariableName {
        reason: InvalidNameReason::ContainsEquals,
        ..
      })
    ));
  }
}
