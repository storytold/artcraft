use std::env;
use std::env::VarError;
use std::path::{Path, PathBuf};

use log::warn;

use storyteller_root::get_substituted_path;

use crate::error::EnvError;
use crate::validate::validate_env_name;

/// Get an environment variable as a `PathBuf`.
/// If not provided or cannot parse, return an error.
pub fn get_env_pathbuf_required(env_name: &str) -> Result<PathBuf, EnvError> {
  validate_env_name(env_name)?;
  get_env_pathbuf_internal(env_name)
    .and_then(|maybe| match maybe {
      None => {
        warn!("Env var '{}' not supplied.", env_name);
        Err(EnvError::RequiredNotPresent { name: env_name.to_string() })
      },
      Some(val) => Ok(val),
    })
}

/// Get an environment variable as a `PathBuf`.
/// If not present or there is an error in parsing, return `None`.
pub fn get_env_pathbuf_optional(env_name: &str) -> Option<PathBuf> {
  if let Err(e) = validate_env_name(env_name) {
    warn!("Env var '{}': invalid name: {:?}. Returning no value.", env_name, e);
    return None;
  }
  match get_env_pathbuf_internal(env_name) {
    Err(e) => {
      warn!("Env var '{}': error parsing PathBuf value: `{:?}`. Returning no value.", env_name, e);
      None
    },
    Ok(None) => {
      warn!("Env var '{}' not present.", env_name);
      None
    },
    Ok(Some(value)) => Some(value),
  }
}

/// Get an environment variable as a `PathBuf`, or fall back to the provided default.
/// Returns the default in the event of a parse error.
pub fn get_env_pathbuf_or_default<P: AsRef<Path>>(env_name: &str, default_value: P) -> PathBuf {
  if let Err(e) = validate_env_name(env_name) {
    let default_path = default_value.as_ref().to_path_buf();
    warn!("Env var '{}': invalid name: {:?}. Using default '{:?}'.", env_name, e, &default_path);
    return default_path;
  }
  get_env_pathbuf_internal(env_name)
    .map(|maybe| match maybe {
      None => {
        let default_path = default_value.as_ref().to_path_buf();
        warn!("Env var '{}' not supplied. Using default '{:?}'.", env_name, &default_path);
        default_path
      },
      Some(val) => val,
    })
    .unwrap_or_else(|e| {
      let default_path = default_value.as_ref().to_path_buf();
      warn!("Env var '{}': error: {:?}. Using default '{:?}'.",
            env_name, e, &default_path);
      default_path
    })
}

pub (crate) fn get_env_pathbuf_internal(env_name: &str) -> Result<Option<PathBuf>, EnvError> {
  match env::var(env_name).as_ref() {
    Err(err) => match err {
      VarError::NotPresent => Ok(None),
      VarError::NotUnicode(_) => Err(EnvError::NotUnicode),
    }
    Ok(val) => {
      // TODO(bt,2023-10-17): The error handling and type juggling under the hood is pretty gnarly
      //  and needs to be revisited to make the failure modes safer.
      let path = get_substituted_path(val);
      Ok(Some(path))
    }
  }
}

#[cfg(test)]
mod tests {
  use crate::error::{EnvError, InvalidNameReason};

  use super::*;

  #[test]
  fn rejects_empty_name_optional() {
    assert_eq!(get_env_pathbuf_optional(""), None);
  }

  #[test]
  fn rejects_name_with_equals_sign_optional() {
    assert_eq!(get_env_pathbuf_optional("FOO=BAR"), None);
  }

  #[test]
  fn rejects_name_with_nul_byte_optional() {
    assert_eq!(get_env_pathbuf_optional("FOO\0BAR"), None);
  }

  #[test]
  fn rejects_empty_name_or_default() {
    assert_eq!(
      get_env_pathbuf_or_default("", "/default"),
      PathBuf::from("/default"),
    );
  }

  #[test]
  fn rejects_name_with_equals_sign_or_default() {
    assert_eq!(
      get_env_pathbuf_or_default("FOO=BAR", "/default"),
      PathBuf::from("/default"),
    );
  }

  #[test]
  fn rejects_empty_name_required() {
    assert!(matches!(
      get_env_pathbuf_required(""),
      Err(EnvError::InvalidVariableName {
        reason: InvalidNameReason::Empty,
        ..
      })
    ));
  }

  #[test]
  fn rejects_name_with_equals_sign_required() {
    assert!(matches!(
      get_env_pathbuf_required("FOO=BAR"),
      Err(EnvError::InvalidVariableName {
        reason: InvalidNameReason::ContainsEquals,
        ..
      })
    ));
  }
}
