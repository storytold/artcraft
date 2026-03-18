use anyhow::anyhow;
use log::info;
use enums::by_table::generic_inference_jobs::inference_job_type::InferenceJobType;
use mysql_queries::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;

use crate::job::job_loop::job_success_result::JobSuccessResult;
use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job::job_types::vc::rvc_v2::process_rvc_job_old_entrypoint_adapter::process_rvc_job_old_entrypoint_adapter;
use crate::state::job_dependencies::JobDependencies;

pub async fn dispatch_rvc_v2_job(
  job_dependencies: &JobDependencies,
  job: &AvailableInferenceJob
) -> Result<JobSuccessResult, ProcessSingleJobError> {

  info!("New dispatch route(2024-09-04): dispatch_rvc_v2_job instead of process_single_vc_job");

  return match job.job_type {
    InferenceJobType::RvcV2 => {
      match job.maybe_download_url {
        Some(_) => {
          // TODO(bt,2024-09-04): Support RVC uploads
          Err(ProcessSingleJobError::Other(anyhow!("RVC uploads not yet supported!")))
        }
        None => {
          let job_success_result = process_rvc_job_old_entrypoint_adapter(
            job_dependencies,
            job
          ).await?;
          Ok(job_success_result)
        }
      }
    }
    _ => {
      Err(ProcessSingleJobError::Other(anyhow!("job type not set (new rvc code path)")))
    }
  }
}
