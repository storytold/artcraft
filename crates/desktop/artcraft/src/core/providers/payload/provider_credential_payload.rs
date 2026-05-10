use crate::core::providers::payload::api_key::ApiKeyData;
use crate::core::providers::payload::web_login::WebLoginData;

pub enum ProviderCredentialPayload {
  ApiKey(ApiKeyData),
  // TODO: There might be logins in the future that use weird header states, etc.
  WebLogin (WebLoginData),
}
