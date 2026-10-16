use openrouter_client::creds::openrouter_api_key::OpenRouterApiKey;

/// An OpenRouter client with the user's own API key. OpenRouter's Image API answers with the
/// finished images, so there is no webhook or polling mode.
pub struct RouterOpenRouterClient {
  pub(crate) api_key: OpenRouterApiKey,
  /// Another server (tests); OpenRouter's own by default.
  pub(crate) maybe_api_base: Option<String>,
}

impl RouterOpenRouterClient {
  pub fn new(api_key: OpenRouterApiKey) -> Self {
    Self { api_key, maybe_api_base: None }
  }

  pub fn new_from_raw_key(api_key: &str) -> Self {
    Self::new(OpenRouterApiKey::from_str(api_key))
  }

  /// Sends requests to `api_base` (eg. `http://127.0.0.1:1234`) instead of OpenRouter.
  pub fn with_api_base(mut self, api_base: impl Into<String>) -> Self {
    self.maybe_api_base = Some(api_base.into());
    self
  }
}
