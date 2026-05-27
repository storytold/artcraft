use fal_client::creds::fal_api_key::FalApiKey;

/// A unified Fal client. The caller picks the dispatch mode:
///
///   - `Some(webhook_url)` → endpoints will use Fal's webhook flow.
///   - `None` → endpoints will use the queue/polling flow (where available).
///
/// Some endpoints are webhook-only (their fal_client wrapper lives under the
/// `requests::webhook::*` namespace and has no `api::` queue variant). Those
/// will return `ClientError::WebhookUrlRequired` when constructed with `None`.
pub struct RouterFalClient {
  pub(crate) api_key: FalApiKey,
  pub(crate) webhook_url: Option<String>,
}

impl RouterFalClient {
  /// Build a client for webhook dispatch.
  pub fn new_with_webhook(api_key: FalApiKey, webhook_url: String) -> Self {
    Self { api_key, webhook_url: Some(webhook_url) }
  }

  /// Build a client for queue/polling dispatch (no webhook URL).
  pub fn new_polling_only(api_key: FalApiKey) -> Self {
    Self { api_key, webhook_url: None }
  }

  pub fn new_polling_only_from_raw_key(api_key: &str) -> Self {
    Self::new_polling_only(FalApiKey::from_str(api_key))
  }
}
