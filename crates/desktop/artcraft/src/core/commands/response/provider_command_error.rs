use serde::Serialize;

use super::failure_response_wrapper::{CommandErrorResponseWrapper, CommandErrorStatus};

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum ProviderCommandError {
  AuthenticationRequired,
  MissingApiKey,
  InvalidInput,
  AlreadyTracked,
  StorageError,
  ProviderError,
}

impl ProviderCommandError {
  /// Wrap a stable provider command error code with its user-facing explanation.
  pub fn response(self, message: impl Into<String>) -> CommandErrorResponseWrapper<Self, ()> {
    let status = match self {
      Self::AuthenticationRequired | Self::MissingApiKey => CommandErrorStatus::Unauthorized,
      Self::InvalidInput | Self::AlreadyTracked => CommandErrorStatus::BadRequest,
      Self::StorageError | Self::ProviderError => CommandErrorStatus::ServerError,
    };
    CommandErrorResponseWrapper { status, error_message: Some(message.into()), error_type: Some(self), error_details: None }
  }
}
