/// A GmiCloud API key used for Bearer token authentication.
#[derive(Clone)]
pub struct GmiCloudApiKey(pub String);

impl GmiCloudApiKey {
  pub fn new(api_key: String) -> Self {
    Self(api_key.trim().to_string())
  }

  pub fn from_str(api_key: &str) -> Self {
    Self(api_key.trim().to_string())
  }

  pub fn as_str(&self) -> &str {
    &self.0
  }
}
