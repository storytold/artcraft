use std::error::Error;
use std::fmt::{Display, Formatter};

/// Well-known, classifiable error responses from the xAI Imagine API.
///
/// Distinguishes things like "your key is bad" from generic 5xx so callers can
/// react appropriately (retry vs. surface to user vs. alert).
#[derive(Debug)]
pub enum GrokSpecificApiError {
  /// 401 Unauthorized — API key is missing, invalid, or revoked.
  Unauthorized,

  /// 402 Payment Required / insufficient credits to fulfill the request.
  InsufficientCredits,

  /// 403 Forbidden — the API key is valid but lacks permission for this resource/model.
  Forbidden,

  /// 404 Not Found — typically returned for an unknown `request_id` on the
  /// video status endpoint.
  NotFound,

  /// 429 Too Many Requests — rate limit exceeded.
  RateLimited,

  /// The prompt was rejected by xAI's content moderation.
  PromptModerated(String),

  /// 400 Bad Request — the request body shape was invalid (e.g. missing
  /// required field, unsupported model, invalid aspect ratio).
  BadRequest(String),
}

impl Error for GrokSpecificApiError {}

impl Display for GrokSpecificApiError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::Unauthorized => write!(f, "Grok API: Unauthorized (invalid or missing API key)"),
      Self::InsufficientCredits => write!(f, "Grok API: Insufficient credits"),
      Self::Forbidden => write!(f, "Grok API: Forbidden"),
      Self::NotFound => write!(f, "Grok API: Not found"),
      Self::RateLimited => write!(f, "Grok API: Rate limited"),
      Self::PromptModerated(msg) => write!(f, "Grok API: Prompt moderated: {}", msg),
      Self::BadRequest(msg) => write!(f, "Grok API: Bad request: {}", msg),
    }
  }
}
