use crate::error::world_labs_error::WorldLabsError;
use crate::error::world_labs_generic_api_error::WorldLabsGenericApiError;
use crate::error::world_labs_specific_api_error::WorldLabsSpecificApiError;
use cloudflare_errors::filter_cloudflare_errors::filter_cloudflare_errors;
use wreq::StatusCode;

/// Detect error HTTP responses and coerce the response as a Rust Error.
pub fn filter_world_labs_http_error(status_code: StatusCode, maybe_body: Option<&str>) -> Result<(), WorldLabsError> {
  if status_code.is_success() {
    return Ok(());
  }

  /// Early and easy to detect errors.
  match status_code {
    StatusCode::PAYMENT_REQUIRED => {
      // {"detail":"Insufficient credits for product 'Marble 0.1-plus'. Please add credits to your account."}
      return Err(WorldLabsSpecificApiError::InsufficientCredits.into());
    },
    _ => {}, // Fall Through.
  }

  if let Some(body) = maybe_body {
    filter_cloudflare_errors(status_code.as_u16(), body)?;

    return Err(WorldLabsGenericApiError::UncategorizedBadResponseWithStatusAndBody {
      status_code,
      body: body.to_string(),
    }.into());
  }

  Err(WorldLabsGenericApiError::UncategorizedBadResponseWithStatus(status_code).into())
}
