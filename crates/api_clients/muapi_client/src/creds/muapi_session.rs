use crate::creds::muapi_api_key::MuapiApiKey;

/// Holds the full session data needed to make authenticated requests to Muapi.
#[derive(Clone)]
pub struct MuapiSession {
  pub api_key: MuapiApiKey,
}

impl MuapiSession {
  pub fn new(api_key: MuapiApiKey) -> Self {
    MuapiSession { api_key }
  }

  pub fn from_api_key_string(api_key: String) -> Self {
    MuapiSession {
      api_key: MuapiApiKey::new(api_key),
    }
  }
}
