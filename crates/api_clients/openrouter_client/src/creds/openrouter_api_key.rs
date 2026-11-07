/// The user's OpenRouter API key (`sk-or-...`), sent as `Authorization: Bearer <key>`.
#[derive(Clone)]
pub struct OpenRouterApiKey {
  pub(crate) api_key: String,
}

impl OpenRouterApiKey {
  pub fn from_str(api_key: &str) -> Self {
    Self { api_key: api_key.trim().to_owned() }
  }
}

// Redacted so the key can't end up in a log line through `{:?}` on an enclosing struct.
impl std::fmt::Debug for OpenRouterApiKey {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(f, "OpenRouterApiKey(<redacted>)")
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn keys_are_trimmed_and_never_printed() {
    let key = OpenRouterApiKey::from_str("  sk-or-v1-secret \n");
    assert_eq!(key.api_key, "sk-or-v1-secret");
    assert_eq!(format!("{key:?}"), "OpenRouterApiKey(<redacted>)");
  }
}
