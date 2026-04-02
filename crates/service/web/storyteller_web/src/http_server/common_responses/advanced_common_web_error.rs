use std::fmt::{Display, Formatter};
use std::sync::Arc;

use actix_http::StatusCode;
use actix_web::{HttpResponse, HttpResponseBuilder, ResponseError};
use anyhow::anyhow;
use crate::http_server::web_utils::user_session::require_user_session::RequireUserSessionError;

/// An error type for actix-web handlers that wraps causal errors for debugging
/// and paging while presenting safe, generic HTTP responses to users.
///
/// ## Usage
///
/// ```ignore
/// pub async fn my_handler(...) -> Result<Json<MyResponse>, AdvancedCommonWebError> {
///   // sqlx errors, anyhow errors, session errors — all convert via ?
///   let user = require_user_session_using_connection(&req, ...)?;
///   let data = some_db_query(&pool).await?;
///
///   if data.is_none() {
///     return Err(AdvancedCommonWebError::NotFound);
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
pub enum AdvancedCommonWebError {
  /// 400 Bad Request with a user-facing message.
  BadInputWithSimpleMessage(String),
  /// 401 Unauthorized.
  NotAuthorized,
  /// 404 Not Found.
  NotFound,
  /// 402 Payment Required.
  PaymentRequired,

  /// Uncaught errors are always 500 Internal Server Error.
  /// The user will never see the error cause or message, but our
  /// middleware will handle alerting, logging, etc.
  ///
  /// Stored in `Arc` so the error alerting middleware can clone it for paging
  /// without consuming the original.
  UncaughtServerError(Arc<dyn std::error::Error + Send + Sync + 'static>),
}

// =============== Public accessors ===============

impl AdvancedCommonWebError {
  /// Wrap any error as an `UncaughtServerError`.
  pub fn from_error(error: impl std::error::Error + Send + Sync + 'static) -> Self {
    Self::UncaughtServerError(Arc::new(error))
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
      _ => None,
    }
  }

  /// Clone the wrapped causal error as an `Arc` (only present for `UncaughtServerError`).
  /// Useful for passing the error to the pager system without consuming the original.
  pub fn clone_cause_arc(&self) -> Option<Arc<dyn std::error::Error + Send + Sync + 'static>> {
    match self {
      Self::UncaughtServerError(err) => Some(Arc::clone(err)),
      _ => None,
    }
  }

  /// Whether this is a server error (500).
  pub fn is_server_error(&self) -> bool {
    matches!(self, Self::UncaughtServerError(_))
  }
}

// =============== Display / Debug / Error ===============

impl Display for AdvancedCommonWebError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::BadInputWithSimpleMessage(msg) => write!(f, "Bad input: {}", msg),
      Self::NotAuthorized => write!(f, "Not authorized"),
      Self::NotFound => write!(f, "Not found"),
      Self::PaymentRequired => write!(f, "Payment required"),
      Self::UncaughtServerError(err) => write!(f, "Server error: {}", err),
    }
  }
}

impl std::fmt::Debug for AdvancedCommonWebError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::BadInputWithSimpleMessage(msg) => write!(f, "BadInputWithSimpleMessage({:?})", msg),
      Self::NotAuthorized => write!(f, "NotAuthorized"),
      Self::NotFound => write!(f, "NotFound"),
      Self::PaymentRequired => write!(f, "PaymentRequired"),
      Self::UncaughtServerError(err) => write!(f, "UncaughtServerError({:?})", err),
    }
  }
}

impl std::error::Error for AdvancedCommonWebError {
  fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
    match self {
      Self::UncaughtServerError(err) => Some(err.as_ref()),
      _ => None,
    }
  }
}

// =============== Actix ResponseError ===============

impl ResponseError for AdvancedCommonWebError {
  fn status_code(&self) -> StatusCode {
    match self {
      Self::BadInputWithSimpleMessage(_) => StatusCode::BAD_REQUEST,
      Self::NotAuthorized => StatusCode::UNAUTHORIZED,
      Self::NotFound => StatusCode::NOT_FOUND,
      Self::PaymentRequired => StatusCode::PAYMENT_REQUIRED,
      Self::UncaughtServerError(_) => StatusCode::INTERNAL_SERVER_ERROR,
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

impl From<sqlx::Error> for AdvancedCommonWebError {
  fn from(err: sqlx::Error) -> Self {
    Self::from_error(err)
  }
}

impl From<anyhow::Error> for AdvancedCommonWebError {
  fn from(err: anyhow::Error) -> Self {
    // anyhow::Error doesn't impl std::error::Error, so we go through Box -> Arc.
    let boxed: Box<dyn std::error::Error + Send + Sync> = err.into();
    Self::UncaughtServerError(Arc::from(boxed))
  }
}

impl From<serde_json::Error> for AdvancedCommonWebError {
  fn from(err: serde_json::Error) -> Self {
    Self::from_error(err)
  }
}

impl From<RequireUserSessionError> for AdvancedCommonWebError {
  fn from(value: RequireUserSessionError) -> Self {
    match value {
      RequireUserSessionError::NotAuthorized => Self::NotAuthorized,
      RequireUserSessionError::ServerError => Self::from_error(value),
    }
  }
}

impl From<crate::http_server::common_responses::common_web_error::CommonWebError> for AdvancedCommonWebError {
  fn from(value: crate::http_server::common_responses::common_web_error::CommonWebError) -> Self {
    use crate::http_server::common_responses::common_web_error::CommonWebError;
    match value {
      CommonWebError::BadInputWithSimpleMessage(msg) => Self::BadInputWithSimpleMessage(msg),
      CommonWebError::NotAuthorized => Self::NotAuthorized,
      CommonWebError::NotFound => Self::NotFound,
      CommonWebError::PaymentRequired => Self::PaymentRequired,
      CommonWebError::ServerError => Self::from_error(value),
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

impl utoipa::PartialSchema for AdvancedCommonWebError {
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

impl utoipa::ToSchema for AdvancedCommonWebError {
  fn name() -> std::borrow::Cow<'static, str> {
    std::borrow::Cow::Borrowed("AdvancedCommonWebError")
  }
}

// =============== Tests ===============

#[cfg(test)]
mod tests {
  use super::*;
  use actix_http::body::MessageBody;

  #[test]
  fn bad_input_returns_400_with_message() {
    let error = AdvancedCommonWebError::BadInputWithSimpleMessage("name is required".to_string());
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
    let error = AdvancedCommonWebError::NotFound;
    assert_eq!(error.status_code(), StatusCode::NOT_FOUND);
    assert!(!error.is_server_error());
  }

  #[test]
  fn not_authorized_returns_401() {
    let error = AdvancedCommonWebError::NotAuthorized;
    assert_eq!(error.status_code(), StatusCode::UNAUTHORIZED);
  }

  #[test]
  fn payment_required_returns_402() {
    let error = AdvancedCommonWebError::PaymentRequired;
    assert_eq!(error.status_code(), StatusCode::PAYMENT_REQUIRED);
  }

  #[test]
  fn uncaught_io_error_returns_500_and_hides_cause() {
    let io_err = std::io::Error::new(std::io::ErrorKind::Other, "disk exploded");
    let error = AdvancedCommonWebError::from_error(io_err);

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
    let error: AdvancedCommonWebError = anyhow::anyhow!("something broke in the pipeline").into();
    assert_eq!(error.status_code(), StatusCode::INTERNAL_SERVER_ERROR);
    assert!(error.is_server_error());

    let cause = error.cause().unwrap();
    assert!(format!("{}", cause).contains("something broke in the pipeline"));
  }

  #[test]
  fn nested_anyhow_error_preserves_context_chain() {
    let inner = std::io::Error::new(std::io::ErrorKind::ConnectionRefused, "connection refused");
    let with_context = anyhow::Error::new(inner).context("failed to connect to database");
    let error: AdvancedCommonWebError = with_context.into();

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
    let error: AdvancedCommonWebError = RequireUserSessionError::NotAuthorized.into();
    assert_eq!(error.status_code(), StatusCode::UNAUTHORIZED);
    assert!(!error.is_server_error());
  }

  #[test]
  fn require_user_session_server_error_wraps_cause() {
    let error: AdvancedCommonWebError = RequireUserSessionError::ServerError.into();
    assert_eq!(error.status_code(), StatusCode::INTERNAL_SERVER_ERROR);
    assert!(error.is_server_error());
    assert!(error.cause().is_some());
    assert!(format!("{}", error.cause().unwrap()).contains("ServerError"));
  }

  #[test]
  fn serde_json_error_converts_to_500() {
    let bad_json = "not json at all{{{";
    let serde_err: serde_json::Error = serde_json::from_str::<serde_json::Value>(bad_json).unwrap_err();
    let error: AdvancedCommonWebError = serde_err.into();

    assert_eq!(error.status_code(), StatusCode::INTERNAL_SERVER_ERROR);
    assert!(error.is_server_error());
    let cause = error.cause().unwrap();
    assert!(format!("{}", cause).contains("expected"));
  }

  #[test]
  fn error_source_returns_wrapped_error() {
    let io_err = std::io::Error::new(std::io::ErrorKind::Other, "root cause");
    let error = AdvancedCommonWebError::from_error(io_err);

    let source = std::error::Error::source(&error);
    assert!(source.is_some());
    assert_eq!(format!("{}", source.unwrap()), "root cause");
  }

  #[test]
  fn non_server_errors_have_no_source() {
    assert!(std::error::Error::source(&AdvancedCommonWebError::NotFound).is_none());
    assert!(std::error::Error::source(&AdvancedCommonWebError::NotAuthorized).is_none());
    assert!(std::error::Error::source(&AdvancedCommonWebError::PaymentRequired).is_none());
  }
}
