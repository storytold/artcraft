use std::collections::HashSet;
use std::env;
use std::ffi::OsString;

#[derive(Clone, Debug)]
pub enum EnvVarPolicy {
  /// Copy no env vars to the subprocess
  CopyNone,
  /// Copy all env vars to the subprocess
  CopyAll,
  /// Copy only the following env vars to the subprocess
  CopyOnly(HashSet<String>),
  /// Copy all except the following env vars to the subprocess
  CopyExcept(HashSet<String>),
}

impl EnvVarPolicy {
  /// Build the list of env vars to send to the subprocess, if any, based on the policy.
  pub fn get_env_vars_for_subprocess(&self) -> Option<Vec<(OsString, OsString)>> {
    match self {
      EnvVarPolicy::CopyNone => {
        None
      }
      EnvVarPolicy::CopyAll => {
        Some(env::vars().into_iter()
            .map(|(key, value)| (OsString::from(key), OsString::from(value)))
            .collect::<Vec<_>>())
      }
      EnvVarPolicy::CopyOnly(names) => {
        Some(env::vars().into_iter()
            .filter(|(key, _value)| names.contains(key))
            .map(|(key, value)| (OsString::from(key), OsString::from(value)))
            .collect::<Vec<_>>())

      }
      EnvVarPolicy::CopyExcept(names) => {
        Some(env::vars().into_iter()
            .filter(|(key, _value)| !names.contains(key))
            .map(|(key, value)| (OsString::from(key), OsString::from(value)))
            .collect::<Vec<_>>())
      }
    }
  }
}

#[cfg(test)]
mod tests {
  use std::collections::HashSet;

  use crate::command_runner::env_var_policy::EnvVarPolicy;

  // NB: Careful with `set_var` as it escapes into *all* other tests! To make matters
  // more complicated, tests run in parallel and in any order. We're using a special
  // test variable so we never infect other tests.
  fn set_env_vars() {
    std::env::set_var("STORYTELLER_TEST_VAR_FOO", "foo");
    std::env::set_var("STORYTELLER_TEST_VAR_BAR", "bar");
    std::env::set_var("STORYTELLER_TEST_VAR_BAZ", "baz");
    std::env::set_var("STORYTELLER_TEST_VAR_BIN", "bin");
  }

  // NB: Careful with `set_var` as it escapes into *all* other tests! To make matters
  // more complicated, tests run in parallel and in any order. We're using a special
  // test variable so we never infect other tests.
  fn unset_env_vars() {
    std::env::remove_var("STORYTELLER_TEST_VAR_FOO");
    std::env::remove_var("STORYTELLER_TEST_VAR_BAR");
    std::env::remove_var("STORYTELLER_TEST_VAR_BAZ");
    std::env::remove_var("STORYTELLER_TEST_VAR_BIN");
  }

  #[test]
  #[serial_test::serial]
  fn copy_none() {
    let policy = EnvVarPolicy::CopyNone;
    assert_eq!(policy.get_env_vars_for_subprocess(), None);
  }

  #[test]
  #[serial_test::serial]
  fn copy_all() {
    let policy = EnvVarPolicy::CopyAll;

    set_env_vars();

    let args = policy.get_env_vars_for_subprocess().expect("should contain args");

    // NB: All variables contained
    assert!(args.iter().find(|(key, _value)| key == "STORYTELLER_TEST_VAR_FOO").is_some());
    assert!(args.iter().find(|(key, _value)| key == "STORYTELLER_TEST_VAR_BAR").is_some());
    assert!(args.iter().find(|(key, _value)| key == "STORYTELLER_TEST_VAR_BAZ").is_some());
    assert!(args.iter().find(|(key, _value)| key == "STORYTELLER_TEST_VAR_BIN").is_some());

    unset_env_vars();
  }

  #[test]
  #[serial_test::serial]
  fn copy_except() {
    let policy = EnvVarPolicy::CopyExcept(HashSet::from([
      "STORYTELLER_TEST_VAR_FOO".to_string(),
      "STORYTELLER_TEST_VAR_BIN".to_string(),
    ]));

    set_env_vars();

    let args = policy.get_env_vars_for_subprocess().expect("should contain args");

    // NB: Only two contained
    assert!(args.iter().find(|(key, _value)| key == "STORYTELLER_TEST_VAR_FOO").is_none());
    assert!(args.iter().find(|(key, _value)| key == "STORYTELLER_TEST_VAR_BAR").is_some());
    assert!(args.iter().find(|(key, _value)| key == "STORYTELLER_TEST_VAR_BAZ").is_some());
    assert!(args.iter().find(|(key, _value)| key == "STORYTELLER_TEST_VAR_BIN").is_none());

    unset_env_vars();
  }

  #[test]
  #[serial_test::serial]
  fn copy_only() {
    let policy = EnvVarPolicy::CopyOnly(HashSet::from([
      "STORYTELLER_TEST_VAR_FOO".to_string(),
      "STORYTELLER_TEST_VAR_BIN".to_string(),
    ]));

    set_env_vars();

    let args = policy.get_env_vars_for_subprocess().expect("should contain args");

    // NB: Only two contained
    assert!(args.iter().find(|(key, _value)| key == "STORYTELLER_TEST_VAR_FOO").is_some());
    assert!(args.iter().find(|(key, _value)| key == "STORYTELLER_TEST_VAR_BAR").is_none());
    assert!(args.iter().find(|(key, _value)| key == "STORYTELLER_TEST_VAR_BAZ").is_none());
    assert!(args.iter().find(|(key, _value)| key == "STORYTELLER_TEST_VAR_BIN").is_some());

    unset_env_vars();
  }
}
