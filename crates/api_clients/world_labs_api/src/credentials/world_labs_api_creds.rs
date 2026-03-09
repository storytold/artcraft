/// Credentials for the official World Labs API.
/// Uses a simple API key for authentication via the `WLT-Api-Key` header.
#[derive(Clone)]
pub struct WorldLabsApiCreds {
  api_key: String,
}

impl WorldLabsApiCreds {
  pub fn new(api_key: String) -> Self {
    Self { api_key }
  }

  pub fn api_key(&self) -> &str {
    &self.api_key
  }
}
