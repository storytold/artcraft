use anyhow::anyhow;

use mysql_queries::payloads::generic_inference_args::generic_inference_args::{InferenceCategoryAbbreviated, PolymorphicInferenceArgs};
use mysql_queries::payloads::generic_inference_args::inner_payloads::mocap_payload::MocapVideoSource;
use mysql_queries::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;

use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;

pub struct JobArgs<'a> {
    pub video_source: &'a MocapVideoSource,
    pub maybe_ik1: Option<&'a f32>,
    pub maybe_ik2: Option<&'a i32>,
    pub maybe_ik3: Option<&'a i32>,
    pub maybe_smoothing1: Option<&'a f32>,
    pub maybe_smoothing2: Option<&'a f32>,
    pub maybe_size1: Option<&'a i32>,
    pub maybe_size2: Option<&'a i32>,
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
        Some(InferenceCategoryAbbreviated::Mocap) => {}, // Valid
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
        PolymorphicInferenceArgs::Mc(inference_args) => inference_args,
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

    Ok(JobArgs {
        video_source,
        maybe_ik1: inference_args.maybe_ik1.as_ref(),
        maybe_ik2: inference_args.maybe_ik2.as_ref(),
        maybe_ik3: inference_args.maybe_ik3.as_ref(),
        maybe_smoothing1: inference_args.maybe_smoothing1.as_ref(),
        maybe_smoothing2: inference_args.maybe_smoothing2.as_ref(),
        maybe_size1: inference_args.maybe_size1.as_ref(),
        maybe_size2: inference_args.maybe_size2.as_ref(),
    })
}
