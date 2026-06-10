//! Maps Kinovi (Seedance2Pro) client errors to web errors.
//!
//! Known bad requests (content violations, over-long prompts, too many urls)
//! become 400s with a user-facing message. Everything else is unanticipated
//! and stays a 500.

use seedance2pro_client::error::seedance2pro_bad_request_api_error::Seedance2ProBadRequestApiError;
use seedance2pro_client::error::seedance2pro_error::Seedance2ProError;

use crate::http_server::common_responses::common_web_error::CommonWebError;

/// Map a raw Kinovi client error to a web error.
pub fn map_seedance2pro_error_to_web_error(error: Seedance2ProError) -> CommonWebError {
  match error {
    Seedance2ProError::ApiBadRequest(bad_request) => {
      CommonWebError::BadInputWithSimpleMessage(user_facing_bad_request_message(&bad_request))
    }
    other => CommonWebError::from_error(other),
  }
}

fn user_facing_bad_request_message(error: &Seedance2ProBadRequestApiError) -> String {
  match error {
    Seedance2ProBadRequestApiError::VideoGenerationViolation { .. } => {
      "The generation request was flagged as a content violation. \
       Please adjust your prompt or input media and try again.".to_string()
    }
    Seedance2ProBadRequestApiError::PromptIsTooLong { .. } => {
      "The prompt is too long. Please shorten it below 10,000 characters and try again.".to_string()
    }
    Seedance2ProBadRequestApiError::TooManyUrls { .. } => {
      "Too many input files were attached. \
       Please remove some and try again.".to_string()
    }
  }
}

#[cfg(test)]
mod tests {
  use actix_web::ResponseError;
  use seedance2pro_client::error::seedance2pro_specific_api_error::Seedance2ProSpecificApiError;

  use super::*;

  #[test]
  fn bad_requests_become_400s_with_user_facing_messages() {
    let cases = [
      (
        Seedance2ProBadRequestApiError::VideoGenerationViolation { raw_body: "{}".to_string() },
        "content violation",
      ),
      (
        Seedance2ProBadRequestApiError::PromptIsTooLong { raw_body: "{}".to_string() },
        "prompt is too long",
      ),
      (
        Seedance2ProBadRequestApiError::TooManyUrls { raw_body: "{}".to_string() },
        "Too many input files",
      ),
    ];

    for (bad_request, expected_message_fragment) in cases {
      let error = map_seedance2pro_error_to_web_error(
        Seedance2ProError::ApiBadRequest(bad_request));

      assert_eq!(error.status_code().as_u16(), 400);
      match error {
        CommonWebError::BadInputWithSimpleMessage(message) => {
          assert!(
            message.contains(expected_message_fragment),
            "message {:?} should contain {:?}", message, expected_message_fragment);
        }
        other => panic!("Expected BadInputWithSimpleMessage, got: {:?}", other),
      }
    }
  }

  #[test]
  fn unanticipated_errors_stay_500s() {
    let error = map_seedance2pro_error_to_web_error(
      Seedance2ProError::ApiSpecific(Seedance2ProSpecificApiError::UnauthorizedSessionExpired));

    assert_eq!(error.status_code().as_u16(), 500);
  }
}
