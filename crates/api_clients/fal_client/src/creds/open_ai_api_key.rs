
/// This is for Fal's OpenAI "Bring Your Own Key" (BYOK) endpoints.
#[derive(Clone)]
pub struct OpenAiApiKey(pub String);

impl OpenAiApiKey {
  pub fn new(api_key: String) -> Self {
    Self(api_key)
  }

  pub fn from_str(api_key: &str) -> Self {
    let api_key = api_key.trim().to_string();
    Self(api_key)
  }
}
