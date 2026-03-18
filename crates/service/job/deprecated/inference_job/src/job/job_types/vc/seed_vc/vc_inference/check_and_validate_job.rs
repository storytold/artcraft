use anyhow::anyhow;

use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use mysql_queries::payloads::generic_inference_args::generic_inference_args::{InferenceCategoryAbbreviated, PolymorphicInferenceArgs};
use mysql_queries::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;
use tokens::tokens::media_files::MediaFileToken;

#[derive(Serialize, Debug)]
pub struct JobArgs {
  pub target_language: Option<String>,
  pub maybe_truncate_seconds: Option<u32>,
  pub source_inference_media: MediaFileToken,
  pub reference_inference_media: MediaFileToken,
}

pub fn check_and_validate_job(job: &AvailableInferenceJob) -> Result<JobArgs, ProcessSingleJobError> {
  let inference_category = job.maybe_inference_args
    .as_ref()
    .map(|args| args.inference_category)
    .flatten();

  match inference_category {
    Some(InferenceCategoryAbbreviated::VoiceConversion) | Some(InferenceCategoryAbbreviated::SeedVc) => {},
    _ => {
      return Err(ProcessSingleJobError::from_anyhow_error(anyhow!("wrong inference category for job!")));
    }
  };

  let inference_args = job.maybe_inference_args
      .as_ref()
      .map(|args| args.args.as_ref())
      .flatten()
      .map(|args| match args {
        PolymorphicInferenceArgs::Sv(args) => Ok(args),
        _ => Err(ProcessSingleJobError::from_anyhow_error(anyhow!("wrong payload for job!"))),
      })
      .transpose()?
      .ok_or_else(|| ProcessSingleJobError::from_anyhow_error(anyhow!("no inference args for job!")))?;

  let input_media_file_token = match &job.maybe_input_source_token {
    Some(text) => MediaFileToken::new_from_str(text.clone().as_ref()),
    None => {
      return Err(ProcessSingleJobError::from_anyhow_error(anyhow!("no source media token for job!")));
    }
  };

  let reference_media_file_token = match &inference_args.reference_media_file_token {
    Some(text) => text.clone(),
    None => {
      return Err(ProcessSingleJobError::from_anyhow_error(anyhow!("no reference media token for job!")));
    }
  };

  let maybe_truncate_seconds = if job.max_duration_seconds <= 0 {
    None
  } else {
    Some(job.max_duration_seconds as u32)
  };

  Ok(JobArgs {
    target_language: None,
    source_inference_media: input_media_file_token,
    reference_inference_media: reference_media_file_token,
    maybe_truncate_seconds,
  })
}
