//! The fal.ai API key, wrapped in its own type so it is not confused with other strings.

/// A fal API key, in fal's "<key id>:<key secret>" form. Sent to fal as `Authorization: Key <this>`.
/// Callers: `FalEndpoint::send_queue_request` / `send_webhook_request` and the polling functions.
/// It has no `Debug` impl, so the secret cannot be logged with `{:?}` by accident.
#[derive(Clone)]
pub struct FalApiKey(pub String);

impl FalApiKey {
  /// Wrap a key string as-is.
  pub fn new(api_key: String) -> Self {
    Self(api_key)
  }

  /// Build a key from text read from a file or env var. Trims whitespace first, because
  /// credential files usually end with a newline that fal would reject.
  pub fn from_str(api_key: &str) -> Self {
    let api_key = api_key.trim().to_string();
    Self(api_key)
  }
}
