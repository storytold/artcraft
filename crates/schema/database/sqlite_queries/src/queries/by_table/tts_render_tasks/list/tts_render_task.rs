use enums_db::by_table::tts_render_tasks::tts_render_status::TtsRenderStatus;
use tokens::tokens::tts_render_tasks::TtsRenderTaskToken;

pub struct TtsRenderTask {
  pub id: i64,
  pub token: TtsRenderTaskToken,

  // Composite foreign key
  pub story_type: String,
  pub story_token: String,

  pub sequence_order: i64,

  pub tts_service: String,
  pub tts_voice_identifier: String,

  pub full_text: String,

  // Token for in-progress render jobs.
  pub maybe_inference_job_token: Option<String>,

  // Results for finished jobs
  pub maybe_result_token: Option<String>,
  pub maybe_result_url: Option<String>,
  pub maybe_result_relative_filesystem_location: Option<String>,
  pub maybe_audio_duration_millis: Option<i64>,

  // TODO: This status appears to be an ill-fit for this job system.
  //  It can't function over *two* queues (render/download) and has weird enum states.
  pub tts_render_status: TtsRenderStatus,
  pub tts_render_attempts: i64,
}
