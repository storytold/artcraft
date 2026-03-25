/// Holds the API key for authenticating with the Rootly API.
#[derive(Clone)]
pub struct RootlyApiKey {
  pub (crate) api_key: String,
}

impl RootlyApiKey {
  pub fn new(api_key: String) -> Self {
    Self { api_key }
  }
}
