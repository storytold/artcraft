//! Maps artcraft router errors to web errors for the omni_gen pipelines.
//!
//! Known Kinovi (Seedance2Pro) bad requests (content violations, over-long
//! prompts, too many urls) become 400s with a user-facing message. Everything
//! else is unanticipated and stays a 500.

use artcraft_router::errors::artcraft_router_error::ArtcraftRouterError;
use artcraft_router::errors::provider_error::ProviderError;
use seedance2pro_client::error::seedance2pro_bad_request_api_error::Seedance2ProBadRequestApiError;
use seedance2pro_client::error::seedance2pro_error::Seedance2ProError;

use crate::http_server::common_responses::common_web_error::CommonWebError;

/// Map an artcraft router error to a web error, unwrapping Kinovi bad requests.
pub fn map_router_error_to_web_error(error: ArtcraftRouterError) -> CommonWebError {
  match error {
    ArtcraftRouterError::Provider(
      ProviderError::Seedance2Pro(Seedance2ProError::ApiBadRequest(bad_request))
    ) => {
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

  use super::*;

  #[test]
  fn kinovi_bad_requests_become_400s_with_user_facing_messages() {
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
      let error = map_router_error_to_web_error(
        ArtcraftRouterError::Provider(
          ProviderError::Seedance2Pro(
            Seedance2ProError::ApiBadRequest(bad_request))));

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
