use anyhow::anyhow;

use enums::by_table::generic_inference_jobs::inference_job_type::InferenceJobType;
use mysql_queries::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;

use crate::job::job_loop::job_success_result::JobSuccessResult;
use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job::job_types::vc::seed_vc::vc_inference::process_single_seed_vc_job::process_single_seed_vc_inference_job;
use crate::state::job_dependencies::JobDependencies;

pub async fn process_single_seed_vc_job(
  job_dependencies: &JobDependencies,
  job: &AvailableInferenceJob
) -> Result<JobSuccessResult, ProcessSingleJobError> {
  return match job.job_type {
    InferenceJobType::SeedVc => {
          let job_success_result = process_single_seed_vc_inference_job(job_dependencies, job).await?;
          Ok(job_success_result)
      }
    _ => {
      Err(ProcessSingleJobError::Other(anyhow!("job type not set")))
    }
  }
}