use crate::core::providers::credentials::payload::api_key::ApiKeyData;
use crate::core::providers::credentials::payload::web_login::WebLoginData;

#[derive(Clone)]
pub enum ProviderCredentialPayload {
  ApiKey(ApiKeyData),
  
  // TODO: There might be logins in the future that use weird header states, etc.
  WebLogin(WebLoginData),
}
