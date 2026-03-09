use crate::error::world_labs_error::WorldLabsError;
use crate::error::world_labs_generic_api_error::WorldLabsGenericApiError;
use crate::error::world_labs_specific_api_error::WorldLabsSpecificApiError;
use wreq::StatusCode;

/// Detect error HTTP responses and coerce the response as a Rust Error.
pub fn filter_world_labs_http_error(status_code: StatusCode, maybe_body: Option<&str>) -> Result<(), WorldLabsError> {
  if status_code.is_success() {
    return Ok(());
  }

  match status_code {
    StatusCode::PAYMENT_REQUIRED => {
      return Err(WorldLabsSpecificApiError::InsufficientCredits.into());
    },
    _ => {},
  }

  if let Some(body) = maybe_body {
    return Err(WorldLabsGenericApiError::UncategorizedBadResponseWithStatusAndBody {
      status_code,
      body: body.to_string(),
    }.into());
  }

  Err(WorldLabsGenericApiError::UncategorizedBadResponseWithStatusAndBody {
    status_code,
    body: String::new(),
  }.into())
}
