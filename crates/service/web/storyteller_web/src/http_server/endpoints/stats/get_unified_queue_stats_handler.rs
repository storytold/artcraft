use actix_web::web::Json;
use chrono::{NaiveDateTime, Utc};
use utoipa::ToSchema;

/// The queue counts are frozen at the values from when the legacy inference
/// systems were shut down. Legacy clients still poll this endpoint, so it
/// stays mounted, but it no longer consults the database.
const FROZEN_TOTAL_PENDING_JOB_COUNT: u64 = 2_409_539;
const FROZEN_PENDING_TACOTRON2_JOBS: u64 = 1_037_783;
const FROZEN_PENDING_RVC_JOBS: u64 = 288_922;
const FROZEN_PENDING_SVC_JOBS: u64 = 27_417;
const REFRESH_INTERVAL_MILLIS: u64 = 15_000;

#[derive(Serialize, ToSchema)]
pub struct GetUnifiedQueueStatsSuccessResponse {
  pub success: bool,
  pub cache_time: NaiveDateTime,

  /// Tell the frontend client how fast to refresh their view of this list.
  pub refresh_interval_millis: u64,

  pub inference: ModernInferenceQueueStats,
  pub legacy_tts: LegacyQueueDetails,
}

#[derive(Serialize, ToSchema)]
pub struct LegacyQueueDetails {
  pub pending_job_count: u64,
}

#[derive(Serialize, ToSchema)]
pub struct ModernInferenceQueueStats {
  pub total_pending_job_count: u64,

  pub pending_job_count: u64,

  pub by_queue: ByQueueStats,
}

#[derive(Serialize, ToSchema)]
pub struct ByQueueStats {
  // Text to Speech
  pub pending_tacotron2_jobs: u64,
  pub pending_voice_designer: u64,

  // Voice Conversion
  pub pending_rvc_jobs: u64,
  pub pending_svc_jobs: u64,

  // Image
  pub pending_stable_diffusion: u64,

  // Video
  pub pending_face_animation_jobs: u64,
  pub pending_storyteller_studio: u64,
  pub pending_acting_face: u64,
}

/// [DEPRECATED] Get queue stats for legacy inference jobs (tts, voice conversion, etc.)
///
/// The legacy inference systems are gone; this returns a hardcoded snapshot
/// for old clients that still poll it.
#[utoipa::path(
  get,
  tag = "Stats",
  path = "/v1/stats/queues",
  responses(
    (status = 200, description = "Success", body = GetUnifiedQueueStatsSuccessResponse),
  ),
)]
#[deprecated(note = "legacy inference is shut down; this endpoint returns a hardcoded snapshot")]
pub async fn get_unified_queue_stats_handler() -> Json<GetUnifiedQueueStatsSuccessResponse> {
  Json(GetUnifiedQueueStatsSuccessResponse {
    success: true,
    cache_time: Utc::now().naive_utc(),
    refresh_interval_millis: REFRESH_INTERVAL_MILLIS,
    inference: ModernInferenceQueueStats {
      total_pending_job_count: FROZEN_TOTAL_PENDING_JOB_COUNT,
      pending_job_count: FROZEN_TOTAL_PENDING_JOB_COUNT,
      by_queue: ByQueueStats {
        pending_tacotron2_jobs: FROZEN_PENDING_TACOTRON2_JOBS,
        pending_voice_designer: 0,
        pending_rvc_jobs: FROZEN_PENDING_RVC_JOBS,
        pending_svc_jobs: FROZEN_PENDING_SVC_JOBS,
        pending_stable_diffusion: 0,
        pending_face_animation_jobs: 0,
        pending_storyteller_studio: 0,
        pending_acting_face: 0,
      },
    },
    legacy_tts: LegacyQueueDetails {
      pending_job_count: 0,
    },
  })
}
