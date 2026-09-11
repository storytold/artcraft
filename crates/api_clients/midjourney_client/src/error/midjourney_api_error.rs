use cloudflare_errors::cloudflare_error::CloudflareError;
use errors::AnyhowError;
use std::error::Error;
use std::fmt::{Display, Formatter};
use std::io;

#[derive(Debug)]
pub enum MidjourneyApiError {
  /// There was no user ID in an otherwise valid-looking response.
  NoUserId,

  /// No user props in index HTML payload.
  /// We need this for the user ID and the websocket token.
  NoUserProps,

  /// No initialAuthUser in the index HTML payload.
  /// We need this for the user ID and the websocket token.
  NoInitialAuthUser,

  /// 400. The request was invalid.
  InvalidRequest(String),

  /// 401. The request was not authorized.
  Unauthorized(String),

  /// 403. The request was forbidden.
  Forbidden(String),

  /// 404. The requested resource was not found.
  NotFound(String),

  /// 429. Too many requests.
  TooManyRequests(String),

  /// 500. An internal server error occurred.
  InternalServerError {
    body: String,
    backend_hostname: Option<String>,
  },

  /// Eg. when downloading images
  UnknownHttpFailure {
    status_code: u16,
    body: String,
  },

  /// Cloudflare errors.
  CloudflareError(CloudflareError),

  /// A deserialization error with the response.
  DeserializationError(serde_json::Error),

  /// The request timed out.
  Timeout(String),

  /// A network error occurred.
  NetworkError(String),

  /// An error doing file I/O (on our side)
  IoError(io::Error),

  /// Another type of error.
  Other(AnyhowError),
}

impl Error for MidjourneyApiError {}

impl Display for MidjourneyApiError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      // Response body errors
      Self::NoUserId => write!(f, "No user ID found in the response body."),
      Self::NoUserProps => write!(f, "No user properties found in the index HTML payload."),
      Self::NoInitialAuthUser => write!(f, "No initialAuthUser in the index HTML payload."),
      // Server response code errors
      Self::InvalidRequest(msg) => write!(f, "Invalid request: {}", msg),
      Self::Unauthorized(msg) => write!(f, "Unauthorized: {}", msg),
      Self::Forbidden(msg) => write!(f, "Forbidden: {}", msg),
      Self::NotFound(msg) => write!(f, "Not found: {}", msg),
      Self::TooManyRequests(msg) => write!(f, "Too many requests: {}", msg),
      Self::InternalServerError {body, backend_hostname} =>
        write!(f, "Internal Server Error; backend hostname: {:?} ; body: {}; ", backend_hostname, body),
      Self::UnknownHttpFailure {status_code, body} =>
        write!(f, "Unknown HTTP failure; status code: {}; body: {}", status_code, body),
      // Deserialization errors
      // Server response handling errors
      Self::DeserializationError(error) => write!(f, "Deserialization error: {}", error),
      // Network errors
      Self::Timeout(msg) => write!(f, "Timeout: {}", msg),
      Self::NetworkError(msg) => write!(f, "Network error: {}", msg),
      // Cloudflare errors
      Self::CloudflareError(error) => write!(f, "Cloudflare Error: {}", error),
      // I/O errors
      Self::IoError(error) => write!(f, "IO error: {}", error),
      // Other
      Self::Other(error) => write!(f, "Other error: {}", error),
    }
  }
}

impl From<serde_json::Error> for MidjourneyApiError {
  fn from(error: serde_json::Error) -> Self {
    Self::DeserializationError(error)
  }
}

impl From<io::Error> for MidjourneyApiError {
  fn from(error: io::Error) -> Self {
    Self::IoError(error)
  }
}

impl From<CloudflareError> for MidjourneyApiError {
  fn from(error: CloudflareError) -> Self {
    Self::CloudflareError(error)
  }
}
