use std::cmp::min;

use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
use enums::by_table::generic_inference_jobs::inference_job_product_category::InferenceJobProductCategory;
use enums::common::job_status_plus::JobStatusPlus;
use mysql_queries::payloads::generic_inference_args::generic_inference_args::PolymorphicInferenceArgs;
use mysql_queries::queries::generic_inference::web::job_status::GenericInferenceJobStatus;

use crate::http_server::endpoints::inference_job::utils::estimates::comfy_workflow_estimate::comfy_workflow_estimate;
use crate::http_server::endpoints::inference_job::utils::estimates::percent::percent;

// TODO: These numbers are made up. We should measure the average job durations.
const TTS_JOB_AVERAGE_SECONDS : u64 = 7;
const VC_JOB_AVERAGE_SECONDS : u64 = 90;

const LIVE_PORTRAIT_JOB_AVERAGE_SECONDS : u64 = 90;

/// Lipsync with face fusion
const VID_FACE_FUSION_AVERAGE_SECONDS : u64 = 45;

/// Lipsync with SadTalker (super old and slow)
const LIPSYNC_JOB_AVERAGE_SECONDS : u64 = 60 * 3;

const F5_TTS_JOB_AVERAGE_SECONDS : u64 = 12;

const SEED_VC_JOB_AVERAGE_SECONDS : u64 = 60;

pub fn estimate_job_progress(job: &GenericInferenceJobStatus, maybe_args: Option<&PolymorphicInferenceArgs>) -> u8 {
  match job.status {
    // Jobs that haven't started
    JobStatusPlus::Pending
    | JobStatusPlus::AttemptFailed => return 0,
    // Jobs that are "done"
    JobStatusPlus::CompleteSuccess
    | JobStatusPlus::CompleteFailure
    | JobStatusPlus::Dead
    | JobStatusPlus::CancelledByUser
    | JobStatusPlus::CancelledBySystem => return 100,
    // Fall through
    JobStatusPlus::Started => {}
  }

  // TODO: This is inaccurate under retries
  //  "mark_generic_inference_job_pending_and_grab_lock" only sets "maybe_first_started_at"
  //  for the first execution, not retries. It's not clear that this is a valuable behavior,
  //  and perhaps the code should be updated to always write every job attempt's start time.
  let started_at= job.maybe_first_started_at.unwrap_or(job.created_at);

  let now = job.database_clock;

  if started_at > now {
    return 0; // We shouldn't see clock skew unless we read from a DB replica.
  }

  let duration = now.signed_duration_since(started_at);
  let duration_seconds = duration.num_seconds().abs() as u64;

  // TODO: Estimate functions based on duration for each job type
  //  This might also take parameters: the job arguments, text length,
  //  video length (currently unavailable - we'll need to put that in the
  //  job metadata), etc.
  let mut progress = match job.request_details.inference_category {
    // TODO: Better estimates for each of these job types.
    InferenceCategory::LipsyncAnimation => percent(duration_seconds, LIPSYNC_JOB_AVERAGE_SECONDS),
    InferenceCategory::TextToSpeech => percent(duration_seconds, TTS_JOB_AVERAGE_SECONDS),
    InferenceCategory::VoiceConversion => percent(duration_seconds, VC_JOB_AVERAGE_SECONDS),
    InferenceCategory::LivePortrait => percent(duration_seconds, LIVE_PORTRAIT_JOB_AVERAGE_SECONDS),
    InferenceCategory::F5TTS => percent(duration_seconds, F5_TTS_JOB_AVERAGE_SECONDS),
    InferenceCategory::SeedVc => percent(duration_seconds, SEED_VC_JOB_AVERAGE_SECONDS),

    // TODO: Better estimate using video duration, params, etc.
    InferenceCategory::Workflow => comfy_workflow_estimate(maybe_args, duration_seconds),

    // NB: We don't run these job types anymore.
    InferenceCategory::FormatConversion => 0,
    InferenceCategory::Mocap => 0,
    InferenceCategory::ImageGeneration => 0,
    InferenceCategory::VideoFilter => 0,
    InferenceCategory::ConvertBvhToWorkflow => 0,
    InferenceCategory::DeprecatedField => 0, // TODO(bt,2024-07-16): Read job type instead.
  };

  // For some products/models that didn't get matched above
  match job.request_details.maybe_product_category {
    Some(InferenceJobProductCategory::VidFaceFusion) => {
      progress = percent(duration_seconds, VID_FACE_FUSION_AVERAGE_SECONDS);
    }
    _ => {}, // Intentional Fallthrough
  }

  // We shouldn't show 100% if the job isn't complete.
  min(progress, 95)
}

#[cfg(test)]
mod tests {
  use chrono::{Duration, Utc};

  use enums::common::job_status_plus::JobStatusPlus;
  use mysql_queries::queries::generic_inference::web::job_status::GenericInferenceJobStatus;

  use crate::http_server::endpoints::inference_job::utils::estimates::estimate_job_progress::estimate_job_progress;

  #[test]
  fn test_pending() {
    let mut job = GenericInferenceJobStatus::default();
    job.status = JobStatusPlus::Pending;
    assert_eq!(0, estimate_job_progress(&job, None));
  }

  #[test]
  fn test_complete_success() {
    let mut job = GenericInferenceJobStatus::default();
    job.status = JobStatusPlus::CompleteSuccess;
    assert_eq!(100, estimate_job_progress(&job, None));
  }

  mod running_jobs {
    use super::*;

    #[test]
    fn test_started_just_now() {
      let mut job = GenericInferenceJobStatus::default();
      job.status = JobStatusPlus::Started;
      job.created_at = Utc::now();
      job.maybe_first_started_at = Some(Utc::now());
      job.database_clock = Utc::now();
      assert_eq!(0, estimate_job_progress(&job, None));
    }

    #[test]
    fn test_started_shortly_ago() {
      let mut job = GenericInferenceJobStatus::default();
      job.status = JobStatusPlus::Started;
      job.created_at = Utc::now() - Duration::seconds(10);
      job.maybe_first_started_at = Some(Utc::now() - Duration::seconds(10));
      job.database_clock = Utc::now();
      assert_eq!(5, estimate_job_progress(&job, None));
    }

    #[test]
    fn test_started_long_ago() {
      let mut job = GenericInferenceJobStatus::default();
      job.status = JobStatusPlus::Started;
      job.created_at = Utc::now() - Duration::days(10);
      job.maybe_first_started_at = Some(Utc::now() - Duration::days(10));
      job.database_clock = Utc::now();
      assert_eq!(95, estimate_job_progress(&job, None));
    }
  }
}
