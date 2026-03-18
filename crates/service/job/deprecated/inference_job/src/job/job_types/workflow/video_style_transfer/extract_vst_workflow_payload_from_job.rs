use errors::anyhow;
use mysql_queries::payloads::generic_inference_args::generic_inference_args::PolymorphicInferenceArgs;
use mysql_queries::payloads::generic_inference_args::inner_payloads::workflow_payload::WorkflowArgs;
use mysql_queries::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;

use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::util::extractors::get_polymorphic_args_from_job::get_polymorphic_args_from_job;

pub fn extract_vst_workflow_payload_from_job(
  job: &AvailableInferenceJob,
) -> Result<WorkflowArgs, ProcessSingleJobError> {

  let polymorphic_args = get_polymorphic_args_from_job(&job)?;

  let some_args = match polymorphic_args {
    PolymorphicInferenceArgs::Cu(args) => args,
    _ => {
      return Err(
        ProcessSingleJobError::from_anyhow_error(anyhow!("wrong inner args for job!"))
      );
    }
  };

  let args: WorkflowArgs = WorkflowArgs::from(some_args.clone());

  Ok(args)
}
