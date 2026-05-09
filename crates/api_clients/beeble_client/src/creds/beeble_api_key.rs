use std::fmt;

/// Holds the API key for authenticating with the Beeble API.
/// Sent as the `x-api-key` header.
#[derive(Clone)]
pub struct BeebleApiKey {
  pub(crate) api_key: String,
}

impl BeebleApiKey {
  pub fn new(api_key: String) -> Self {
    Self { api_key }
  }
}

impl fmt::Debug for BeebleApiKey {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    if self.api_key.len() > 0 {
      write!(f, "BeebleApiKey(***)")
    } else {
      write!(f, "BeebleApiKey(EMPTY)")
    }
  }
}
