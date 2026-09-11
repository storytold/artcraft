use cloudflare_errors::cloudflare_error::CloudflareError;
use errors::AnyhowError;
use reqwest::StatusCode;
use std::error::Error;
use std::fmt::{Display, Formatter};
use std::io;

#[derive(Debug)]
pub enum ApiError {
  /// 400. The request was invalid.
  InvalidRequest(String),

  /// 401. The request was not authorized.
  Unauthorized(String),
  
  // 402. Payment required.
  PaymentRequired(String),

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

  /// An uncategorized bad HTTP response with status code and body.
  UncategorizedBadResponseWithStatusAndBody {
    status_code: StatusCode,
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

  /// Uncategorized reqwest error.
  OtherReqwestError(reqwest::Error),
  
  /// An error doing file I/O (on our side)
  IoError(io::Error),

  /// Another type of error.
  Other(AnyhowError),
}

impl Error for ApiError {}

impl Display for ApiError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      // Server response code errors
      ApiError::InvalidRequest(msg) => write!(f, "Invalid request: {}", msg),
      ApiError::PaymentRequired(msg) => write!(f, "Payment required: {}", msg),
      ApiError::Unauthorized(msg) => write!(f, "Unauthorized: {}", msg),
      ApiError::Forbidden(msg) => write!(f, "Forbidden: {}", msg),
      ApiError::NotFound(msg) => write!(f, "Not found: {}", msg),
      ApiError::TooManyRequests(msg) => write!(f, "Too many requests to Storyteller backend: {}", msg),
      ApiError::InternalServerError {body, backend_hostname} => 
        write!(f, "Internal Server Error; backend hostname: {:?} ; body: {}; ", backend_hostname, body),
      ApiError::UncategorizedBadResponseWithStatusAndBody { status_code, body } => 
        write!(f, "Uncategorized bad response with status code {} and body: {}", status_code, body),
      // Server response handling errors
      ApiError::DeserializationError(error) => write!(f, "Deserialization error: {}", error),
      // Network errors
      ApiError::Timeout(msg) => write!(f, "Timeout: {}", msg),
      ApiError::NetworkError(msg) => write!(f, "Network error: {}", msg),
      // Cloudflare errors
      ApiError::CloudflareError(error) => write!(f, "Cloudflare Error: {}", error),
      // I/O errors
      ApiError::IoError(error) => write!(f, "IO error: {}", error),
      // Other
      ApiError::OtherReqwestError(error) => write!(f, "Reqwest error: {}", error),
      ApiError::Other(error) => write!(f, "Other error: {}", error),
    }
  }
}

impl From<reqwest::Error> for ApiError {
  fn from(error: reqwest::Error) -> Self {
    if let Some(status) = error.status() {
      let status = status.as_u16();
      match status {
        402 => return ApiError::PaymentRequired(error.to_string()),
        _ => {} // NB: Fallthrough.
      }
    }
    if error.is_timeout() {
      ApiError::Timeout(error.to_string())
    } else if error.is_connect() {
      ApiError::NetworkError(error.to_string())
    } else {
      ApiError::OtherReqwestError(error)
    }
  }
}

impl From<serde_json::Error> for ApiError {
  fn from(error: serde_json::Error) -> Self {
    ApiError::DeserializationError(error)
  }
}

impl From<io::Error> for ApiError {
  fn from(error: io::Error) -> Self {
    ApiError::IoError(error)
  }
}

impl From<CloudflareError> for ApiError {
  fn from(error: CloudflareError) -> Self {
    ApiError::CloudflareError(error)
  }
}
