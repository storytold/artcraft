use actix_web::web::Json;
use utoipa::ToSchema;

/// Sentinel job token returned to legacy clients now that TTS inference is shut down.
/// There is no real job behind it; status polls for it will never complete.
const SYNTHETIC_INFERENCE_JOB_TOKEN: &str = "synthetic_too_many_requests";

#[derive(Serialize, ToSchema)]
pub struct InferTtsSuccessResponse {
  pub success: bool,
  pub inference_job_token: String,
  pub inference_job_token_type: InferenceJobTokenType,
}

/// Tell the frontend how to deal with the tts queue.
#[derive(Serialize, ToSchema)]
pub enum InferenceJobTokenType {
  /// Legacy TTS inference job
  #[serde(rename = "legacy_tts")]
  LegacyTts,

  /// Modern shared inference type
  #[serde(rename = "generic")]
  Generic,
}

/// [DEPRECATED] Enqueue a legacy TTS inference request.
///
/// Legacy TTS inference is shut down. This endpoint unconditionally returns a
/// canned success response with a synthetic job token so old clients don't error.
#[utoipa::path(
  post,
  tag = "TTS",
  path = "/v1/tts/inference",
  responses(
    (status = 200, description = "Success response", body = InferTtsSuccessResponse),
  ),
)]
pub async fn enqueue_infer_tts_handler() -> Json<InferTtsSuccessResponse> {
  Json(InferTtsSuccessResponse {
    success: true,
    inference_job_token: SYNTHETIC_INFERENCE_JOB_TOKEN.to_string(),
    inference_job_token_type: InferenceJobTokenType::Generic,
  })
}
