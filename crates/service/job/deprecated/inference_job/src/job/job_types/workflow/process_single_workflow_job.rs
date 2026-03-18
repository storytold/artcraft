use anyhow::anyhow;

use enums::by_table::generic_inference_jobs::inference_job_type::InferenceJobType;
use mysql_queries::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;

use crate::job::job_loop::job_success_result::JobSuccessResult;
use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job::job_types::workflow::face_fusion::process_face_fusion_job::process_face_fusion_job;
use crate::job::job_types::workflow::live_portrait::process_live_portrait_job::process_live_portrait_job;
use crate::job::job_types::workflow::video_style_transfer::extract_vst_workflow_payload_from_job::extract_vst_workflow_payload_from_job;
use crate::job::job_types::workflow::video_style_transfer::process_video_style_transfer_job::process_video_style_transfer_job;
use crate::state::job_dependencies::JobDependencies;

pub async fn process_single_workflow_job(
  job_dependencies: &JobDependencies,
  job: &AvailableInferenceJob
) -> Result<JobSuccessResult, ProcessSingleJobError> {

  // First try to dispatch with the newer "job type".
  match job.job_type {
    InferenceJobType::LivePortrait => {
      let job_success_result = process_live_portrait_job(job_dependencies, job).await?;
      return Ok(job_success_result);
    }
    InferenceJobType::FaceFusion => {
      let job_success_result = process_face_fusion_job(job_dependencies, job).await?;
      return Ok(job_success_result);
    }
    _ => {} // Fall through
  }

  // If we couldn't dispatch with "job type", fall back to older heuristics.
  let workflow_args = extract_vst_workflow_payload_from_job(&job)?;

  let job_success_result = match workflow_args.maybe_google_drive_link {
    Some(_link) => {
      // NB(bt,2024-07-25): I don't think we enqueue jobs to do this anymore. This code path might be dead.
      // process_upload_workflow_job(job_dependencies, job).await?
      // NB(bt,2024-09-04): Pretty sure these are dead. We're getting invalid models via this route.
      return Err(ProcessSingleJobError::InvalidJob(anyhow!("Upload Workflow Job is no longer supported")));
    }
    None => {
      // This services both Storyteller Studio and "Video Style Transfer" products.
      process_video_style_transfer_job(job_dependencies, job).await?
    }
  };

  Ok(job_success_result)
}
