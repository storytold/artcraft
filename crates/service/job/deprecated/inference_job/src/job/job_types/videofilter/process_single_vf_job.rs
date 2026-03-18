use mysql_queries::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;

use crate::job::job_loop::job_success_result::JobSuccessResult;
use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job::job_types::videofilter::rerender_a_video;
use crate::job::job_types::videofilter::rerender_a_video::process_job::RerenderProcessJobArgs;
use crate::state::job_dependencies::JobDependencies;

pub async fn process_single_vf_job(job_dependencies: &JobDependencies, job: &AvailableInferenceJob) -> Result<JobSuccessResult, ProcessSingleJobError> {
    let job_success_result = rerender_a_video::process_job::process_job(
        RerenderProcessJobArgs {
            job_dependencies,
            job,
            // media_file
        }
    ).await?;

    Ok(job_success_result)
}
