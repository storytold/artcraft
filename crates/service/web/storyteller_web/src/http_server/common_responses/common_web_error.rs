use actix_http::StatusCode;
use actix_web::{HttpResponse, HttpResponseBuilder, ResponseError};
use log::error;
use mysql_queries::errors::mysql_error::{MysqlCrateErrorSubtype, MysqlError};
use std::error::Error;
use std::fmt::{Display, Formatter};

#[derive(Debug, utoipa::ToSchema)]
pub enum CommonWebError {
  // TODO: Bad input with error fields vector.
  /// Bad input with a user-facing error message.
  BadInputWithSimpleMessage(String),
  /// Entity not found.
  NotFound,
  /// Not authorized to perform the action.
  NotAuthorized,
  /// Server error with no reason.
  ServerError,
  /// Payment required with no extra info
  PaymentRequired,
}

impl Error for CommonWebError {}

impl Display for CommonWebError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    write!(f, "{:?}", self)
  }
}

#[derive(Debug, Serialize)]
struct SerializeSimpleErrorWithoutMessage<'a> {
  success: bool,
  error_code: u16,
  error_code_str: Option<&'a str>,
}


#[derive(Debug, Serialize)]
struct SerializeSimpleErrorWithMessage<'a> {
  success: bool,
  error_code: u16,
  error_code_str: Option<&'a str>,
  message: &'a str,
}

impl ResponseError for CommonWebError {
  fn status_code(&self) -> StatusCode {
    match self {
      CommonWebError::BadInputWithSimpleMessage(_) => StatusCode::BAD_REQUEST,
      CommonWebError::NotFound => StatusCode::NOT_FOUND,
      CommonWebError::NotAuthorized => StatusCode::UNAUTHORIZED,
      CommonWebError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
      CommonWebError::PaymentRequired => StatusCode::PAYMENT_REQUIRED,
    }
  }

  fn error_response(&self) -> HttpResponse {
    match self {
      CommonWebError::BadInputWithSimpleMessage(msg) => {
        HttpResponse::BadRequest()
            .json(SerializeSimpleErrorWithMessage {
              success: false,
              error_code: self.status_code().as_u16(),
              error_code_str: self.status_code().canonical_reason(),
              message: msg,
            })
      },
      _ => {
        HttpResponseBuilder::new(self.status_code())
            .json(SerializeSimpleErrorWithoutMessage { 
              success: false,
              error_code: self.status_code().as_u16(),
              error_code_str: self.status_code().canonical_reason(),
            })
      }
    }
  }
}

impl From<sqlx::Error> for CommonWebError {
  fn from(value: sqlx::Error) -> Self {
    error!("SQLx error: {:?}", value);
    CommonWebError::ServerError
  }
}

impl From<anyhow::Error> for CommonWebError {
  fn from(value: anyhow::Error) -> Self {
    error!("Uncaught anyhow::Error being coerced to CommonWebError : {:?}", value);
    CommonWebError::ServerError
  }
}

impl <T: MysqlCrateErrorSubtype> From<MysqlError<T>> for CommonWebError {
  fn from(value: MysqlError<T>) -> Self {
    error!("MysqlError being coerced to CommonWebError : {:?}", value);
    CommonWebError::ServerError
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use actix_http::body::MessageBody;

  #[test]
  fn test_bad_input_json() {
    let error = CommonWebError::BadInputWithSimpleMessage("foo bar baz".to_string());
    let response = error.error_response();
    let bytes = response.into_body().try_into_bytes().unwrap();
    let body = String::from_utf8(bytes.to_vec()).unwrap();
    assert_eq!(body, "{\"success\":false,\"error_code\":400,\"error_code_str\":\"Bad Request\",\"message\":\"foo bar baz\"}");
  }
}