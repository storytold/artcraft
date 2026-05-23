use crate::credentials::grok_client_secrets::GrokClientSecrets;
use crate::credentials::grok_cookies::GrokCookies;
use crate::datatypes::api::user_id::UserId;

/// Includes the cookies and all the magic other bits needed to call the API.
#[derive(Clone)]
pub struct GrokFullCredentials {
  /// Entire cookie payload
  pub cookies: GrokCookies,
  
  /// Secrets from `index.html` and the xsid javascript.
  /// Required for video generation.
  pub client_secrets: GrokClientSecrets,
}

impl GrokFullCredentials {
  pub fn from_cookies_and_client_secrets(
    cookies: GrokCookies, 
    client_secrets: GrokClientSecrets
  ) -> Self {
    Self {
      cookies,
      client_secrets,
    }
  }
  
  pub fn get_user_id_ref(&self) -> &UserId {
    &self.client_secrets.user_id
  }
}
