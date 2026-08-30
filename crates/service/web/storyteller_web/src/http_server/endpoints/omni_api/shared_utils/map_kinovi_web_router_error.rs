//! Maps artcraft router errors to web errors for the omni_gen pipelines.
//!
//! Known Kinovi (KinoviWeb) bad requests (content violations, over-long
//! prompts, too many urls) become 400s with a user-facing message. Everything
//! else is unanticipated and stays a 500.

use artcraft_router::errors::artcraft_router_error::ArtcraftRouterError;
use artcraft_router::errors::provider_error::ProviderError;
use kinovi_web_client::error::kinovi_web_bad_request_api_error::KinoviWebBadRequestApiError;
use kinovi_web_client::error::kinovi_web_error::KinoviWebError;

use crate::http_server::common_responses::common_web_error::CommonWebError;

/// Map an artcraft router error to a web error, unwrapping Kinovi bad requests.
pub fn map_router_error_to_web_error(error: ArtcraftRouterError) -> CommonWebError {
  match error {
    ArtcraftRouterError::Provider(
      ProviderError::KinoviWeb(KinoviWebError::ApiBadRequest(bad_request))
    ) => {
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

  use super::*;

  #[test]
  fn kinovi_bad_requests_become_400s_with_user_facing_messages() {
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
      let error = map_router_error_to_web_error(
        ArtcraftRouterError::Provider(
          ProviderError::KinoviWeb(
            KinoviWebError::ApiBadRequest(bad_request))));

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
  fn other_router_errors_stay_500s() {
    let error = map_router_error_to_web_error(
      ArtcraftRouterError::UnsupportedModel("some_model".to_string()));

    assert_eq!(error.status_code().as_u16(), 500);
  }
}
