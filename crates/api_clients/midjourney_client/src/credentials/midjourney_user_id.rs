
/// The user ID used for several midjourney requests.
#[derive(Clone, Debug, Eq, PartialEq, Hash)]
pub struct MidjourneyUserId(pub String);

impl MidjourneyUserId {
  pub fn from_str(user_id: &str) -> Self {
    Self(user_id.to_string())
  }
  
  pub fn from_string(user_id: String) -> Self {
    Self(user_id)
  }

  pub fn as_str(&self) -> &str {
    &self.0
  }
  
  pub fn to_string(&self) -> String {
    self.0.to_string()
  }
}
