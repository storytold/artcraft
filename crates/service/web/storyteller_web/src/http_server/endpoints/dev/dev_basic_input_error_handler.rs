use actix_web::HttpResponse;

use crate::http_server::common_responses::common_web_error::CommonWebError;

/// Dev-only endpoint that unconditionally returns a `BadInputWithSimpleMessage`
/// so we can exercise error paths (paging, response shape, etc.) end-to-end.
#[utoipa::path(
  get,
  tag = "Dev",
  path = "/v1/dev/basic_input_error",
  responses(
    (status = 400, description = "Always returns this — that's the point"),
  ),
)]
pub async fn dev_basic_input_error_handler() -> Result<HttpResponse, CommonWebError> {
  Err(CommonWebError::BadInputWithSimpleMessage("testing".to_string()))
}
