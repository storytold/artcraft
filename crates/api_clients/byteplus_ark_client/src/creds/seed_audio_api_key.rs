/// API key for BytePlus Seed Audio, sent as `X-Api-Key`. Seed Audio runs on the BytePlus voice
/// service, so this key is created in the console under Voice and differs from the ModelArk key.
#[derive(Clone)]
pub struct SeedAudioApiKey {
  pub(crate) api_key: String,
}

impl SeedAudioApiKey {
  pub fn new(api_key: &str) -> Self {
    Self { api_key: api_key.trim().to_string() }
  }

  pub fn is_empty(&self) -> bool {
    self.api_key.is_empty()
  }
}

// Debug is redacted so the key can't leak into a log line through `{:?}` on an args struct.
impl std::fmt::Debug for SeedAudioApiKey {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(f, "SeedAudioApiKey(<redacted>)")
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn trims_and_redacts() {
    let key = SeedAudioApiKey::new("  secret-key \n");
    assert_eq!(key.api_key, "secret-key");
    assert_eq!(format!("{:?}", key), "SeedAudioApiKey(<redacted>)");
    assert!(SeedAudioApiKey::new("   ").is_empty());
  }
}
