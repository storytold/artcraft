use std::fmt::{Display, Formatter};
use std::sync::Arc;

use crate::http_server::session::session_checker_error::SessionCheckerError;
use crate::http_server::web_utils::user_session::require_user_session::RequireUserSessionError;
use actix_artcraft::sessions::anonymous_visitor_tracking::avt_cookie_payload_error::AvtCookiePayloadError;
use actix_artcraft::sessions::user_sessions::http_user_session_payload_error::HttpUserSessionPayloadError;
use actix_http::StatusCode;
use actix_web::{HttpResponse, HttpResponseBuilder, ResponseError};
use anyhow::anyhow;
use mysql_queries::errors::mysql_error::{MysqlCrateErrorSubtype, MysqlError};

/// An error type for actix-web handlers that wraps causal errors for debugging
/// and paging while presenting safe, generic HTTP responses to users.
///
/// ## Usage
///
/// ```ignore
/// pub async fn my_handler(...) -> Result<Json<MyResponse>, CommonWebError> {
///   // sqlx errors, anyhow errors, session errors — all convert via ?
///   let user = require_user_session_using_connection(&req, ...)?;
///   let data = some_db_query(&pool).await?;
///
///   if data.is_none() {
///     return Err(CommonWebError::NotFound);
///   }
///
///   Ok(Json(MyResponse { data }))
/// }
/// ```
///
/// Errors converted via `From<T>` become `UncaughtServerError` (always 500).
/// The wrapped cause is never shown to users but is available to the error
/// alerting middleware for paging and logging.
#[derive(Clone)]
pub enum CommonWebError {
  /// 400 Bad Request with a user-facing message.
  BadInputWithSimpleMessage(String),

  /// 401 Unauthorized.
  NotAuthorized,

  /// 404 Not Found.
  NotFound,

  /// 402 Payment Required.
  PaymentRequired,

  /// 403 Forbidden.
  Forbidden,

  /// 403 Forbidden — content was rejected by a content policy filter (e.g. NSFW).
  ContentPolicyRejected,

  /// 403 Forbidden — content was rejected, with a user-facing message.
  ContentPolicyRejectedWithMessage(String),

  /// Uncaught errors are always 500 Internal Server Error.
  /// The user will never see the error cause or message, but our
  /// middleware will handle alerting, logging, etc.
  ///
  /// Stored in `Arc` so the error alerting middleware can clone it for paging
  /// without consuming the original.
  UncaughtServerError(Arc<dyn std::error::Error + Send + Sync + 'static>),

  /// Same as above, with a specified extra message string
  UncaughtServerErrorWithInternalMessage {
    internal_message: String,
    error: Arc<dyn std::error::Error + Send + Sync + 'static>
  }
}

// =============== Public accessors ===============

impl CommonWebError {
  /// Wrap any error as an `UncaughtServerError`.
  pub fn from_error(error: impl std::error::Error + Send + Sync + 'static) -> Self {
    Self::UncaughtServerError(Arc::new(error))
  }

  pub fn from_error_with_message(message: String, error: impl std::error::Error + Send + Sync + 'static) -> Self {
    Self::UncaughtServerErrorWithInternalMessage {
      internal_message: message,
      error: Arc::new(error)
    }
  }

  /// Wrap an `anyhow::Error` as an `UncaughtServerError`.
  /// (`anyhow::Error` doesn't implement `std::error::Error`, so `from_error` can't accept it.)
  pub fn from_anyhow_error(error: anyhow::Error) -> Self {
    let boxed: Box<dyn std::error::Error + Send + Sync> = error.into();
    Self::UncaughtServerError(Arc::from(boxed))
  }

  pub fn server_error_with_message(msg: &str) -> Self {
    Self::from_anyhow_error(anyhow!("ServerErrorWithMessage: {:?}", msg))
  }

  /// Extract the wrapped causal error (only present for `UncaughtServerError`).
  pub fn cause(&self) -> Option<&(dyn std::error::Error + Send + Sync + 'static)> {
    match self {
      Self::UncaughtServerError(err) => Some(err.as_ref()),
      Self::UncaughtServerErrorWithInternalMessage { error, .. } => Some(error.as_ref()),
      _ => None,
    }
  }

  /// Clone the wrapped causal error as an `Arc` (only present for `UncaughtServerError`).
  /// Useful for passing the error to the pager system without consuming the original.
  pub fn clone_cause_arc(&self) -> Option<Arc<dyn std::error::Error + Send + Sync + 'static>> {
    match self {
      Self::UncaughtServerError(err) => Some(Arc::clone(err)),
      Self::UncaughtServerErrorWithInternalMessage { error, .. } => Some(Arc::clone(error)),
      _ => None,
    }
  }

  /// Whether this is a server error (500).
  pub fn is_server_error(&self) -> bool {
    match self {
      Self::UncaughtServerError(_) => true,
      Self::UncaughtServerErrorWithInternalMessage { .. } => true,
      _ => false,
    }
  }
}

// =============== Display / Debug / Error ===============

impl Display for CommonWebError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::BadInputWithSimpleMessage(msg) => write!(f, "Bad input: {}", msg),
      Self::NotAuthorized => write!(f, "Not authorized"),
      Self::NotFound => write!(f, "Not found"),
      Self::PaymentRequired => write!(f, "Payment required"),
      Self::Forbidden => write!(f, "Forbidden"),
      Self::ContentPolicyRejected => write!(f, "Content policy rejected"),
      Self::ContentPolicyRejectedWithMessage(msg) => write!(f, "Content policy rejected: {}", msg),
      Self::UncaughtServerError(err) => write!(f, "Server error: {}", err),
      Self::UncaughtServerErrorWithInternalMessage { internal_message, error } => {
        write!(f, "Server error: {}: {}", internal_message, error)
      }
    }
  }
}

impl std::fmt::Debug for CommonWebError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::BadInputWithSimpleMessage(msg) => write!(f, "BadInputWithSimpleMessage({:?})", msg),
      Self::NotAuthorized => write!(f, "NotAuthorized"),
      Self::NotFound => write!(f, "NotFound"),
      Self::PaymentRequired => write!(f, "PaymentRequired"),
      Self::Forbidden => write!(f, "Forbidden"),
      Self::ContentPolicyRejected => write!(f, "ContentPolicyRejected"),
      Self::ContentPolicyRejectedWithMessage(msg) => write!(f, "ContentPolicyRejectedWithMessage({:?})", msg),
      Self::UncaughtServerError(err) => write!(f, "UncaughtServerError({:?})", err),
      Self::UncaughtServerErrorWithInternalMessage { internal_message, error } => {
        write!(f, "UncaughtServerErrorWithInternalMessage({:?}, {:?})", internal_message, error)
      }
    }
  }
}

impl std::error::Error for CommonWebError {
  fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
    match self {
      Self::UncaughtServerError(err) => Some(err.as_ref()),
      Self::UncaughtServerErrorWithInternalMessage { error, .. } => Some(error.as_ref()),
      _ => None,
    }
  }
}

// =============== Actix ResponseError ===============

impl ResponseError for CommonWebError {
  fn status_code(&self) -> StatusCode {
    match self {
      Self::BadInputWithSimpleMessage(_) => StatusCode::BAD_REQUEST,
      Self::NotAuthorized => StatusCode::UNAUTHORIZED,
      Self::NotFound => StatusCode::NOT_FOUND,
      Self::PaymentRequired => StatusCode::PAYMENT_REQUIRED,
      Self::Forbidden => StatusCode::FORBIDDEN,
      Self::ContentPolicyRejected => StatusCode::FORBIDDEN,
      Self::ContentPolicyRejectedWithMessage(_) => StatusCode::FORBIDDEN,
      Self::UncaughtServerError(_) => StatusCode::INTERNAL_SERVER_ERROR,
      Self::UncaughtServerErrorWithInternalMessage { .. } => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let status = self.status_code();

    match self {
      Self::BadInputWithSimpleMessage(msg) => {
        HttpResponse::BadRequest()
            .json(JsonErrorWithMessage {
              success: false,
              error_code: status.as_u16(),
              error_code_str: status.canonical_reason(),
              message: msg,
            })
      }
      Self::ContentPolicyRejected => {
        HttpResponseBuilder::new(status)
            .json(JsonErrorWithMessage {
              success: false,
              error_code: status.as_u16(),
              error_code_str: status.canonical_reason(),
              message: "Content rejected by policy",
            })
      }
      Self::ContentPolicyRejectedWithMessage(msg) => {
        HttpResponseBuilder::new(status)
            .json(JsonErrorWithMessage {
              success: false,
              error_code: status.as_u16(),
              error_code_str: status.canonical_reason(),
              message: msg,
            })
      }
      _ => {
        HttpResponseBuilder::new(status)
            .json(JsonErrorWithoutMessage {
              success: false,
              error_code: status.as_u16(),
              error_code_str: status.canonical_reason(),
            })
      }
    }
  }
}

// =============== From impls (automatic ? conversion) ===============

impl From<sqlx::Error> for CommonWebError {
  fn from(err: sqlx::Error) -> Self {
    Self::from_error(err)
  }
}

impl<T> From<MysqlError<T>> for CommonWebError
where
  T: MysqlCrateErrorSubtype + Send + Sync + 'static,
{
  fn from(err: MysqlError<T>) -> Self {
    Self::from_error(err)
  }
}

impl From<anyhow::Error> for CommonWebError {
  fn from(err: anyhow::Error) -> Self {
    // anyhow::Error doesn't impl std::error::Error, so we go through Box -> Arc.
    let boxed: Box<dyn std::error::Error + Send + Sync> = err.into();
    Self::UncaughtServerError(Arc::from(boxed))
  }
}

impl From<serde_json::Error> for CommonWebError {
  fn from(err: serde_json::Error) -> Self {
    Self::from_error(err)
  }
}

impl From<RequireUserSessionError> for CommonWebError {
  fn from(value: RequireUserSessionError) -> Self {
    match value {
      RequireUserSessionError::NotAuthorized => Self::NotAuthorized,
      RequireUserSessionError::ServerError => Self::from_error(value),
    }
  }
}

impl From<HttpUserSessionPayloadError> for CommonWebError {
  fn from(err: HttpUserSessionPayloadError) -> Self {
    if err.is_server_error() {
      Self::from_error(err)
    } else {
      Self::BadInputWithSimpleMessage("invalid session".to_string())
    }
  }
}

impl From<AvtCookiePayloadError> for CommonWebError {
  fn from(err: AvtCookiePayloadError) -> Self {
    if err.is_server_error() {
      Self::from_error(err)
    } else {
      Self::BadInputWithSimpleMessage("invalid AVT cookie".to_string())
    }
  }
}

impl From<SessionCheckerError> for CommonWebError {
  fn from(value: SessionCheckerError) -> Self {
    match value {
      // Bad / forged session cookie → 401 (don't page on this)
      // NOTE: If there's an elevated rate of across-the-board 401s,
      // then we probably misconfigured the HMAC secret
      SessionCheckerError::SessionPayload(_) => Self::NotAuthorized,
      // Underlying DB / cache errors → 500 with paging
      SessionCheckerError::Sqlx(err) => Self::from_error(err),
      // Likely Redis caching middleware
      SessionCheckerError::OtherError(err) => Self::from_anyhow_error(err),
    }
  }
}

// =============== Serialization helpers (private) ===============

#[derive(Debug, Serialize)]
struct JsonErrorWithoutMessage {
  success: bool,
  error_code: u16,
  error_code_str: Option<&'static str>,
}

#[derive(Debug, Serialize)]
struct JsonErrorWithMessage<'a> {
  success: bool,
  error_code: u16,
  error_code_str: Option<&'static str>,
  message: &'a str,
}

// =============== OpenAPI schema ===============

impl utoipa::PartialSchema for CommonWebError {
  fn schema() -> utoipa::openapi::RefOr<utoipa::openapi::Schema> {
    utoipa::openapi::ObjectBuilder::new()
        .property(
          "success",
          utoipa::openapi::ObjectBuilder::new()
              .schema_type(utoipa::openapi::schema::Type::Boolean),
        )
        .required("success")
        .property(
          "error_code",
          utoipa::openapi::ObjectBuilder::new()
              .schema_type(utoipa::openapi::schema::Type::Integer)
              .format(Some(utoipa::openapi::SchemaFormat::KnownFormat(
                utoipa::openapi::KnownFormat::Int32,
              ))),
        )
        .required("error_code")
        .property(
          "error_code_str",
          utoipa::openapi::ObjectBuilder::new()
              .schema_type(utoipa::openapi::schema::Type::String),
        )
        .property(
          "message",
          utoipa::openapi::ObjectBuilder::new()
              .schema_type(utoipa::openapi::schema::Type::String)
              .description(Some("User-facing error message (present only for bad input errors)")),
        )
        .into()
  }
}

impl utoipa::ToSchema for CommonWebError {
  fn name() -> std::borrow::Cow<'static, str> {
    std::borrow::Cow::Borrowed("CommonWebError")
  }
}

// =============== Tests ===============

#[cfg(test)]
mod tests {
  use super::*;
  use actix_http::body::MessageBody;

  #[test]
  fn bad_input_returns_400_with_message() {
    let error = CommonWebError::BadInputWithSimpleMessage("name is required".to_string());
    assert_eq!(error.status_code(), StatusCode::BAD_REQUEST);
    assert!(!error.is_server_error());
    assert!(error.cause().is_none());

    let response = error.error_response();
    let bytes = response.into_body().try_into_bytes().unwrap();
    let body = String::from_utf8(bytes.to_vec()).unwrap();
    assert!(body.contains("\"message\":\"name is required\""));
    assert!(body.contains("\"error_code\":400"));
  }

  #[test]
  fn not_found_returns_404() {
    let error = CommonWebError::NotFound;
    assert_eq!(error.status_code(), StatusCode::NOT_FOUND);
    assert!(!error.is_server_error());
  }

  #[test]
  fn not_authorized_returns_401() {
    let error = CommonWebError::NotAuthorized;
    assert_eq!(error.status_code(), StatusCode::UNAUTHORIZED);
  }

  #[test]
  fn payment_required_returns_402() {
    let error = CommonWebError::PaymentRequired;
    assert_eq!(error.status_code(), StatusCode::PAYMENT_REQUIRED);
  }

  #[test]
  fn uncaught_io_error_returns_500_and_hides_cause() {
    let io_err = std::io::Error::new(std::io::ErrorKind::Other, "disk exploded");
    let error = CommonWebError::from_error(io_err);

    assert_eq!(error.status_code(), StatusCode::INTERNAL_SERVER_ERROR);
    assert!(error.is_server_error());

    // Cause is accessible for middleware
    let cause = error.cause().unwrap();
    assert_eq!(format!("{}", cause), "disk exploded");

    // But never shown to the user in the HTTP response
    let response = error.error_response();
    let bytes = response.into_body().try_into_bytes().unwrap();
    let body = String::from_utf8(bytes.to_vec()).unwrap();
    assert!(!body.contains("disk exploded"));
    assert!(body.contains("\"error_code\":500"));
  }

  #[test]
  fn anyhow_error_converts_to_500_via_from() {
    let error: CommonWebError = anyhow::anyhow!("something broke in the pipeline").into();
    assert_eq!(error.status_code(), StatusCode::INTERNAL_SERVER_ERROR);
    assert!(error.is_server_error());

    let cause = error.cause().unwrap();
    assert!(format!("{}", cause).contains("something broke in the pipeline"));
  }

  #[test]
  fn nested_anyhow_error_preserves_context_chain() {
    let inner = std::io::Error::new(std::io::ErrorKind::ConnectionRefused, "connection refused");
    let with_context = anyhow::Error::new(inner).context("failed to connect to database");
    let error: CommonWebError = with_context.into();

    assert!(error.is_server_error());
    let cause = error.cause().unwrap();
    let display = format!("{}", cause);
    assert!(display.contains("failed to connect to database"));

    // The original io error should be in the source chain
    let source = cause.source();
    assert!(source.is_some());
  }

  #[test]
  fn require_user_session_not_authorized_maps_to_401() {
    let error: CommonWebError = RequireUserSessionError::NotAuthorized.into();
    assert_eq!(error.status_code(), StatusCode::UNAUTHORIZED);
    assert!(!error.is_server_error());
  }

  #[test]
  fn require_user_session_server_error_wraps_cause() {
    let error: CommonWebError = RequireUserSessionError::ServerError.into();
    assert_eq!(error.status_code(), StatusCode::INTERNAL_SERVER_ERROR);
    assert!(error.is_server_error());
    assert!(error.cause().is_some());
    assert!(format!("{}", error.cause().unwrap()).contains("ServerError"));
  }

  #[test]
  fn serde_json_error_converts_to_500() {
    let bad_json = "not json at all{{{";
    let serde_err: serde_json::Error = serde_json::from_str::<serde_json::Value>(bad_json).unwrap_err();
    let error: CommonWebError = serde_err.into();

    assert_eq!(error.status_code(), StatusCode::INTERNAL_SERVER_ERROR);
    assert!(error.is_server_error());
    let cause = error.cause().unwrap();
    assert!(format!("{}", cause).contains("expected"));
  }

  #[test]
  fn error_source_returns_wrapped_error() {
    let io_err = std::io::Error::new(std::io::ErrorKind::Other, "root cause");
    let error = CommonWebError::from_error(io_err);

    let source = std::error::Error::source(&error);
    assert!(source.is_some());
    assert_eq!(format!("{}", source.unwrap()), "root cause");
  }

  #[test]
  fn non_server_errors_have_no_source() {
    assert!(std::error::Error::source(&CommonWebError::NotFound).is_none());
    assert!(std::error::Error::source(&CommonWebError::NotAuthorized).is_none());
    assert!(std::error::Error::source(&CommonWebError::PaymentRequired).is_none());
    assert!(std::error::Error::source(&CommonWebError::Forbidden).is_none());
    assert!(std::error::Error::source(&CommonWebError::ContentPolicyRejected).is_none());
    assert!(std::error::Error::source(&CommonWebError::ContentPolicyRejectedWithMessage("test".to_string())).is_none());
  }

  #[test]
  fn forbidden_returns_403() {
    let error = CommonWebError::Forbidden;
    assert_eq!(error.status_code(), StatusCode::FORBIDDEN);
    assert!(!error.is_server_error());
  }

  #[test]
  fn content_policy_rejected_returns_403() {
    let error = CommonWebError::ContentPolicyRejected;
    assert_eq!(error.status_code(), StatusCode::FORBIDDEN);
    assert!(!error.is_server_error());
  }

  #[test]
  fn content_policy_rejected_with_message_returns_403() {
    let error = CommonWebError::ContentPolicyRejectedWithMessage("NSFW detected".to_string());
    assert_eq!(error.status_code(), StatusCode::FORBIDDEN);
    assert!(!error.is_server_error());

    let response = error.error_response();
    let bytes = response.into_body().try_into_bytes().unwrap();
    let body = String::from_utf8(bytes.to_vec()).unwrap();
    assert!(body.contains("\"message\":\"NSFW detected\""));
    assert!(body.contains("\"error_code\":403"));
  }
}
