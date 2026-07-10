use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::webhooks::fal::process_success::attach_cover_image::{attach_cover_image, AttachCoverImageArgs};
use crate::http_server::endpoints::webhooks::fal::process_success::process_model_mesh_payload::{upload_mesh_file, UploadMeshFileArgs};
use crate::state::server_state::ServerState;
use fal_client::webhook_payload::hydrated::hydrated_webhook_contents::{ModelGlbData, ThumbnailData};
use log::{info, warn};
use mysql_queries::queries::generic_inference::api_providers::fal::get_inference_job_by_fal_id::FalJobDetails;
use pager::client::pager::Pager;
use pager::notification::notification_details_builder::NotificationDetailsBuilder;
use pager::notification::notification_urgency::NotificationUrgency;
use tokens::tokens::batch_generations::BatchGenerationToken;
use tokens::tokens::media_files::MediaFileToken;

/*
  Example payload, from Hunyuan 3d 3.0,

  {
    "model_glb": {
      "url": "https://v3b.fal.media/files/b/0a8afeff/8uc6VVLTpmVrupLqxxwOg_model.glb",
      "content_type": "model/gltf-binary",
      "file_name": "model.glb",
      "file_size": 33644324
    },
    "thumbnail": {
      "url": "https://v3b.fal.media/files/b/0a8afeff/s7BBSABb-ltoRM-N4Mnq3_preview.png",
      "content_type": "image/png",
      "file_name": "preview.png",
      "file_size": 45365
    },
    "model_urls": {
      "glb": {
        "url": "https://v3b.fal.media/files/b/0a8afeff/8uc6VVLTpmVrupLqxxwOg_model.glb",
        "content_type": "model/gltf-binary",
        "file_name": "model.glb",
        "file_size": 33644324
      },
      "fbx": null,
      "obj": {
        "url": "https://v3b.fal.media/files/b/0a8afeff/vU5vk02zWOJ9656Eq5QkP_model.obj",
        "content_type": "text/plain",
        "file_name": "model.obj",
        "file_size": 26522376
      },
      "usdz": null
    },
    "seed": null
  }

  Hunyuan 3D 2.1 additionally sends a PBR-textured GLB variant (plus a
  `model_mesh` zip archive of the whole generation, which we skip in favor
  of the GLBs):

  {
    "model_glb": { "url": "...demo_textured.glb", ... },
    "model_glb_pbr": { "url": "...demo_textured_pbr.glb", ... },
    "model_mesh": { "url": "...3d_model.zip", ... },
    "seed": 283904
  }

*/

/// Process a `model_glb` payload, plus the optional `model_glb_pbr` variant
/// (e.g. Hunyuan 3D 2.1). Both GLBs are uploaded as mesh media files; when
/// both are present they share a batch generation token, with the standard
/// GLB as the primary media file.
pub async fn process_model_glb_payload(
  model_glb_data: &ModelGlbData,
  maybe_model_glb_pbr_data: Option<&ModelGlbData>,
  maybe_thumbnail_data: Option<&ThumbnailData>,
  job: &FalJobDetails,
  server_state: &ServerState,
  pager: &Pager,
) -> Result<(MediaFileToken, Option<BatchGenerationToken>), CommonWebError> {
  let mesh_url = model_glb_data.url
      .as_deref()
      .ok_or_else(|| {
        warn!("No `url` in model glb payload");
        CommonWebError::server_error_with_message("no `url` in model glb payload")
      })?;

  // NB: We don't create `batch_generations` table records. The foreign key
  // in `media_files` is enough to look up the rest of the batch.
  let maybe_batch_token = maybe_model_glb_pbr_data
      .map(|_| BatchGenerationToken::generate());

  let media_token = upload_mesh_file(UploadMeshFileArgs {
    mesh_url,
    maybe_content_type: model_glb_data.content_type.as_deref(),
    maybe_file_name: model_glb_data.file_name.as_deref(),
    maybe_batch_token: maybe_batch_token.as_ref(),
    job,
    server_state,
  }).await?;

  info!("Glb media file uploaded with token: {}", media_token);

  // Upload the PBR variant into the same batch. NB: Fail open — the primary
  // GLB is already uploaded, so page ourselves instead of failing the job.
  if let Some(pbr_data) = maybe_model_glb_pbr_data {
    let result = upload_model_glb_pbr(
      pbr_data,
      maybe_batch_token.as_ref(),
      job,
      server_state,
    ).await;

    if let Err(err) = result {
      warn!("Failed to upload PBR GLB variant: {:?}", err);
      page_about_pbr_failure(err, job, pager);
    }
  }

  let result = try_to_attach_thumbnail(
    maybe_thumbnail_data,
    job,
    server_state,
    &media_token,
  ).await;

  // NB: Fail open
  if let Err(err) = result {
    warn!("Could not attach thumbnail as cover image to media file: {:?}", err);
  }

  Ok((media_token, maybe_batch_token))
}

async fn upload_model_glb_pbr(
  pbr_data: &ModelGlbData,
  maybe_batch_token: Option<&BatchGenerationToken>,
  job: &FalJobDetails,
  server_state: &ServerState,
) -> Result<MediaFileToken, CommonWebError> {
  let pbr_url = pbr_data.url
      .as_deref()
      .ok_or_else(|| {
        warn!("No `url` in model glb pbr payload");
        CommonWebError::server_error_with_message("no `url` in model glb pbr payload")
      })?;

  let media_token = upload_mesh_file(UploadMeshFileArgs {
    mesh_url: pbr_url,
    maybe_content_type: pbr_data.content_type.as_deref(),
    maybe_file_name: pbr_data.file_name.as_deref(),
    maybe_batch_token,
    job,
    server_state,
  }).await?;

  info!("PBR glb media file uploaded with token: {}", media_token);

  Ok(media_token)
}

async fn try_to_attach_thumbnail(
  maybe_thumbnail_data: Option<&ThumbnailData>,
  job: &FalJobDetails,
  server_state: &ServerState,
  glb_media_token: &MediaFileToken,
) -> Result<(), CommonWebError> {
  let thumbnail_data = maybe_thumbnail_data
      .ok_or_else(|| {
        warn!("No thumbnail data in extracted contents");
        CommonWebError::server_error_with_message(
          "no thumbnail data in extracted contents")
      })?;

  info!("Fal Thumbnail Data: {:?}", thumbnail_data);

  let thumbnail_url = thumbnail_data.url
      .as_deref()
      .ok_or_else(|| {
        warn!("No `url` in thumbnail payload");
        CommonWebError::server_error_with_message("no `url` in thumbnail payload")
      })?;

  attach_cover_image(AttachCoverImageArgs {
    image_url: thumbnail_url,
    maybe_content_type: thumbnail_data.content_type.as_deref(),
    maybe_origin_product_category: None,
    target_media_token: glb_media_token,
    job,
    server_state,
  }).await
}

fn page_about_pbr_failure(err: CommonWebError, job: &FalJobDetails, pager: &Pager) {
  let notification = NotificationDetailsBuilder::from_boxed_error(err.into())
      .set_title("Failure to download PBR GLB variant from FAL webhook".to_string())
      .set_description(Some(format!(
        "We uploaded the primary GLB and marked the job as a success, \
        but the PBR variant failed and the user may need assistance.\n\
        **Internal Job Token**: {}\n\
        **Fal ID**: {}\n",
        job.job_token.as_str(),
        job.external_third_party_id)))
      .set_urgency(Some(NotificationUrgency::Medium))
      .build();

  if let Err(pager_err) = pager.enqueue_page(notification) {
    warn!("Failed to enqueue PBR GLB failure alert: {:?}", pager_err);
  }
}
