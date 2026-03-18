use std::collections::HashMap;

use anyhow::anyhow;

use mysql_queries::payloads::generic_inference_args::generic_inference_args::{InferenceCategoryAbbreviated, PolymorphicInferenceArgs};
use mysql_queries::payloads::generic_inference_args::inner_payloads::workflow_payload::NewValue;
use mysql_queries::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::model_weights::ModelWeightToken;

use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;

#[derive(Serialize, Debug)]
pub struct JobArgs<'a> {
    pub workflow_source: &'a Option<ModelWeightToken>,
    pub output_path: &'a str,
    pub maybe_json_modifications: &'a Option<HashMap<String, NewValue>>,
    pub maybe_lora_model: &'a Option<ModelWeightToken>,
    pub maybe_input_file: &'a Option<MediaFileToken>,

    // Secondary videos (optional) that aid processing
    pub maybe_depth_input_file: Option<&'a MediaFileToken>,
    pub maybe_normal_input_file: Option<&'a MediaFileToken>,
    pub maybe_outline_input_file: Option<&'a MediaFileToken>,
}

pub fn check_and_validate_job(job: &AvailableInferenceJob) -> Result<JobArgs, ProcessSingleJobError> {
    let inference_args = job.maybe_inference_args
        .as_ref()
        .map(|args| args.args.as_ref())
        .flatten();

    let inference_category = job.maybe_inference_args
        .as_ref()
        .map(|args| args.inference_category)
        .flatten();

    match inference_category {
        Some(InferenceCategoryAbbreviated::Workflow) => {}, // Valid
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
        PolymorphicInferenceArgs::Cu(inference_args) => inference_args,
        _ => {
            return Err(ProcessSingleJobError::from_anyhow_error(anyhow!("wrong inner args for job!")));
        }
    };

    // check if job is legacy
    let is_legacy = inference_args.maybe_json_modifications.is_some();

    let output_path = match inference_args.maybe_output_path.as_deref() {
        Some(args) => args,
        None if is_legacy => {
            return Err(ProcessSingleJobError::from_anyhow_error(anyhow!("No output path provided!")));
        },
        None => {
            "vid2vid/SparseUpscaleInterp_00001.mp4"
        }
    };

    Ok(JobArgs {
        workflow_source: &inference_args.maybe_workflow_config,
        output_path,
        maybe_lora_model: &inference_args.maybe_lora_model,
        maybe_json_modifications: &inference_args.maybe_json_modifications,
        maybe_input_file: &inference_args.maybe_input_file,
        maybe_depth_input_file: inference_args.maybe_input_depth_file.as_ref(),
        maybe_normal_input_file: inference_args.maybe_input_normal_file.as_ref(),
        maybe_outline_input_file: inference_args.maybe_input_outline_file.as_ref(),
    })
}
