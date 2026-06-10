use std::error::Error;
use std::fmt::{Display, Formatter};

/// These represent known "400s" that are the fault of the client sending a bad request.
#[derive(Debug)]
pub enum Seedance2ProBadRequestApiError {
  /// The video generation request was flagged as a content violation.
  VideoGenerationViolation { raw_body: String },

  /// The prompt exceeded Kinovi's maximum length (10,000 characters at the
  /// time of writing).
  PromptIsTooLong { raw_body: String },

  /// Too many media URLs were attached to the request (`uploadedUrls` is
  /// capped at 9 elements at the time of writing).
  TooManyUrls { raw_body: String },
}

impl Error for Seedance2ProBadRequestApiError {}

impl Display for Seedance2ProBadRequestApiError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::VideoGenerationViolation { raw_body } => write!(f, "Video generation violation: {}", raw_body),
      Self::PromptIsTooLong { raw_body } => write!(f, "Prompt is too long: {}", raw_body),
      Self::TooManyUrls { raw_body } => write!(f, "Too many urls: {}", raw_body),
    }
  }
}
