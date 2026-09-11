use grok_api_client::creds::grok_api_key::GrokApiKey;

pub struct RouterGrokApiClient {
  pub(crate) api_key: GrokApiKey,
}

impl RouterGrokApiClient {
  pub fn new(api_key: GrokApiKey) -> Self {
    RouterGrokApiClient { api_key }
  }
}
