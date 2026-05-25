use actix_web::HttpResponse;
use serde_derive::Serialize;

use crate::http_server::common_responses::common_web_error::CommonWebError;

/// Dev-only endpoint that unconditionally returns a `BadInputTailoredResponse`
/// carrying a per-field validation payload, so we can exercise the tailored
/// 400 response shape end-to-end.
#[utoipa::path(
  get,
  tag = "Dev",
  path = "/v1/dev/input_error",
  responses(
    (status = 400, description = "Always returns this — that's the point"),
  ),
)]
pub async fn dev_input_error_handler() -> Result<HttpResponse, CommonWebError> {
  let body = BadInputError {
    fields: vec![
      BadFieldMessage {
        field_name: "username".to_string(),
        message: "username is taken".to_string(),
        max_length: Some(32),
        min_length: Some(3),
      },
      BadFieldMessage {
        field_name: "email".to_string(),
        message: "email is invalid".to_string(),
        max_length: None,
        min_length: None,
      },
      BadFieldMessage {
        field_name: "password".to_string(),
        message: "password is too short".to_string(),
        max_length: Some(128),
        min_length: Some(8),
      },
    ],
  };

  Err(CommonWebError::bad_input_tailored_response(body))
}

#[derive(Serialize)]
struct BadInputError {
  fields: Vec<BadFieldMessage>,
}

#[derive(Serialize)]
struct BadFieldMessage {
  field_name: String,
  message: String,
  max_length: Option<usize>,
  min_length: Option<usize>,
}
