/// An API key is the credential required to interact with the Muapi API.

#[derive(Clone)]
pub struct MuapiApiKey {
  api_key: String,
}

impl MuapiApiKey {
  pub fn new(api_key: String) -> Self {
    MuapiApiKey { api_key }
  }

  pub fn as_str(&self) -> &str {
    &self.api_key
  }

  pub fn to_string(&self) -> String {
    self.api_key.clone()
  }
}
