/// API key for BytePlus ModelArk, sent on every request as `Authorization: Bearer <api_key>`.
#[derive(Clone)]
pub struct ArkApiKey {
  pub(crate) api_key: String,
}

impl ArkApiKey {
  pub fn new(api_key: &str) -> Self {
    Self { api_key: api_key.trim().to_string() }
  }

  pub fn is_empty(&self) -> bool {
    self.api_key.is_empty()
  }
}

// Debug is redacted so the key can't leak into a log line through `{:?}` on an args struct.
impl std::fmt::Debug for ArkApiKey {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(f, "ArkApiKey(<redacted>)")
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn trims_and_redacts() {
    let key = ArkApiKey::new("  secret-key \n");
    assert_eq!(key.api_key, "secret-key");
    assert_eq!(format!("{:?}", key), "ArkApiKey(<redacted>)");
    assert!(ArkApiKey::new("   ").is_empty());
  }
}
