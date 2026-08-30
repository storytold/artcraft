//! Maps Kinovi (KinoviWeb) client errors to web errors.
//!
//! Known bad requests (content violations, over-long prompts, too many urls)
//! become 400s with a user-facing message. Everything else is unanticipated
//! and stays a 500.

use kinovi_web_client::error::kinovi_web_bad_request_api_error::KinoviWebBadRequestApiError;
use kinovi_web_client::error::kinovi_web_error::KinoviWebError;

use crate::http_server::common_responses::common_web_error::CommonWebError;

/// Map a raw Kinovi client error to a web error.
pub fn map_kinovi_web_error_to_web_error(error: KinoviWebError) -> CommonWebError {
  match error {
    KinoviWebError::ApiBadRequest(bad_request) => {
      CommonWebError::BadInputWithSimpleMessage(user_facing_bad_request_message(&bad_request))
    }
    other => CommonWebError::from_error(other),
  }
}

fn user_facing_bad_request_message(error: &KinoviWebBadRequestApiError) -> String {
  match error {
    KinoviWebBadRequestApiError::VideoGenerationViolation { .. } => {
      "The generation request was flagged as a content violation. \
       Please adjust your prompt or input media and try again.".to_string()
    }
    KinoviWebBadRequestApiError::PromptIsTooLong { .. } => {
      "The prompt is too long. Please shorten it below 10,000 characters and try again.".to_string()
    }
    KinoviWebBadRequestApiError::TooManyUrls { .. } => {
      "Too many input files were attached. \
       Please remove some and try again.".to_string()
    }
  }
}

#[cfg(test)]
mod tests {
  use actix_web::ResponseError;
  use kinovi_web_client::error::kinovi_web_specific_api_error::KinoviWebSpecificApiError;

  use super::*;

  #[test]
  fn bad_requests_become_400s_with_user_facing_messages() {
    let cases = [
      (
        KinoviWebBadRequestApiError::VideoGenerationViolation { raw_body: "{}".to_string() },
        "content violation",
      ),
      (
        KinoviWebBadRequestApiError::PromptIsTooLong { raw_body: "{}".to_string() },
        "prompt is too long",
      ),
      (
        KinoviWebBadRequestApiError::TooManyUrls { raw_body: "{}".to_string() },
        "Too many input files",
      ),
    ];

    for (bad_request, expected_message_fragment) in cases {
      let error = map_kinovi_web_error_to_web_error(
        KinoviWebError::ApiBadRequest(bad_request));

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
    let error = map_kinovi_web_error_to_web_error(
      KinoviWebError::ApiSpecific(KinoviWebSpecificApiError::UnauthorizedSessionExpired));

    assert_eq!(error.status_code().as_u16(), 500);
  }
}
