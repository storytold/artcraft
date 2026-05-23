use std::fs::read_to_string;

use errors::AnyhowResult;

use crate::creds::grok_api_key::GrokApiKey;

const GROK_API_KEY_PATH: &str = "/Users/bt/Artcraft/credentials/grok_api_key.txt";

/// Load a Grok (xAI) API key from the local credentials file. Whitespace is
/// trimmed because base64-style key files often pick up a trailing newline.
#[cfg(test)]
pub fn get_test_api_key() -> AnyhowResult<GrokApiKey> {
  let raw = read_to_string(GROK_API_KEY_PATH)?;
  let trimmed = raw.trim().to_string();
  if trimmed.is_empty() {
    anyhow::bail!("Grok API key file is empty: {}", GROK_API_KEY_PATH);
  }
  Ok(GrokApiKey::new(trimmed))
}
