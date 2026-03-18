use enums::by_table::generic_inference_jobs::inference_job_type::InferenceJobType;
use enums::by_table::generic_inference_jobs::inference_model_type::InferenceModelType;
use errors::anyhow;
use log::info;
use mysql_queries::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;

use crate::job::job_loop::job_success_result::JobSuccessResult;
use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job::job_types::image_generation::sd::process_job::process_job_selection;
use crate::job::job_types::image_generation::sd::process_job::StableDiffusionProcessArgs;
use crate::state::job_dependencies::JobDependencies;

pub async fn process_single_ig_job(job_dependencies: &JobDependencies, job: &AvailableInferenceJob) -> Result<JobSuccessResult, ProcessSingleJobError> {
  info!(
    "Processing single image generation job. \
    \n - Job Token: {:?}\
    \n - Job Type: {:?}\
    \n - Inference Category: {:?}\
    \n - Maybe Model Type: {:?}",
    job.inference_job_token,
    job.job_type,
    job.inference_category,
    job.maybe_model_type
  );

  match job.job_type {
    InferenceJobType::ImageGenApi => {
      Err(ProcessSingleJobError::Other(anyhow!("ImageGenAPI (Sora) jobs are no longer supported")))
    },
    _ => {
      info!("Processing image job as **NOT** ImageGenApi. Type: {:?}", job.job_type);
      match job.maybe_model_type {
        Some(InferenceModelType::StableDiffusion) => dispatch_sd_job(job_dependencies, job).await,
        Some(other_model_type) => Err(ProcessSingleJobError::Other(anyhow!("Wrong model type for SD: {:?}", other_model_type))),
        None => Err(ProcessSingleJobError::Other(anyhow!("SD model type not set"))),
      }
    },
  }
}

pub async fn dispatch_sd_job(job_dependencies: &JobDependencies, job: &AvailableInferenceJob) -> Result<JobSuccessResult, ProcessSingleJobError> {
  let args = StableDiffusionProcessArgs { job_dependencies, job };
  process_job_selection(args).await
}
