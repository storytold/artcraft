use std::env;
use std::time::Duration;

use log::warn;

use crate::error::EnvError;

/// Get an environment variable as a `Duration` in seconds.
/// If not provided or cannot parse, return an error.
pub fn get_env_duration_seconds_required(env_name: &str) -> Result<Duration, EnvError> {
  get_env_duration_seconds_internal(env_name)
    .and_then(|maybe| match maybe {
      None => {
        warn!("Env var '{}' not supplied.", env_name);
        Err(EnvError::RequiredNotPresent { name: env_name.to_string() })
      },
      Some(val) => Ok(val),
    })
}

/// Get an environment variable as a `Duration` in seconds.
/// If not present or there is an error in parsing, return `None`.
pub fn get_env_duration_seconds_optional(env_name: &str) -> Option<Duration> {
  match get_env_duration_seconds_internal(env_name) {
    Err(e) => {
      warn!("Env var '{}': error parsing numeric value: `{:?}`. Returning no value.", env_name, e);
      None
    },
    Ok(None) => {
      warn!("Env var '{}' not present.", env_name);
      None
    },
    Ok(Some(value)) => Some(value),
  }
}

/// Get an environment variable as a `Duration` in seconds, or fall back to the provided default.
/// Returns the default in the event of a parse error.
pub fn get_env_duration_seconds_or_default(env_name: &str, default: Duration) -> Duration {
  get_env_duration_seconds_internal(env_name)
    .map(|maybe| match maybe {
      None => {
        warn!("Env var '{}' not supplied. Using default '{:?}'.", env_name, default);
        default
      },
      Some(val) => val,
    })
    .unwrap_or_else(|e| {
      warn!("Env var '{}': error parsing numeric value: {:?}. Using default '{:?}'.",
            env_name, e, default);
      default
    })
}

fn get_env_duration_seconds_internal(env_name: &str) -> Result<Option<Duration>, EnvError> {
  match env::var(env_name).as_ref().ok() {
    None => {
      Ok(None)
    },
    Some(val) => match val.parse::<u64>() {
      Ok(number) => Ok(Some(Duration::from_secs(number))),
      Err(_) => Err(EnvError::ParseError { reason: format!("Couldn't parse as number: '{}'", val) })
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  use crate::tests_common::EnvVarGuard;

  #[test]
  fn zero_seconds_round_trips() {
    let _g = EnvVarGuard::set("DURATION_TEST_ZERO", "0");
    assert_eq!(get_env_duration_seconds_optional("DURATION_TEST_ZERO"), Some(Duration::from_secs(0)));
    assert_eq!(get_env_duration_seconds_required("DURATION_TEST_ZERO").unwrap(), Duration::from_secs(0));
    assert_eq!(get_env_duration_seconds_or_default("DURATION_TEST_ZERO", Duration::from_secs(99)), Duration::from_secs(0));
  }

  #[test]
  fn u64_max_seconds_round_trips() {
    let _g = EnvVarGuard::set("DURATION_TEST_U64_MAX", &u64::MAX.to_string());
    assert_eq!(get_env_duration_seconds_optional("DURATION_TEST_U64_MAX"), Some(Duration::from_secs(u64::MAX)));
    assert_eq!(get_env_duration_seconds_required("DURATION_TEST_U64_MAX").unwrap(), Duration::from_secs(u64::MAX));
    assert_eq!(get_env_duration_seconds_or_default("DURATION_TEST_U64_MAX", Duration::from_secs(1)), Duration::from_secs(u64::MAX));
  }

  #[test]
  fn negative_is_unparseable() {
    let _g = EnvVarGuard::set("DURATION_TEST_NEGATIVE", "-1");
    assert_eq!(get_env_duration_seconds_optional("DURATION_TEST_NEGATIVE"), None);
    assert!(matches!(get_env_duration_seconds_required("DURATION_TEST_NEGATIVE"), Err(EnvError::ParseError { .. })));
    assert_eq!(get_env_duration_seconds_or_default("DURATION_TEST_NEGATIVE", Duration::from_secs(5)), Duration::from_secs(5));
  }

  #[test]
  fn missing_returns_none_required_error_and_default() {
    let _g = EnvVarGuard::unset("DURATION_TEST_MISSING");
    assert_eq!(get_env_duration_seconds_optional("DURATION_TEST_MISSING"), None);
    assert!(matches!(get_env_duration_seconds_required("DURATION_TEST_MISSING"), Err(EnvError::RequiredNotPresent { .. })));
    assert_eq!(get_env_duration_seconds_or_default("DURATION_TEST_MISSING", Duration::from_secs(42)), Duration::from_secs(42));
  }
}
