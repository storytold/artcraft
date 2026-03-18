use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;

pub fn categorize_error(_stderr_contents: &str) -> Option<ProcessSingleJobError> {
    None
}
