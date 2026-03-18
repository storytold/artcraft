use anyhow::anyhow;

use mysql_queries::payloads::generic_inference_args::generic_inference_args::PolymorphicInferenceArgs;
use mysql_queries::payloads::generic_inference_args::inner_payloads::face_fusion_payload::FaceFusionPayload;
use mysql_queries::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;

use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::util::extractors::get_polymorphic_args_from_job::get_polymorphic_args_from_job;

pub fn extract_face_fusion_payload_from_job(
  job: &AvailableInferenceJob,
) -> Result<FaceFusionPayload, ProcessSingleJobError> {

  let polymorphic_args = get_polymorphic_args_from_job(&job)?;

  let some_args = match polymorphic_args {
    PolymorphicInferenceArgs::Ff(payload) => payload.clone(),
    _ => {
      return Err(
        ProcessSingleJobError::from_anyhow_error(anyhow!("wrong inner args for job!"))
      );
    }
  };

  Ok(some_args)
}
