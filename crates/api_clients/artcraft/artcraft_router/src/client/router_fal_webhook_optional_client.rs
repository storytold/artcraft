use fal_client::creds::fal_api_key::FalApiKey;

pub struct RouterFalWebhookOptionalClient {
  pub(crate) api_key: FalApiKey,
  pub(crate) webhook_url: Option<String>,
}

impl RouterFalWebhookOptionalClient {
  pub fn new(api_key: FalApiKey) -> Self {
    Self { api_key, webhook_url: None }
  }

  pub fn new_with_webhook(api_key: FalApiKey, webhook_url: String) -> Self {
    Self { 
      api_key, 
      webhook_url: Some(webhook_url)
    }
  }
}
