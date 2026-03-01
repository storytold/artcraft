use fal_client::creds::fal_api_key::FalApiKey;

pub struct RouterFalClient {
  pub(crate) api_key: FalApiKey,
  pub(crate) webhook_url: String,
}

impl RouterFalClient {
  pub fn new(api_key: FalApiKey, webhook_url: String) -> Self {
    Self { api_key, webhook_url }
  }
}
