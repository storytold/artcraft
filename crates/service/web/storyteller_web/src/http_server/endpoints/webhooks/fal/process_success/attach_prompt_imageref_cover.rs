//! Cover-image fallback for mesh/splat results whose webhook payload carries
//! no thumbnail or preview image (e.g. Hunyuan 3D 2.0 / 2.1): attach the
//! original image the user generated the model from (the prompt's imageref).

use crate::state::server_state::ServerState;
use log::{info, warn};
use mysql_queries::queries::generic_inference::api_providers::fal::get_inference_job_by_fal_id::FalJobDetails;
use mysql_queries::queries::media_files::edit::set_media_file_cover_image::{set_media_file_cover_image, UpdateArgs};
use mysql_queries::queries::prompt_context_items::get_first_imageref_for_prompt::{get_first_imageref_for_prompt, GetFirstImagerefForPromptArgs};
use tokens::tokens::media_files::MediaFileToken;

/// Attach the prompt's first non-deleted imageref as the cover image of
/// `target_media_token`. The imageref is already a media file in our bucket,
/// so no download/upload is needed — just the cover-image foreign key.
///
/// NB: Fail open at every step — a missing cover is never worth failing the
/// webhook over.
pub(crate) async fn try_to_attach_prompt_imageref_cover(
  job: &FalJobDetails,
  server_state: &ServerState,
  target_media_token: &MediaFileToken,
) {
  let Some(prompt_token) = job.maybe_prompt_token.as_ref() else {
    info!(
      "No prompt token on job {:?}; skipping imageref cover fallback for {}",
      job.job_token, target_media_token,
    );
    return;
  };

  let query_result = get_first_imageref_for_prompt(GetFirstImagerefForPromptArgs {
    prompt_token,
    mysql_executor: &server_state.mysql_pool,
    phantom: Default::default(),
  }).await;

  let maybe_imageref_token = match query_result {
    Ok(maybe_token) => maybe_token,
    Err(err) => {
      warn!(
        "Failed to look up imageref for prompt {} (cover fallback for {}): {:?}",
        prompt_token, target_media_token, err,
      );
      return;
    }
  };

  let Some(imageref_token) = maybe_imageref_token else {
    info!(
      "No imageref on prompt {}; {} gets no cover image",
      prompt_token, target_media_token,
    );
    return;
  };

  let update_result = set_media_file_cover_image(UpdateArgs {
    media_file_token: target_media_token,
    maybe_cover_image_media_file_token: Some(&imageref_token),
    mysql_pool: &server_state.mysql_pool,
  }).await;

  if let Err(err) = update_result {
    warn!(
      "Failed to set imageref {} as cover image on {}: {:?}",
      imageref_token, target_media_token, err,
    );
    return;
  }

  info!(
    "Attached prompt imageref {} as cover image of {}",
    imageref_token, target_media_token,
  );
}
