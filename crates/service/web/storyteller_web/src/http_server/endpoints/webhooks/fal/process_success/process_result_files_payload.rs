use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::webhooks::fal::process_success::process_model_mesh_payload::{
  upload_mesh_file, UploadMeshFileArgs,
};
use crate::state::server_state::ServerState;
use fal_client::webhook_payload::hydrated::hydrated_webhook_contents::ResultFileData;
use log::{info, warn};
use mysql_queries::queries::generic_inference::api_providers::fal::get_inference_job_by_fal_id::FalJobDetails;
use pager::client::pager::Pager;
use pager::notification::notification_details_builder::NotificationDetailsBuilder;
use pager::notification::notification_urgency::NotificationUrgency;
use tokens::tokens::batch_generations::BatchGenerationToken;
use tokens::tokens::media_files::MediaFileToken;

/// Process a `result_files` payload: a list of output mesh files from a
/// single generation (e.g. Hunyuan 3D v3.1 Part returns one FBX per part).
///
/// Each file becomes its own media file record; when there is more than one,
/// they share a batch generation token so the rest of the batch can be looked
/// up from any member.
pub async fn process_result_files_payload(
  result_files: &[ResultFileData],
  job: &FalJobDetails,
  server_state: &ServerState,
  pager: &Pager,
) -> Result<(Option<MediaFileToken>, Option<BatchGenerationToken>), CommonWebError> {

  let mut maybe_media_token = None;

  // NB: We don't create `batch_generations` table records. The foreign key
  // in `media_files` is enough to look up the rest of the batch.
  let mut maybe_batch_token = None;

  if result_files.len() > 1 {
    maybe_batch_token = Some(BatchGenerationToken::generate());
  }

  // Rather than fail the entire batch on one bad file, skip the failure(s)
  // and notify ourselves.
  let mut success_count = 0;
  let mut maybe_error = None;

  for (i, file) in result_files.iter().enumerate() {
    info!("Uploading result file {} of {}: {:?}", i + 1, result_files.len(), file.url);

    let Some(url) = file.url.as_deref() else {
      warn!("No `url` in result file {} of {}", i + 1, result_files.len());
      maybe_error = Some(CommonWebError::server_error_with_message("no `url` in result file"));
      continue;
    };

    let result = upload_mesh_file(UploadMeshFileArgs {
      mesh_url: url,
      maybe_content_type: file.content_type.as_deref(),
      maybe_file_name: file.file_name.as_deref(),
      maybe_batch_token: maybe_batch_token.as_ref(),
      job,
      server_state,
    }).await;

    let media_token = match result {
      Ok(token) => token,
      Err(err) => {
        maybe_error = Some(err);
        continue;
      }
    };

    if maybe_media_token.is_none() {
      maybe_media_token = Some(media_token); // Set the first media token
    }

    success_count += 1;
  }

  if success_count == 0 {
    if let Some(err) = maybe_error {
      return Err(err);
    } else {
      // NB: Branch should be unreachable.
      return Err(CommonWebError::server_error_with_message("none of the result files could be processed"));
    }
  }

  if let Some(err) = maybe_error {
    // Even with partial success, page about the failures.
    let notification = NotificationDetailsBuilder::from_boxed_error(err.into())
        .set_title(format!(
          "Failure to download all result files from FAL webhook: {} out of {} succeeded",
          success_count, result_files.len(),
        ))
        .set_description(Some(format!(
          "We uploaded all of the result files we could and marked the job as a success, \
          but the user may need assistance with the remaining files and/or reimbursement.\n\
          **Internal Job Token**: {}\n\
          **Fal ID**: {}\n",
          job.job_token.as_str(),
          job.external_third_party_id)))
        .set_urgency(Some(NotificationUrgency::Medium))
        .build();

    if let Err(pager_err) = pager.enqueue_page(notification) {
      warn!("Failed to enqueue result file failure alert: {:?}", pager_err);
    }
  }

  Ok((maybe_media_token, maybe_batch_token))
}
