use anyhow::anyhow;

use mysql_queries::payloads::generic_inference_args::generic_inference_args::{InferenceCategoryAbbreviated, PolymorphicInferenceArgs};
use mysql_queries::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;

use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;

#[derive(Serialize, Debug)]
pub struct JobArgs {
  pub input_text: String,
  pub target_language: Option<String>,
  pub maybe_truncate_seconds: Option<u32>,
}

pub fn check_and_validate_job(job: &AvailableInferenceJob) -> Result<JobArgs, ProcessSingleJobError> {
  let inference_category = job.maybe_inference_args
    .as_ref()
    .map(|args| args.inference_category)
    .flatten();

  match inference_category {
    Some(InferenceCategoryAbbreviated::TextToSpeech) => {},
    _ => {
      return Err(ProcessSingleJobError::from_anyhow_error(anyhow!("wrong inference category for job!")));
    }
  };

  let _inference_args = job.maybe_inference_args
      .as_ref()
      .map(|args| args.args.as_ref())
      .flatten()
      .map(|args| match args {
        PolymorphicInferenceArgs::Ft(args) => Ok(args),
        _ => Err(ProcessSingleJobError::from_anyhow_error(anyhow!("wrong payload for job!"))),
      })
      .transpose()?
      .ok_or_else(|| ProcessSingleJobError::from_anyhow_error(anyhow!("no inference args for job!")))?;

  let input_text = match &job.maybe_raw_inference_text {
    Some(text) => text.clone(),
    None => {
      return Err(ProcessSingleJobError::from_anyhow_error(anyhow!("no raw inference text for job!")));
    }
  };

  let maybe_truncate_seconds = if job.max_duration_seconds <= 0 {
    None
  } else {
    Some(job.max_duration_seconds as u32)
  };

  Ok(JobArgs {
    input_text,
    target_language: None,
    maybe_truncate_seconds,
  })
}
