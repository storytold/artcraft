use cookie_store::cookie_store::CookieStore;
use grok_consumer_client::credentials::grok_client_secrets::GrokClientSecrets;
use grok_consumer_client::credentials::grok_full_credentials::GrokFullCredentials;
use grok_consumer_client::credentials::grok_user_data::GrokUserData;

#[derive(Clone)]
pub struct GrokCredentialHolder {
  /// Directly off the Tauri browser session.
  /// Read once, write to disk
  /// The Grok client consumes a string-only form (rather than this cookie jar)
  pub browser_cookies: Option<CookieStore>,

  /// Full credentials.
  /// NOT PERSISTED TO DISK.
  pub grok_full_credentials: Option<GrokFullCredentials>,
}

impl GrokCredentialHolder {
  pub fn empty() -> Self {
    Self {
      browser_cookies: None,
      grok_full_credentials: None,
    }
  }
}
