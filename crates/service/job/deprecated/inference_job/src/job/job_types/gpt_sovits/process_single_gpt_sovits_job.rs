use anyhow::anyhow;

use enums::by_table::generic_inference_jobs::inference_job_type::InferenceJobType;
use mysql_queries::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;

use crate::job::job_loop::job_success_result::JobSuccessResult;
use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job::job_types::gpt_sovits::tts_inference::process_single_gpt_sovits_tts_job::process_single_gpt_sovits_tts_job;
use crate::job::job_types::gpt_sovits::upload_model::process_gpt_sovits_upload_job::process_gpt_sovits_upload_job;
use crate::state::job_dependencies::JobDependencies;

pub async fn process_single_gpt_sovits_job(
  job_dependencies: &JobDependencies,
  job: &AvailableInferenceJob
) -> Result<JobSuccessResult, ProcessSingleJobError> {
  return match job.job_type {
    InferenceJobType::GptSovits => {
      match job.maybe_download_url {
        Some(_) => {
          let job_success_result = process_gpt_sovits_upload_job(job_dependencies, job).await?;
          Ok(job_success_result)
        }
        None => {
          let job_success_result = process_single_gpt_sovits_tts_job(job_dependencies, job).await?;
          Ok(job_success_result)
        }
      }
    }
    _ => {
      Err(ProcessSingleJobError::Other(anyhow!("job type not set")))
    }
  }
}