
/// Type for User IDs.
/// User IDs are UUIDs.
#[derive(Clone, Debug)]
pub struct UserId(pub String);

impl UserId {
  pub fn to_string(&self) -> String {
    self.0.clone()
  }
}

