use serde::Serialize;

/// Statuses for errorful commands.
#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "snake_case")]
pub enum CommandErrorStatus {
  BadRequest, // 400
  Unauthorized, // 401
  TooManyRequests, // 429
  ServerError, // 500
}

#[derive(Serialize, Debug)]
pub struct CommandErrorResponseWrapper<ErrType: Serialize, ErrPayload: Serialize> {
  /// Both "success" and "error" types have a `status` field for the frontend.
  /// We constrain the value types for successes and failures.
  pub status: CommandErrorStatus,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub error_message: Option<String>,

  /// Represents a "type" of error, preferably an enum without payloads.
  /// Preferably this serializes to a string.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub error_type: Option<ErrType>,

  /// Represents a full error details object or payload.
  /// This could be a structure, message, or whatever.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub error_details: Option<ErrPayload>,
}

impl From<&str> for CommandErrorResponseWrapper<(), ()> {
  fn from(value: &str) -> Self {
    CommandErrorResponseWrapper {
      status: CommandErrorStatus::BadRequest, // NB: Default to 500 error.
      error_message: Some(value.to_string()),
      error_type: None,
      error_details: None,
    }
  }
}

impl From<String> for CommandErrorResponseWrapper<(), ()> {
  fn from(value: String) -> Self {
    CommandErrorResponseWrapper {
      status: CommandErrorStatus::BadRequest, // NB: Default to 500 error.
      error_message: Some(value),
      error_type: None,
      error_details: None,
    }
  }
}
