use std::error::Error;
use std::fmt::{Display, Formatter};

use serde_derive::Deserialize;

/// Everything an OpenRouter request can fail with.
#[derive(Debug)]
pub enum OpenRouterError {
  /// 401: the key is wrong, disabled or deleted.
  InvalidApiKey(String),
  /// 402: the account is out of credits.
  InsufficientCredits(String),
  /// 429: too many requests.
  RateLimited(String),
  /// 400/403/404/413: OpenRouter or the model refused the request (bad options, moderation).
  Rejected { status: u16, message: String },
  /// 5xx: the model's provider failed (OpenRouter returns 502 and doesn't bill).
  Upstream { status: u16, message: String },
  /// The request never got an answer.
  Network(reqwest::Error),
  /// A successful answer that couldn't be read.
  BadResponse(String),
}

/// OpenRouter's error body: `{"error": {"code": 402, "message": "..."}}`.
#[derive(Deserialize)]
struct ErrorBody {
  error: ErrorDetail,
}

#[derive(Deserialize)]
struct ErrorDetail {
  message: String,
}

impl OpenRouterError {
  /// The error for a failed HTTP status; the message comes from the body when it has one.
  pub fn from_status(status: u16, body: &str) -> Self {
    let message = serde_json::from_str::<ErrorBody>(body)
      .map(|b| b.error.message)
      .unwrap_or_else(|_| body.chars().take(500).collect());
    match status {
      401 => Self::InvalidApiKey(message),
      402 => Self::InsufficientCredits(message),
      429 => Self::RateLimited(message),
      500..=599 => Self::Upstream { status, message },
      _ => Self::Rejected { status, message },
    }
  }

  /// Whether the user has to add credits at openrouter.ai before trying again.
  pub fn is_billing_error(&self) -> bool {
    matches!(self, Self::InsufficientCredits(_))
  }

  /// What a failed generation tells the user.
  pub fn user_message(&self) -> String {
    match self {
      Self::InvalidApiKey(message) => format!("OpenRouter rejected the API key: {message}"),
      Self::InsufficientCredits(message) => format!("OpenRouter account is out of credits: {message}"),
      Self::RateLimited(message) => format!("OpenRouter rate limit: {message}"),
      Self::Rejected { status, message } => format!("OpenRouter refused the request ({status}): {message}"),
      Self::Upstream { status, message } => format!("OpenRouter's model provider failed ({status}): {message}"),
      Self::Network(err) => format!("Couldn't reach OpenRouter: {err}"),
      Self::BadResponse(message) => format!("Unexpected OpenRouter response: {message}"),
    }
  }
}

impl Error for OpenRouterError {}

impl Display for OpenRouterError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    write!(f, "{:?}", self)
  }
}

impl From<reqwest::Error> for OpenRouterError {
  fn from(error: reqwest::Error) -> Self {
    Self::Network(error)
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn statuses_map_to_their_errors() {
    let body = r#"{"error":{"code":402,"message":"Insufficient credits"}}"#;
    let err = OpenRouterError::from_status(402, body);
    assert!(matches!(&err, OpenRouterError::InsufficientCredits(m) if m == "Insufficient credits"));
    assert!(err.is_billing_error());
    assert!(matches!(OpenRouterError::from_status(401, "{}"), OpenRouterError::InvalidApiKey(_)));
    assert!(matches!(OpenRouterError::from_status(429, ""), OpenRouterError::RateLimited(_)));
    assert!(matches!(OpenRouterError::from_status(502, ""), OpenRouterError::Upstream { status: 502, .. }));
    let rejected = OpenRouterError::from_status(400, "plain text");
    assert!(matches!(&rejected, OpenRouterError::Rejected { status: 400, message } if message == "plain text"));
    assert!(!rejected.is_billing_error());
  }

  #[test]
  fn user_messages_explain_the_failure() {
    assert_eq!(OpenRouterError::InvalidApiKey("bad".into()).user_message(), "OpenRouter rejected the API key: bad");
    assert_eq!(OpenRouterError::InsufficientCredits("none".into()).user_message(), "OpenRouter account is out of credits: none");
    assert_eq!(OpenRouterError::RateLimited("slow".into()).user_message(), "OpenRouter rate limit: slow");
    assert_eq!(OpenRouterError::from_status(400, "big").user_message(), "OpenRouter refused the request (400): big");
    assert_eq!(OpenRouterError::from_status(502, "down").user_message(), "OpenRouter's model provider failed (502): down");
    assert_eq!(OpenRouterError::BadResponse("empty".into()).user_message(), "Unexpected OpenRouter response: empty");
    assert_eq!(OpenRouterError::BadResponse("empty".into()).to_string(), r#"BadResponse("empty")"#, "Display is for logs");
  }
}
