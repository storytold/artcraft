use cloudflare_errors::cloudflare_error::CloudflareError;
use std::error::Error;
use std::fmt::{Display, Formatter};
use wreq::StatusCode;

#[derive(Debug)]
pub enum SoraGenericApiError {
  /// Specific Cloudflare errors.
  CloudflareError(CloudflareError),

  /// HTTP 502 Bad Gateway
  /// Sora is having issues.
  /// Typically served from Cloudflare
  /// We preserve the message for debugging.
  Http502ErrorBadGateway(String),

  /// serde_json::Error, likely from JSON deserialization schema mismatch.
  /// Includes the original body.
  SerdeResponseParseErrorWithBody(serde_json::Error, String),

  /// serde_json::Error, likely from JSON deserialization schema mismatch.
  /// Includes the original body.
  /// Specifically, this is for non-200 (error) responses.
  SerdeParseErrorWithBodyOnNon200(serde_json::Error, String),

  /// Another error occurred.
  /// TODO: Try to get rid of this.
  UncategorizedBadResponse(String),

  /// An uncategorized bad HTTP response from Sora.
  UncategorizedBadResponseWithStatusAndBody {
    status_code: StatusCode,
    body: String,
  },

  /// An uncaught error from the API client.
  WreqError(wreq::Error),
}

impl Error for SoraGenericApiError {}

impl Display for SoraGenericApiError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::CloudflareError(err) => write!(f, "Cloudflare error: {}", err),
      Self::Http502ErrorBadGateway(msg) => write!(f, "HTTP 502 Bad Gateway: {}", msg),
      Self::SerdeResponseParseErrorWithBody(err, body) => write!(f, "Failed to parse response body: {:?}. Body: {}", err, body),
      Self::SerdeParseErrorWithBodyOnNon200(err, body) => write!(f, "Failed to parse non-200 response body: {:?}. Body: {}", err, body),
      Self::UncategorizedBadResponseWithStatusAndBody { status_code, body } => write!(f, "Uncategorized bad response: status code {}, body: {}", status_code, body),
      Self::UncategorizedBadResponse(msg) => write!(f, "Uncategorized bad response status: {}", msg),
      Self::WreqError(err) => write!(f, "Wreq client error: {}", err),
    }
  }
}
