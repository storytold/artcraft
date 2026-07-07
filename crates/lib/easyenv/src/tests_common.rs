//! Test utilities shared across easyenv test modules.

#![cfg(test)]

use std::env;

pub(crate) struct EnvVarGuard {
  name: &'static str,
}

impl EnvVarGuard {
  pub(crate) fn set(name: &'static str, value: &str) -> Self {
    env::remove_var(name);
    env::set_var(name, value);
    Self { name }
  }

  pub(crate) fn unset(name: &'static str) -> Self {
    env::remove_var(name);
    Self { name }
  }
}

impl Drop for EnvVarGuard {
  fn drop(&mut self) {
    env::remove_var(self.name);
  }
}
