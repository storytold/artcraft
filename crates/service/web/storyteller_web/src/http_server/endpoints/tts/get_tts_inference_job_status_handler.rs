use actix_web::web::Json;
use actix_web::web::Path;
use chrono::{DateTime, Utc};

use crate::http_server::common_responses::common_web_error::CommonWebError;

/// Terminal status reported for every job so legacy clients stop polling.
const SYNTHETIC_JOB_STATUS: &str = "dead";

const SYNTHETIC_MODEL_TOKEN: &str = "synthetic_model_token";
const SYNTHETIC_MODEL_TITLE: &str = "Legacy TTS is retired";
const SYNTHETIC_MODEL_TYPE: &str = "tacotron2";

/// For the URL PathInfo
#[derive(Deserialize)]
pub struct GetTtsInferenceStatusPathInfo {
  token: String,
}

#[derive(Serialize)]
pub struct GetTtsInferenceStatusSuccessResponse {
  pub success: bool,
  pub state: TtsInferenceJobStatusForResponse,
}

#[derive(Serialize)]
pub struct TtsInferenceJobStatusForResponse {
  pub job_token: String,

  /// Primary status from the database (a state machine).
  pub status: String,

  /// Extra, temporary status from Redis.
  /// This can denote inference progress, and the Python code can write to it.
  pub maybe_extra_status_description: Option<String>,

  pub attempt_count: u8,

  pub maybe_result_token: Option<String>,
  pub maybe_public_bucket_wav_audio_path: Option<String>,

  pub model_token: String,
  pub tts_model_type: String,
  pub title: String, // Name of the TTS model

  pub raw_inference_text: String, // User text

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

/// RETIRED endpoint that still receives heavy zombie traffic.
///
/// Legacy TTS inference is shut down and the job tables are no longer served.
/// Every job is reported as terminally "dead" (without touching MySQL or
/// Redis) so old clients stop polling.
pub async fn get_tts_inference_job_status_handler(
  path: Path<GetTtsInferenceStatusPathInfo>,
) -> Result<Json<GetTtsInferenceStatusSuccessResponse>, CommonWebError> {
  let job_token = path.into_inner().token;

  if job_token.trim() == "None" {
    // NB: A bunch of Python clients use our API and can fail in this manner.
    // This was a large traffic driver during the 2023-03-08 outage.
    return Err(CommonWebError::NotFound);
  }

  let now = Utc::now();

  Ok(Json(GetTtsInferenceStatusSuccessResponse {
    success: true,
    state: TtsInferenceJobStatusForResponse {
      job_token,
      status: SYNTHETIC_JOB_STATUS.to_string(),
      maybe_extra_status_description: None,
      attempt_count: 1,
      maybe_result_token: None,
      maybe_public_bucket_wav_audio_path: None,
      model_token: SYNTHETIC_MODEL_TOKEN.to_string(),
      tts_model_type: SYNTHETIC_MODEL_TYPE.to_string(),
      title: SYNTHETIC_MODEL_TITLE.to_string(),
      raw_inference_text: String::new(),
      created_at: now,
      updated_at: now,
    },
  }))
}
