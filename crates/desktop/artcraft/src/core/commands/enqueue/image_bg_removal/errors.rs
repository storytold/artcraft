use crate::core::commands::enqueue::image_bg_removal::enqueue_image_bg_removal_command::EnqueueImageBgRemovalErrorType;
use crate::core::commands::response::failure_response_wrapper::{CommandErrorResponseWrapper, CommandErrorStatus};
use errors::AnyhowError;
use serde::Serialize;
use storyteller_client::error::storyteller_error::StorytellerError;

#[derive(Debug)]
pub enum InternalBgRemovalError {
  /// No provider is configured for the model type.
  NoProviderAvailable,
  
  /// No storyteller credentials are set.
  NeedsStorytellerCredentials,
  
  /// No image was provided for background removal.
  MissingImage,
  
  /// Could not decode the base64 image data.
  Base64DecodeError,
  
  AnyhowError(AnyhowError),
  StorytellerError(StorytellerError),
}

impl From<AnyhowError> for InternalBgRemovalError {
  fn from(value: AnyhowError) -> Self {
    Self::AnyhowError(value)
  }
}

impl From<StorytellerError> for InternalBgRemovalError {
  fn from(value: StorytellerError) -> Self {
    Self::StorytellerError(value)
  }
}

impl InternalBgRemovalError {
  pub fn to_tauri_response<E: Serialize>(&self) -> CommandErrorResponseWrapper<EnqueueImageBgRemovalErrorType, E> {
    let mut status = CommandErrorStatus::ServerError;
    let mut error_type = EnqueueImageBgRemovalErrorType::ServerError;
    let mut error_message = "A server error occurred. Please try again. If it continues, please tell our staff about the problem.".to_string();
    
    match self {
      InternalBgRemovalError::NoProviderAvailable => {
        status = CommandErrorStatus::ServerError;
        error_type = EnqueueImageBgRemovalErrorType::NoProviderAvailable;
        error_message = "No configured provider available for background removal".to_string();
      }
      InternalBgRemovalError::MissingImage => {
        status = CommandErrorStatus::BadRequest;
        error_type = EnqueueImageBgRemovalErrorType::MissingImage;
        error_message = "No image provided for background removal".to_string();
      }
      InternalBgRemovalError::Base64DecodeError => {
        status = CommandErrorStatus::BadRequest;
        error_type = EnqueueImageBgRemovalErrorType::Base64DecodeError;
        error_message = "Failed to decode base64 image data".to_string();
      }
      InternalBgRemovalError::AnyhowError(_) => {}
      InternalBgRemovalError::StorytellerError(_) => {}
      InternalBgRemovalError::NeedsStorytellerCredentials => {}
    }
    
    CommandErrorResponseWrapper {
      status,
      error_message: Some(error_message.to_string()),
      error_type: Some(error_type),
      error_details: None,
    }
  }
}