use reqwest::StatusCode;

use crate::error::comet_bad_request_api_error::CometBadRequestApiError;
use crate::error::comet_error::CometError;
use crate::error::comet_generic_api_error::CometGenericApiError;
use crate::error::comet_specific_api_error::CometSpecificApiError;

/// Marker CometAPI returns from `GET /v1/videos/{id}` for unknown task ids.
const TASK_NOT_EXIST_MARKER: &str = "task_not_exist";

/// Categorize a non-success response from the video creation endpoint
/// (`POST /v1/videos`).
///
/// Per the docs, 400s from this endpoint mean the request itself was invalid
/// (missing prompt, out-of-range duration, image input on an unsupported
/// model) — the caller's fault, surfaced as [`CometBadRequestApiError`].
pub fn categorize_create_video_error(
  status_code: StatusCode,
  body: String,
) -> CometError {
  if status_code == StatusCode::UNAUTHORIZED {
    return CometSpecificApiError::UnauthorizedInvalidApiKey { raw_body: body }.into();
  }

  if status_code == StatusCode::BAD_REQUEST {
    return CometBadRequestApiError::InvalidRequestParameters { raw_body: body }.into();
  }

  CometGenericApiError::UncategorizedBadResponseWithStatusAndBody {
    status_code,
    body,
  }.into()
}

/// Categorize a non-success response from the poll endpoint
/// (`GET /v1/videos/{id}`).
///
/// Unlike the creation endpoint, a 400 here means the task id is unknown
/// ("task_not_exist") — a specific, well-known cause rather than a
/// user-facing bad request.
pub fn categorize_get_video_task_error(
  status_code: StatusCode,
  body: String,
  task_id: &str,
) -> CometError {
  if status_code == StatusCode::UNAUTHORIZED {
    return CometSpecificApiError::UnauthorizedInvalidApiKey { raw_body: body }.into();
  }

  if status_code == StatusCode::BAD_REQUEST && body.contains(TASK_NOT_EXIST_MARKER) {
    return CometSpecificApiError::TaskNotFound {
      task_id: task_id.to_string(),
      raw_body: body,
    }.into();
  }

  CometGenericApiError::UncategorizedBadResponseWithStatusAndBody {
    status_code,
    body,
  }.into()
}

#[cfg(test)]
mod tests {
  use super::*;

  mod create_video_tests {
    use super::*;

    #[test]
    fn bad_request_is_caller_fault() {
      let body = r#"{"error":{"message":"seconds must be between 4 and 15","type":"invalid_request_error"}}"#.to_string();

      let error = categorize_create_video_error(StatusCode::BAD_REQUEST, body.clone());

      match error {
        CometError::ApiBadRequest(CometBadRequestApiError::InvalidRequestParameters { raw_body }) => {
          assert_eq!(raw_body, body);
        }
        other => panic!("Expected InvalidRequestParameters, got: {:?}", other),
      }
    }

    #[test]
    fn unauthorized_is_specific() {
      let body = r#"{"error":{"message":"invalid token","type":"cometapi_error"}}"#.to_string();

      let error = categorize_create_video_error(StatusCode::UNAUTHORIZED, body);

      match error {
        CometError::ApiSpecific(CometSpecificApiError::UnauthorizedInvalidApiKey { raw_body }) => {
          assert!(raw_body.contains("invalid token"));
        }
        other => panic!("Expected UnauthorizedInvalidApiKey, got: {:?}", other),
      }
    }

    #[test]
    fn server_errors_fall_back_to_uncategorized() {
      let error = categorize_create_video_error(
        StatusCode::BAD_GATEWAY,
        "upstream timeout".to_string(),
      );

      match &error {
        CometError::ApiGeneric(CometGenericApiError::UncategorizedBadResponseWithStatusAndBody { status_code, .. }) => {
          assert_eq!(*status_code, StatusCode::BAD_GATEWAY);
        }
        other => panic!("Expected UncategorizedBadResponseWithStatusAndBody, got: {:?}", other),
      }
      assert!(error.is_having_downtime_issues());
    }
  }

  mod get_video_task_tests {
    use super::*;

    #[test]
    fn task_not_exist_is_task_not_found() {
      let body = r#"{"error":{"message":"task_not_exist","type":"cometapi_error"}}"#.to_string();

      let error = categorize_get_video_task_error(StatusCode::BAD_REQUEST, body, "task_abc123");

      match error {
        CometError::ApiSpecific(CometSpecificApiError::TaskNotFound { task_id, raw_body }) => {
          assert_eq!(task_id, "task_abc123");
          assert!(raw_body.contains("task_not_exist"));
        }
        other => panic!("Expected TaskNotFound, got: {:?}", other),
      }
    }

    #[test]
    fn other_bad_requests_fall_back_to_uncategorized() {
      let body = r#"{"error":{"message":"something else"}}"#.to_string();

      let error = categorize_get_video_task_error(StatusCode::BAD_REQUEST, body, "task_abc123");

      match error {
        CometError::ApiGeneric(CometGenericApiError::UncategorizedBadResponseWithStatusAndBody { .. }) => {}
        other => panic!("Expected UncategorizedBadResponseWithStatusAndBody, got: {:?}", other),
      }
    }

    #[test]
    fn unauthorized_is_specific() {
      let body = r#"{"error":{"message":"invalid token"}}"#.to_string();

      let error = categorize_get_video_task_error(StatusCode::UNAUTHORIZED, body, "task_abc123");

      match error {
        CometError::ApiSpecific(CometSpecificApiError::UnauthorizedInvalidApiKey { .. }) => {}
        other => panic!("Expected UnauthorizedInvalidApiKey, got: {:?}", other),
      }
    }
  }
}
