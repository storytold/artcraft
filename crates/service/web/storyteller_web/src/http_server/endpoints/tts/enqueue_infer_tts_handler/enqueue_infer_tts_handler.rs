use actix_web::http::StatusCode;
use actix_web::HttpResponse;

use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;

/// [DEPRECATED] Enqueue a legacy TTS inference request.
///
/// Legacy TTS inference is shut down. This endpoint unconditionally
/// returns 429 Too Many Requests so old clients back off.
#[utoipa::path(
  post,
  tag = "TTS",
  path = "/v1/tts/inference",
  responses(
    (status = 429, description = "Rate limited"),
  ),
)]
pub async fn enqueue_infer_tts_handler() -> HttpResponse {
  to_simple_json_error("rate limited", StatusCode::TOO_MANY_REQUESTS)
}
