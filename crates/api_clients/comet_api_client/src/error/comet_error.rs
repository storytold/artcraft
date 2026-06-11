use std::error::Error;
use std::fmt::{Display, Formatter};

use crate::error::comet_bad_request_api_error::CometBadRequestApiError;
use crate::error::comet_client_error::CometClientError;
use crate::error::comet_generic_api_error::CometGenericApiError;
use crate::error::comet_specific_api_error::CometSpecificApiError;

#[derive(Debug)]
pub enum CometError {
  /// An error that happened client-side (before or while making the request).
  Client(CometClientError),

  /// Known "400s" that are the fault of the client sending a bad request.
  /// These should surface to the end user as 400s.
  ApiBadRequest(CometBadRequestApiError),

  /// Server-side errors with specific, well-known causes.
  ApiSpecific(CometSpecificApiError),

  /// Server-side errors with unknown / grab-bag causes.
  ApiGeneric(CometGenericApiError),
}

impl CometError {
  pub fn is_having_downtime_issues(&self) -> bool {
    match self {
      Self::ApiGeneric(CometGenericApiError::UncategorizedBadResponseWithStatusAndBody { status_code, body: _ }) => {
        matches!(status_code.as_u16(), 502 | 503 | 504 | 524)
      },
      _ => false,
    }
  }
}

impl Error for CometError {}

impl Display for CometError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::Client(e) => write!(f, "CometClientError: {:?}", e),
      Self::ApiBadRequest(e) => write!(f, "CometBadRequestApiError: {:?}", e),
      Self::ApiSpecific(e) => write!(f, "CometSpecificApiError: {:?}", e),
      Self::ApiGeneric(e) => write!(f, "CometGenericApiError: {:?}", e),
    }
  }
}

impl From<CometClientError> for CometError {
  fn from(error: CometClientError) -> Self {
    Self::Client(error)
  }
}

impl From<CometBadRequestApiError> for CometError {
  fn from(error: CometBadRequestApiError) -> Self {
    Self::ApiBadRequest(error)
  }
}

impl From<CometSpecificApiError> for CometError {
  fn from(error: CometSpecificApiError) -> Self {
    Self::ApiSpecific(error)
  }
}

impl From<CometGenericApiError> for CometError {
  fn from(error: CometGenericApiError) -> Self {
    Self::ApiGeneric(error)
  }
}
