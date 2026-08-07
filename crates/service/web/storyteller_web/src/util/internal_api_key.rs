//! Internal-facing API keys for our own worker fleets (GPU inference, etc.).
//!
//! These are configured as an env secret (`ACCEPTED_INTERNAL_API_KEYS`) at app
//! startup and are completely distinct from consumer-facing
//! `artcraft_api_keys` infrastructure — do not mix the two.

use std::collections::HashSet;
use std::fmt;

/// An accepted internal API key.
#[derive(Clone, Eq, PartialEq, Hash)]
pub struct InternalApiKey(String);

impl InternalApiKey {
  pub fn new(key: impl Into<String>) -> Self {
    Self(key.into())
  }

  pub fn as_str(&self) -> &str {
    &self.0
  }

  /// Parse a comma-separated key list (the `ACCEPTED_INTERNAL_API_KEYS` env
  /// var format). Entries are trimmed; blank entries are dropped.
  pub fn parse_comma_separated_list(value: &str) -> HashSet<InternalApiKey> {
    value
      .split(',')
      .map(str::trim)
      .filter(|entry| !entry.is_empty())
      .map(InternalApiKey::new)
      .collect()
  }
}

/// Redacted: keys are secrets and must never leak into logs.
impl fmt::Debug for InternalApiKey {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "InternalApiKey(***)")
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn parses_comma_separated_list_with_whitespace() {
    let keys = InternalApiKey::parse_comma_separated_list(" foo_abc , bar_def,, ");
    assert_eq!(keys.len(), 2);
    assert!(keys.contains(&InternalApiKey::new("foo_abc")));
    assert!(keys.contains(&InternalApiKey::new("bar_def")));
  }

  #[test]
  fn empty_list_parses_to_empty_set() {
    assert!(InternalApiKey::parse_comma_separated_list("").is_empty());
    assert!(InternalApiKey::parse_comma_separated_list(" , ,").is_empty());
  }

  #[test]
  fn debug_is_redacted() {
    let key = InternalApiKey::new("foo_supersecret");
    assert_eq!(format!("{:?}", key), "InternalApiKey(***)");
  }
}
