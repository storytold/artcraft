use anyhow::anyhow;

use mysql_queries::payloads::generic_inference_args::generic_inference_args::{InferenceCategoryAbbreviated, PolymorphicInferenceArgs};
use mysql_queries::payloads::generic_inference_args::inner_payloads::videofilter_payload::VideofilterVideoSource;
use mysql_queries::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;
use tokens::tokens::model_weights::ModelWeightToken;

use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;

pub struct JobArgs<'a> {
  pub video_source: &'a VideofilterVideoSource,
  pub sd_model_token: &'a ModelWeightToken,
  pub lora_model_token: &'a Option<ModelWeightToken>,
  pub prompt: &'a str,
  pub a_prompt: &'a str,
  pub n_prompt: &'a str,
  pub seed: Option<i32>,
}

pub fn validate_job(job: &AvailableInferenceJob) -> Result<JobArgs, ProcessSingleJobError> {
  let inference_args = job.maybe_inference_args
      .as_ref()
      .map(|args| args.args.as_ref())
      .flatten();

  let inference_category = job.maybe_inference_args
      .as_ref()
      .map(|args| args.inference_category)
      .flatten();

  match inference_category {
    Some(InferenceCategoryAbbreviated::VideoFilter) => {}, // Valid
    Some(category) => {
      return Err(ProcessSingleJobError::from_anyhow_error(anyhow!("wrong inference category for job: {:?}", category)));
    },
    None => {
      return Err(ProcessSingleJobError::from_anyhow_error(anyhow!("no inference category for job!")));
    }
  };

  let inference_args = match inference_args {
    Some(args) => args,
    None => {
      return Err(ProcessSingleJobError::from_anyhow_error(anyhow!("no inference args for job!")));
    }
  };

  let inference_args = match inference_args {
    PolymorphicInferenceArgs::Rr(inference_args) => inference_args,
    _ => {
      return Err(ProcessSingleJobError::from_anyhow_error(anyhow!("wrong inner args for job!")));
    }
  };

  let video_source = match &inference_args.maybe_video_source {
    Some(args) => args,
    None => {
      return Err(ProcessSingleJobError::from_anyhow_error(anyhow!("no video source!")));
    }
  };

  let sd_model_token = match &inference_args.maybe_sd_model_token {
    Some(args) => args,
    None => {
      return Err(ProcessSingleJobError::from_anyhow_error(anyhow!("no sd model!")));
    }
  };

  let prompt = match &inference_args.maybe_prompt {
    Some(args) => args,
    None => {
      return Err(ProcessSingleJobError::from_anyhow_error(anyhow!("no prompt!")));
    }
  };

  let a_prompt = match &inference_args.maybe_a_prompt {
      Some(args) => args,
      None => {
      return Err(ProcessSingleJobError::from_anyhow_error(anyhow!("no a prompt!")));
      }
  };

  let n_prompt = match &inference_args.maybe_n_prompt {
      Some(args) => args,
      None => {
      return Err(ProcessSingleJobError::from_anyhow_error(anyhow!("no n prompt!")));
      }
  };

  Ok(JobArgs {
    video_source,
    sd_model_token,
    lora_model_token: &inference_args.maybe_lora_model_token,
    prompt,
    a_prompt,
    n_prompt,
    seed: inference_args.maybe_seed,
  })
}
