/// Holds the API key for authenticating with the Grok (xAI Imagine) API.
///
/// Sent on every request as `Authorization: Bearer <api_key>`.
#[derive(Clone)]
pub struct GrokApiKey {
  pub(crate) api_key: String,
}

impl GrokApiKey {
  pub fn new(api_key: String) -> Self {
    Self { api_key }
  }
}

// Debug is redacted so the key can't end up in a log line via accidental
// `{:?}` on an enclosing args struct.
impl std::fmt::Debug for GrokApiKey {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(f, "GrokApiKey(<redacted>)")
  }
}
