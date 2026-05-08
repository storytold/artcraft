use std::error::Error;
use std::fmt::{Display, Formatter};

/// Well-known API errors from the Beeble service.
#[derive(Debug)]
pub enum BeebleSpecificApiError {
  /// 401 Unauthorized — invalid or missing API key.
  Unauthorized,

  /// 402 Payment Required — insufficient credits.
  InsufficientCredits,

  /// 409 Conflict — idempotency key reused with different parameters.
  IdempotencyConflict,

  /// 429 Too Many Requests — rate limit exceeded.
  RateLimited,

  /// The generation job failed with a reported error message.
  GenerationFailed(String),
}

impl Error for BeebleSpecificApiError {}

impl Display for BeebleSpecificApiError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::Unauthorized => write!(f, "Beeble API: Unauthorized (invalid or missing API key)"),
      Self::InsufficientCredits => write!(f, "Beeble API: Insufficient credits"),
      Self::IdempotencyConflict => write!(f, "Beeble API: Idempotency conflict"),
      Self::RateLimited => write!(f, "Beeble API: Rate limited"),
      Self::GenerationFailed(msg) => write!(f, "Beeble API: Generation failed: {}", msg),
    }
  }
}
