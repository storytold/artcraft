/// Strongly-typed World ID
#[derive(Clone, Debug)]
pub struct WorldId(pub String);

impl WorldId {
  pub fn from_str(s: &str) -> Self {
    Self(s.to_string())
  }

  pub fn as_str(&self) -> &str {
    &self.0
  }
}
