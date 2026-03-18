use anyhow::anyhow;

use enums::by_table::generic_inference_jobs::inference_model_type::InferenceModelType;
use mysql_queries::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;

use crate::job::job_loop::job_success_result::JobSuccessResult;
use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job::job_types::lipsync::sad_talker;
use crate::job::job_types::lipsync::sad_talker::process_job::SadTalkerProcessJobArgs;
use crate::state::job_dependencies::JobDependencies;

pub async fn process_single_lipsync_job(job_dependencies: &JobDependencies, job: &AvailableInferenceJob) -> Result<JobSuccessResult, ProcessSingleJobError> {

  let job_success_result = match job.maybe_model_type {
    Some(InferenceModelType::SadTalker) => {
      sad_talker::process_job::process_job(SadTalkerProcessJobArgs {
        job_dependencies,
        job,
      }).await?
    }
    Some(model_type) => return Err(ProcessSingleJobError::Other(anyhow!("wrong model type: {:?}", model_type))),
    None => return Err(ProcessSingleJobError::Other(anyhow!("no model type in record"))),
  };

  Ok(job_success_result)
}
