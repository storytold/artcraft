use wreq::StatusCode;

use crate::error::seedance2pro_bad_request_api_error::Seedance2ProBadRequestApiError;
use crate::error::seedance2pro_error::Seedance2ProError;
use crate::error::seedance2pro_generic_api_error::Seedance2ProGenericApiError;
use crate::error::seedance2pro_specific_api_error::Seedance2ProSpecificApiError;

/// Known error message substrings that indicate a billing/credits error.
const BILLING_ERROR_MARKERS: &[&str] = &[
  "credits not enough",
];

/// Zod validation message for a string field exceeding its maximum length,
/// eg. "参数验证失败 - String must contain at most 10000 character(s)".
const STRING_TOO_LONG_MARKER: &str = "String must contain at most";

/// Zod validation message for an array field exceeding its maximum size,
/// eg. "参数验证失败 - Array must contain at most 9 element(s)".
const ARRAY_TOO_LARGE_MARKER: &str = "Array must contain at most";

/// Zod `fieldErrors` path entry for the prompt field.
const PROMPT_FIELD_MARKER: &str = "\"prompt\"";

/// Zod `fieldErrors` path entry for the uploaded media urls field.
const UPLOADED_URLS_FIELD_MARKER: &str = "\"uploadedUrls\"";

/// Categorize a non-success HTTP response into a specific or generic error.
///
/// Checks the response body for known patterns (e.g. billing errors, request
/// validation failures) and returns a specific error variant when possible,
/// falling back to `UncategorizedBadResponseWithStatusAndBody` otherwise.
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

  if status_code == StatusCode::BAD_REQUEST {
    if is_prompt_too_long_error(&body) {
      return Seedance2ProBadRequestApiError::PromptIsTooLong { raw_body: body }.into();
    }
    if is_too_many_urls_error(&body) {
      return Seedance2ProBadRequestApiError::TooManyUrls { raw_body: body }.into();
    }
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

/// Check if the response body is a zod validation failure for an over-long prompt.
fn is_prompt_too_long_error(body: &str) -> bool {
  body.contains(STRING_TOO_LONG_MARKER) && body.contains(PROMPT_FIELD_MARKER)
}

/// Check if the response body is a zod validation failure for too many uploaded urls.
fn is_too_many_urls_error(body: &str) -> bool {
  body.contains(ARRAY_TOO_LARGE_MARKER) && body.contains(UPLOADED_URLS_FIELD_MARKER)
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::error::seedance2pro_error::Seedance2ProError;

  mod billing_tests {
    use super::*;

    #[test]
    fn real_not_enough_credits_response() {
      let body = read_response_body("not_enough_credits.json");

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
  }

  mod bad_request_tests {
    use super::*;

    #[test]
    fn real_prompt_too_long_response() {
      let body = read_response_body("prompt_too_long.json");

      let error = categorize_seedance2pro_error(StatusCode::BAD_REQUEST, body);

      match error {
        Seedance2ProError::ApiBadRequest(
          Seedance2ProBadRequestApiError::PromptIsTooLong { raw_body }
        ) => {
          assert!(raw_body.contains("String must contain at most 10000 character(s)"));
          assert!(raw_body.contains("\"prompt\""));
        }
        other => panic!("Expected PromptIsTooLong, got: {:?}", other),
      }
    }

    #[test]
    fn real_too_many_urls_response() {
      let body = read_response_body("too_many_urls.json");

      let error = categorize_seedance2pro_error(StatusCode::BAD_REQUEST, body);

      match error {
        Seedance2ProError::ApiBadRequest(
          Seedance2ProBadRequestApiError::TooManyUrls { raw_body }
        ) => {
          assert!(raw_body.contains("Array must contain at most 9 element(s)"));
          assert!(raw_body.contains("\"uploadedUrls\""));
        }
        other => panic!("Expected TooManyUrls, got: {:?}", other),
      }
    }

    #[test]
    fn bad_request_markers_require_400_status() {
      let body = read_response_body("prompt_too_long.json");

      let error = categorize_seedance2pro_error(StatusCode::INTERNAL_SERVER_ERROR, body);

      match error {
        Seedance2ProError::ApiGeneric(
          Seedance2ProGenericApiError::UncategorizedBadResponseWithStatusAndBody { .. }
        ) => {}
        other => panic!("Expected UncategorizedBadResponseWithStatusAndBody, got: {:?}", other),
      }
    }

    #[test]
    fn validation_failure_for_other_field_is_not_categorized() {
      // Same zod shape, but for a field we don't have a variant for.
      let body = r#"[{"error":{"json":{"message":"validation failed - String must contain at most 100 character(s)","code":-32600,"data":{"code":"BAD_REQUEST","httpStatus":400,"zodError":{"formErrors":[],"fieldErrors":{"apiParams":[{"code":"custom","message":"String must contain at most 100 character(s)","path":["apiParams","negativePrompt"],"fatal":true}]}}}}}]"#.to_string();

      let error = categorize_seedance2pro_error(StatusCode::BAD_REQUEST, body);

      match error {
        Seedance2ProError::ApiGeneric(
          Seedance2ProGenericApiError::UncategorizedBadResponseWithStatusAndBody { .. }
        ) => {}
        other => panic!("Expected UncategorizedBadResponseWithStatusAndBody, got: {:?}", other),
      }
    }
  }

  mod fallback_tests {
    use super::*;

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

  fn read_response_body(filename: &str) -> String {
    std::fs::read_to_string(format!("test_data/responses/{}", filename))
        .expect("Failed to read test data file")
  }
}
