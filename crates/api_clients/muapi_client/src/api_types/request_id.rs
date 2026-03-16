/// ID for a prediction request in the Muapi API.
#[derive(Clone, Debug)]
pub struct RequestId(String);

impl RequestId {
  
  pub fn new(value: String) -> Self {
    RequestId(value)
  }
  
  pub fn from_str(value: &str) -> Self {
    RequestId(value.to_string())
  }

  pub fn as_str(&self) -> &str {
    &self.0
  }
}

impl std::fmt::Display for RequestId {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(f, "{}", self.0)
  }
}
