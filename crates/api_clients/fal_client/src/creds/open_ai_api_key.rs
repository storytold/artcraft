//! An OpenAI API key, used only for fal's "bring your own key" OpenAI image endpoints.

/// This is for Fal's OpenAI "Bring Your Own Key" (BYOK) endpoints.
///
/// With BYOK, fal runs the model but the usage is billed to this OpenAI key instead of the
/// fal account. Like `FalApiKey`, it has no `Debug` impl so it cannot leak into logs.
#[derive(Clone)]
pub struct OpenAiApiKey(pub String);

impl OpenAiApiKey {
  /// Wrap a key string as-is.
  pub fn new(api_key: String) -> Self {
    Self(api_key)
  }

  /// Build a key from text read from a file or env var, trimming surrounding whitespace.
  pub fn from_str(api_key: &str) -> Self {
    let api_key = api_key.trim().to_string();
    Self(api_key)
  }
}
