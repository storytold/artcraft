use cloudflare_errors::cloudflare_error::CloudflareError;
use std::error::Error;
use std::fmt::{Display, Formatter};
use wreq::StatusCode;

#[derive(Debug)]
pub enum WorldLabsGenericApiError {
  /// Unknown error occurred when uploading to Google GCP
  GoogleUploadFailed {
    status_code: StatusCode,
    body: String,
  },

  /// Specific Cloudflare errors.
  CloudflareError(CloudflareError),

  /// The downloaded index.html did not include the expected data.
  /// This is necessary for handshakes between client and server.
  IndexHtmlDidNotIncludeExpectedData {
    message: String,
  },

  /// The downloaded javascript did not include the expected data.
  /// This is necessary for handshakes between client and server.
  ScriptBodyDidNotIncludeExpectedData {
    message: String,
  },

  /// Error creating the websocket due to 401 Unauthorized, likely an authentication error with Grok.
  /// Unfortunately we can't read the response body text to diagnose more because wreq has some API design issues.
  LikelyWebsocketAuthentication401,

  /// We received a 403 on websocket upgrade, likely from Cloudflare.
  /// Unfortunately we can't read the response body text to diagnose more because wreq has some API design issues.
  LikelyWebsocketCloudflare403,

  /// Unknown status code on websocket upgrade.
  UnexpectedWebsocketUpgradeStatusCode(StatusCode),

  /// serde_json::Error, likely from JSON deserialization schema mismatch.
  /// Includes the original body.
  SerdeResponseParseErrorWithBody(serde_json::Error, String),

  /// serde_json::Error, likely from JSON deserialization schema mismatch.
  /// Includes the original body.
  /// Specifically, this is for non-200 (error) responses.
  SerdeParseErrorWithBodyOnNon200(serde_json::Error, String),

  /// An uncategorized bad HTTP response from Grok.
  UncategorizedBadResponseWithStatus(StatusCode),
  
  /// An uncategorized bad HTTP response from Grok.
  UncategorizedBadResponseWithStatusAndBody {
    status_code: StatusCode,
    body: String,
  },
  
  /// Our previous upload failed
  UploadFailed,

  /// An error upgrading the connection to a websocket.
  WreqWebsocketUpgradeError(wreq::Error),

  /// An uncaught error from the API client.
  WreqError(wreq::Error),
}

impl Error for WorldLabsGenericApiError {}

impl Display for WorldLabsGenericApiError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::GoogleUploadFailed { status_code, body } => write!(f, "Google world upload failed with HTTP {}: {:?}", status_code, body),
      Self::CloudflareError(err) => write!(f, "Cloudflare error: {}", err),
      Self::IndexHtmlDidNotIncludeExpectedData { message } => write!(f, "IndexHtmlDidNotIncludeExpectedData ( message: {} )", message),
      Self::ScriptBodyDidNotIncludeExpectedData { message } => write!(f, "ScriptBodyDidNotIncludeExpectedData ( message: {} )", message),
      Self::LikelyWebsocketAuthentication401 => write!(f, "Likely websocket authentication 401 error (probably Grok authentication issue with cookies)"),
      Self::LikelyWebsocketCloudflare403 => write!(f, "Likely Cloudflare 403 error on websocket upgrade"),
      Self::UnexpectedWebsocketUpgradeStatusCode(status) => write!(f, "Unexpected websocket upgrade status code: {}", status),
      Self::SerdeResponseParseErrorWithBody(err, body) => write!(f, "Failed to parse response body: {:?}. Body: {}", err, body),
      Self::SerdeParseErrorWithBodyOnNon200(err, body) => write!(f, "Failed to parse non-200 response body: {:?}. Body: {}", err, body),
      Self::UncategorizedBadResponseWithStatus(status) => write!(f, "Uncategorized with status code: {}", status),
      Self::UncategorizedBadResponseWithStatusAndBody { status_code, body } => write!(f, "Uncategorized bad response: status code {}, body: {}", status_code, body),
      Self::UploadFailed => write!(f, "Upload failed"),
      Self::WreqWebsocketUpgradeError(err) => write!(f, "Websocket upgrade error: {}", err),
      Self::WreqError(err) => write!(f, "Wreq client error: {}", err),
    }
  }
}
