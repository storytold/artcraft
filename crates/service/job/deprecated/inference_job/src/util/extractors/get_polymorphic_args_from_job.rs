use anyhow::anyhow;

use mysql_queries::payloads::generic_inference_args::generic_inference_args::{GenericInferenceArgs, PolymorphicInferenceArgs};
use mysql_queries::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;

use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;

pub fn get_polymorphic_args_from_job(job: &AvailableInferenceJob)
  -> Result<&PolymorphicInferenceArgs, ProcessSingleJobError>
{
  let inference_args = job.maybe_inference_args
      .as_ref()
      .map(|args: &GenericInferenceArgs| args.args.as_ref())
      .flatten();

  match inference_args {
    Some(args) => Ok(args),
    None => Err(ProcessSingleJobError::from_anyhow_error(anyhow!("no inference args for job!")))
  }
}