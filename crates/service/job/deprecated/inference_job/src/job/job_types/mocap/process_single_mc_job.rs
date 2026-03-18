use mysql_queries::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;

use crate::job::job_loop::job_success_result::JobSuccessResult;
use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job::job_types::mocap::mocap_net;
use crate::state::job_dependencies::JobDependencies;

pub async fn process_single_mc_job(job_dependencies: &JobDependencies, job: &AvailableInferenceJob) -> Result<JobSuccessResult, ProcessSingleJobError> {
    let job_success_result = mocap_net::process_job::process_job(
        mocap_net::process_job::MocapNetProcessJobArgs {
            job_dependencies,
            job,
        }
    ).await?;

    Ok(job_success_result)
}
