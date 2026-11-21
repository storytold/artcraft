use std::fmt::Display;
use serde_derive::{Deserialize, Serialize};

/// A strongly typed task ID for Sora tasks.
#[derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Debug, Serialize, Deserialize)]
pub struct TaskId(pub String);

impl TaskId {
  pub fn from_string(id: String) -> Self {
    Self(id)
  }

  pub fn from_str(id: &str) -> Self {
    Self(id.to_string())
  }

  pub fn new(id: String) -> Self {
    Self(id)
  }

  pub fn as_str(&self) -> &str {
    &self.0
  }
  
  pub fn to_string(&self) -> String {
    self.0.to_string()
  }
}

impl Display for TaskId {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    std::fmt::Display::fmt(&self.0, f)
  }
}
