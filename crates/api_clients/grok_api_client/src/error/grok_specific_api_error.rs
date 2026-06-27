use std::error::Error;
use std::fmt::{Display, Formatter};

/// Well-known, classifiable error responses from the xAI Imagine API.
///
/// Distinguishes things like "your key is bad" from generic 5xx so callers can
/// react appropriately (retry vs. surface to user vs. alert).
///
/// Every variant carries the raw HTTP response body (`raw_http_body`) when one
/// was available, so downstream logging, alerting, and pages have the full
/// upstream context — not just our classification. It's `None` for errors we
/// raise client-side before making the HTTP call (e.g. pre-flight validation).
#[derive(Debug)]
pub enum GrokSpecificApiError {
  /// 401 Unauthorized — API key is missing, invalid, or revoked.
  Unauthorized {
    raw_http_body: Option<String>,
  },

  /// 402 Payment Required / insufficient credits to fulfill the request.
  InsufficientCredits {
    raw_http_body: Option<String>,
  },

  /// 403 Forbidden — the API key is valid but lacks permission for this
  /// resource/model (also covers team-level "out of credits / over spending
  /// limit" responses, which xAI returns as 403 `permission-denied`).
  Forbidden {
    raw_http_body: Option<String>,
  },

  /// 404 Not Found — typically returned for an unknown `request_id` on the
  /// video status endpoint.
  NotFound {
    raw_http_body: Option<String>,
  },

  /// 429 Too Many Requests — rate limit exceeded.
  RateLimited {
    raw_http_body: Option<String>,
  },

  /// The prompt was rejected by xAI's content moderation.
  PromptModerated {
    /// The reason we parsed out of the response (e.g. the `error.message`).
    reason: String,
    /// The raw HTTP response body.
    raw_http_body: Option<String>,
  },

  /// 400 Bad Request — the request body shape was invalid (e.g. missing
  /// required field, unsupported model, invalid aspect ratio).
  BadRequest {
    /// The reason we parsed out of the response (or the raw body when it
    /// wasn't parseable). For client-side pre-flight failures, the message
    /// we generated.
    reason: String,
    /// The raw HTTP response body. `None` for client-side pre-flight failures.
    raw_http_body: Option<String>,
  },
}

impl Error for GrokSpecificApiError {}

impl Display for GrokSpecificApiError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::Unauthorized { raw_http_body } => {
        write!(f, "Grok API: Unauthorized (invalid or missing API key){}", fmt_raw_body(raw_http_body))
      }
      Self::InsufficientCredits { raw_http_body } => {
        write!(f, "Grok API: Insufficient credits{}", fmt_raw_body(raw_http_body))
      }
      Self::Forbidden { raw_http_body } => {
        write!(f, "Grok API: Forbidden{}", fmt_raw_body(raw_http_body))
      }
      Self::NotFound { raw_http_body } => {
        write!(f, "Grok API: Not found{}", fmt_raw_body(raw_http_body))
      }
      Self::RateLimited { raw_http_body } => {
        write!(f, "Grok API: Rate limited{}", fmt_raw_body(raw_http_body))
      }
      Self::PromptModerated { reason, raw_http_body } => {
        write!(f, "Grok API: Prompt moderated: {}{}", reason, fmt_raw_body(raw_http_body))
      }
      Self::BadRequest { reason, raw_http_body } => {
        write!(f, "Grok API: Bad request: {}{}", reason, fmt_raw_body(raw_http_body))
      }
    }
  }
}

/// Append the raw HTTP body to a `Display` message when one is present, so
/// `{}`-formatted logs/pages carry the upstream context. Empty when absent.
fn fmt_raw_body(raw_http_body: &Option<String>) -> String {
  match raw_http_body {
    Some(body) if !body.is_empty() => format!(" [raw http body: {}]", body),
    _ => String::new(),
  }
}
