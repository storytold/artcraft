use anyhow::anyhow;
use log::error;

use mysql_queries::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;
use mysql_queries::queries::media_files::get::get_media_file_for_inference::get_media_file_for_inference;
use tokens::tokens::media_files::MediaFileToken;

use crate::job::job_loop::job_success_result::JobSuccessResult;
use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job::job_types::render_engine_scene::render_engine_scene_to_video;
use crate::job::job_types::render_engine_scene::render_engine_scene_to_video::process_job::BvhToWorkflowJobArgs;
use crate::state::job_dependencies::JobDependencies;

pub async fn process_single_render_engine_scene_job(job_dependencies: &JobDependencies, job: &AvailableInferenceJob) -> Result<JobSuccessResult, ProcessSingleJobError> {

  let maybe_media_file_token = job.maybe_input_source_token
      .as_deref()
      .map(|token| MediaFileToken::new_from_str(token));

  let media_file_token = match maybe_media_file_token {
    None => return Err(ProcessSingleJobError::Other(anyhow!("no associated media file for format conversion job: {:?}", job.inference_job_token))),
    Some(token) => token,
  };

  let maybe_media_file_result =
      get_media_file_for_inference(&media_file_token, &job_dependencies.db.mysql_pool).await;

  let media_file = match maybe_media_file_result {
    Ok(Some(media_file)) => media_file,
    Ok(None) => {
      error!("no media file record found for token: {:?}", media_file_token);
      return Err(ProcessSingleJobError::Other(anyhow!("no media file record found for token: {:?}", media_file_token)));
    }
    Err(err) => {
      error!("error fetching media file record from db: {:?}", err);
      return Err(ProcessSingleJobError::Other(err));
    }
  };

  let job_success_result = render_engine_scene_to_video::process_job::process_job(BvhToWorkflowJobArgs {
        job_dependencies,
        job,
        media_file: &media_file,
      }).await?;

  Ok(job_success_result)
}


