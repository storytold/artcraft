use wreq::StatusCode;

use crate::error::seedance2pro_error::Seedance2ProError;
use crate::error::seedance2pro_generic_api_error::Seedance2ProGenericApiError;
use crate::error::seedance2pro_specific_api_error::Seedance2ProSpecificApiError;

/// Known error message substrings that indicate a billing/credits error.
const BILLING_ERROR_MARKERS: &[&str] = &[
  "credits not enough",
];

/// Categorize a non-success HTTP response into a specific or generic error.
///
/// Checks the response body for known patterns (e.g. billing errors) and returns
/// a specific error variant when possible, falling back to
/// `UncategorizedBadResponseWithStatusAndBody` otherwise.
pub fn categorize_seedance2pro_error(
  status_code: StatusCode,
  body: String,
) -> Seedance2ProError {
  if is_billing_error(&body) {
    return Seedance2ProSpecificApiError::BillingError {
      status_code,
      body,
    }.into();
  }

  Seedance2ProGenericApiError::UncategorizedBadResponseWithStatusAndBody {
    status_code,
    body,
  }.into()
}

/// Check if the response body contains a known billing error marker.
fn is_billing_error(body: &str) -> bool {
  let body_lower = body.to_lowercase();
  BILLING_ERROR_MARKERS.iter().any(|marker| body_lower.contains(marker))
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::error::seedance2pro_error::Seedance2ProError;

  #[test]
  fn real_not_enough_credits_response() {
    let body = std::fs::read_to_string("test_data/responses/not_enough_credits.json")
        .expect("Failed to read test data file");

    let error = categorize_seedance2pro_error(StatusCode::BAD_REQUEST, body);

    match error {
      Seedance2ProError::ApiSpecific(
        Seedance2ProSpecificApiError::BillingError { status_code, body }
      ) => {
        assert_eq!(status_code, StatusCode::BAD_REQUEST);
        assert!(body.contains("credits not enough"));
      }
      other => panic!("Expected BillingError, got: {:?}", other),
    }
  }

  #[test]
  fn billing_error_case_insensitive() {
    let body = r#"{"error":"Credits Not Enough"}"#.to_string();

    let error = categorize_seedance2pro_error(StatusCode::BAD_REQUEST, body);

    match error {
      Seedance2ProError::ApiSpecific(
        Seedance2ProSpecificApiError::BillingError { .. }
      ) => {}
      other => panic!("Expected BillingError, got: {:?}", other),
    }
  }

  #[test]
  fn unknown_error_falls_back_to_uncategorized() {
    let body = r#"{"error":"something else went wrong"}"#.to_string();

    let error = categorize_seedance2pro_error(
      StatusCode::INTERNAL_SERVER_ERROR,
      body.clone(),
    );

    match error {
      Seedance2ProError::ApiGeneric(
        Seedance2ProGenericApiError::UncategorizedBadResponseWithStatusAndBody { status_code, body: b }
      ) => {
        assert_eq!(status_code, StatusCode::INTERNAL_SERVER_ERROR);
        assert_eq!(b, body);
      }
      other => panic!("Expected UncategorizedBadResponseWithStatusAndBody, got: {:?}", other),
    }
  }

  #[test]
  fn empty_body_falls_back_to_uncategorized() {
    let error = categorize_seedance2pro_error(
      StatusCode::BAD_REQUEST,
      String::new(),
    );

    match error {
      Seedance2ProError::ApiGeneric(
        Seedance2ProGenericApiError::UncategorizedBadResponseWithStatusAndBody { .. }
      ) => {}
      other => panic!("Expected UncategorizedBadResponseWithStatusAndBody, got: {:?}", other),
    }
  }
}
