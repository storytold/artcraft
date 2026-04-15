use std::error::Error;
use std::fmt::{Display, Formatter};

#[derive(Debug)]
pub enum WorldLabsSpecificApiError {
  /// There aren't sufficient funds for generation.
  InsufficientCredits,

  /// The content was rejected by WorldLabs' NSFW / content policy filter.
  NsfwContentPolicyRejected {
    message: Option<String>,
  },
}

impl WorldLabsSpecificApiError {
  pub fn is_403_forbidden(&self) -> bool {
    match self {
      Self::NsfwContentPolicyRejected { .. } => true,
      _ => false,
    }
  }
}

impl Error for WorldLabsSpecificApiError {}

impl Display for WorldLabsSpecificApiError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::InsufficientCredits => write!(f, "Insufficient credits"),
      Self::NsfwContentPolicyRejected { message } => {
        write!(f, "NSFW content policy rejection")?;
        if let Some(msg) = message {
          write!(f, ": {}", msg)?;
        }
        Ok(())
      }
    }
  }
}
