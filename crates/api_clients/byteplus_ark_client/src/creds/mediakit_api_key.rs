/// API key for BytePlus AI MediaKit (video enhancement), sent as a bearer token. MediaKit has
/// its own console and host, so this key differs from the ModelArk key.
#[derive(Clone)]
pub struct MediaKitApiKey {
  pub(crate) api_key: String,
}

impl MediaKitApiKey {
  pub fn new(api_key: &str) -> Self {
    Self { api_key: api_key.trim().to_string() }
  }

  pub fn is_empty(&self) -> bool {
    self.api_key.is_empty()
  }
}

// Debug is redacted so the key can't leak into a log line through `{:?}`.
impl std::fmt::Debug for MediaKitApiKey {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(f, "MediaKitApiKey(<redacted>)")
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn trims_and_redacts() {
    let key = MediaKitApiKey::new("  secret-key \n");
    assert_eq!(key.api_key, "secret-key");
    assert_eq!(format!("{:?}", key), "MediaKitApiKey(<redacted>)");
    assert!(MediaKitApiKey::new("   ").is_empty());
  }
}
