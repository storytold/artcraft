use anyhow::anyhow;

use mysql_queries::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;

use crate::job::job_loop::job_success_result::JobSuccessResult;
use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job::job_types::tts::styletts2::process_job_create_voice::process_create_voice;
use crate::job::job_types::tts::styletts2::process_job_inference_voice::process_inference_voice;
use crate::job::job_types::tts::styletts2::validate_job::validate_job;
use crate::state::job_dependencies::JobDependencies;

use super::validate_job::JobType;

// This will download everything get into the root host OS then ... will invoke inference using the pathes from the files invoked
pub struct StyleTTS2ProcessJobArgs<'a> {
    pub job_dependencies: &'a JobDependencies,
    pub job: &'a AvailableInferenceJob,
}

// query using the token then grab the bucket hash
pub async fn process_job(
    args: StyleTTS2ProcessJobArgs<'_>
) -> Result<JobSuccessResult, ProcessSingleJobError> {
    let job = args.job;

    // get args token
    let jobArgs = validate_job(&job)?; // bubbles error up

    match jobArgs.job_type {
        JobType::Create => {
            if let Some(voice_dataset_token) = jobArgs.voice_dataset_token {
                process_create_voice(args, voice_dataset_token).await
            } else {
                Err(ProcessSingleJobError::Other(anyhow!("Missing Dataset Token?")))
            }
        }
        JobType::Inference => {
            if let Some(voice_token) = jobArgs.voice_token {
                process_inference_voice(args, voice_token).await
            } else {
                Err(ProcessSingleJobError::Other(anyhow!("Missing Voice Token?")))
            }
        }
    }
}
