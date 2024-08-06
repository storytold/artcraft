use std::collections::{HashMap, HashSet};
use std::env;
use std::ffi::OsString;

use once_cell::sync::Lazy;

// These environment vars are not copied over to the subprocess
// TODO/FIXME(bt, 2023-05-28): This is horrific security!
static IGNORED_ENVIRONMENT_VARS : Lazy<HashSet<String>> = Lazy::new(|| {
  let env_var_names= [
    "MYSQL_URL",
    "ACCESS_KEY",
    "SECRET_KEY",
    "NEWRELIC_API_KEY",
  ];

  env_var_names.iter()
      .map(|value| value.to_string())
      .collect::<HashSet<String>>()
});

pub fn get_filtered_env_vars() -> Vec<(OsString, OsString)> {
  let mut env_vars = Vec::new();

  // Copy all environment variables from the parent process.
  // This is necessary to send all the kubernetes settings for Nvidia / CUDA.
  for (env_key, env_value) in env::vars() {
    if IGNORED_ENVIRONMENT_VARS.contains(&env_key) {
      continue;
    }
    env_vars.push((
      OsString::from(env_key),
      OsString::from(env_value),
    ));
  }

  env_vars
}

pub fn get_filtered_env_vars_hashmap() -> HashMap<String, String> {
  let mut env_vars = HashMap::new();

  // Copy all environment variables from the parent process.
  // This is necessary to send all the kubernetes settings for Nvidia / CUDA.
  for (env_key, env_value) in env::vars() {
    if IGNORED_ENVIRONMENT_VARS.contains(&env_key) {
      continue;
    }
    env_vars.insert(env_key, env_value);
  }

  env_vars
}
