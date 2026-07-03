use actix_web::HttpResponse;
use chrono::Utc;
use log::error;

use crate::http_server::common_responses::common_web_error::CommonWebError;

/// How fast the frontend should poll this endpoint. Effectively "never" —
/// the endpoint is retired and only zombie traffic hits it.
const REFRESH_INTERVAL_MILLIS: u64 = 1_000_000;

#[derive(Serialize)]
pub struct Response {
  pub success: bool,
  pub pending_job_count: u64,
  pub cache_time: chrono::NaiveDateTime,

  /// Tell the frontend client how fast to refresh their view of this list.
  pub refresh_interval_millis: u64,
}

/// RETIRED endpoint that still receives heavy zombie traffic (~300 rpm).
///
/// The TTS queue no longer exists, so this returns a hardcoded zero without
/// touching the cache or the database.
pub async fn get_pending_tts_inference_job_count_handler() -> Result<HttpResponse, CommonWebError> {
  let response = Response {
    success: true,
    pending_job_count: 0,
    cache_time: Utc::now().naive_utc(),
    refresh_interval_millis: REFRESH_INTERVAL_MILLIS,
  };

  let body = serde_json::to_string(&response)
      .map_err(|e| {
        error!("error returning response: {:?}", e);
        CommonWebError::from_error(e)
      })?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
