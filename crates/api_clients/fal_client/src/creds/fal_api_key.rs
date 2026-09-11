
#[derive(Clone)]
pub struct FalApiKey(pub String);

impl FalApiKey {
  pub fn new(api_key: String) -> Self {
    Self(api_key)
  }
  
  pub fn from_str(api_key: &str) -> Self {
    let api_key = api_key.trim().to_string();
    Self(api_key)
  }
}
