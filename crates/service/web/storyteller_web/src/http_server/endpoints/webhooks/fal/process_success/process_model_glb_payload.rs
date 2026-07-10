use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::webhooks::fal::process_success::attach_cover_image::{attach_cover_image, AttachCoverImageArgs};
use crate::http_server::endpoints::webhooks::fal::process_success::process_model_mesh_payload::{upload_mesh_file, UploadMeshFileArgs};
use crate::state::server_state::ServerState;
use fal_client::webhook_payload::hydrated::hydrated_webhook_contents::{ModelGlbData, ModelUrlsData, ThumbnailData};
use log::{info, warn};
use mysql_queries::queries::generic_inference::api_providers::fal::get_inference_job_by_fal_id::FalJobDetails;
use pager::client::pager::Pager;
use pager::notification::notification_details_builder::NotificationDetailsBuilder;
use pager::notification::notification_urgency::NotificationUrgency;
use tokens::tokens::batch_generations::BatchGenerationToken;
use tokens::tokens::media_files::MediaFileToken;

/*
  Example payload, from Hunyuan 3d 3.0. The `model_urls.glb` entry usually
  duplicates `model_glb` (same URL), but is uploaded as a second mesh when it
  points at a different file. The other `model_urls` slots (fbx/obj/usdz) are
  alternate formats of the same model and are not uploaded.

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

/// Process a `model_glb` payload, plus the optional secondary GLBs some
/// models send: the `model_glb_pbr` variant (Hunyuan 3D 2.1) and the
/// `model_urls` entries `glb` (Hunyuan 3D 3.0), `base_model` and `pbr_model`
/// (Tripo 3D). Secondary entries frequently repeat the primary's URL, so
/// only distinct files are uploaded. All GLBs become mesh media files; when
/// more than one is uploaded they share a batch generation token, with the
/// standard GLB as the primary media file.
pub async fn process_model_glb_payload(
  model_glb_data: &ModelGlbData,
  maybe_model_glb_pbr_data: Option<&ModelGlbData>,
  maybe_model_urls_data: Option<&ModelUrlsData>,
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

  // Secondary GLB candidates. Slots frequently duplicate URLs — Hunyuan 3D
  // 3.0's `model_urls.glb` usually matches `model_glb`, and Tripo 3D's `glb`
  // and `pbr_model` match each other — so each distinct URL uploads once.
  let candidates = [
    ("model_glb_pbr", maybe_model_glb_pbr_data),
    ("model_urls.glb", maybe_model_urls_data.and_then(|urls| urls.glb.as_ref())),
    ("model_urls.base_model", maybe_model_urls_data.and_then(|urls| urls.base_model.as_ref())),
    ("model_urls.pbr_model", maybe_model_urls_data.and_then(|urls| urls.pbr_model.as_ref())),
  ];

  let mut seen_urls = vec![mesh_url];
  let mut secondary_glbs: Vec<(&str, &ModelGlbData)> = Vec::new();

  for (label, maybe_glb_data) in candidates {
    let Some(glb_data) = maybe_glb_data else {
      continue;
    };
    let Some(url) = glb_data.url.as_deref() else {
      warn!("No `url` in {} payload; skipping", label);
      continue;
    };
    if seen_urls.contains(&url) {
      continue;
    }
    seen_urls.push(url);
    secondary_glbs.push((label, glb_data));
  }

  // NB: We don't create `batch_generations` table records. The foreign key
  // in `media_files` is enough to look up the rest of the batch.
  let maybe_batch_token = (!secondary_glbs.is_empty())
      .then(BatchGenerationToken::generate);

  let media_token = upload_mesh_file(UploadMeshFileArgs {
    mesh_url,
    maybe_content_type: model_glb_data.content_type.as_deref(),
    maybe_file_name: model_glb_data.file_name.as_deref(),
    maybe_batch_token: maybe_batch_token.as_ref(),
    job,
    server_state,
  }).await?;

  info!("Glb media file uploaded with token: {}", media_token);

  // Upload the secondary GLBs into the same batch. NB: Fail open — the
  // primary GLB is already uploaded, so page ourselves instead of failing
  // the job.
  for (label, glb_data) in secondary_glbs {
    let result = upload_secondary_glb(
      glb_data,
      maybe_batch_token.as_ref(),
      job,
      server_state,
    ).await;

    if let Err(err) = result {
      warn!("Failed to upload {} GLB variant: {:?}", label, err);
      page_about_secondary_glb_failure(label, err, job, pager);
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

async fn upload_secondary_glb(
  glb_data: &ModelGlbData,
  maybe_batch_token: Option<&BatchGenerationToken>,
  job: &FalJobDetails,
  server_state: &ServerState,
) -> Result<MediaFileToken, CommonWebError> {
  let glb_url = glb_data.url
      .as_deref()
      .ok_or_else(|| {
        warn!("No `url` in secondary glb payload");
        CommonWebError::server_error_with_message("no `url` in secondary glb payload")
      })?;

  let media_token = upload_mesh_file(UploadMeshFileArgs {
    mesh_url: glb_url,
    maybe_content_type: glb_data.content_type.as_deref(),
    maybe_file_name: glb_data.file_name.as_deref(),
    maybe_batch_token,
    job,
    server_state,
  }).await?;

  info!("Secondary glb media file uploaded with token: {}", media_token);

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

fn page_about_secondary_glb_failure(label: &str, err: CommonWebError, job: &FalJobDetails, pager: &Pager) {
  let notification = NotificationDetailsBuilder::from_boxed_error(err.into())
      .set_title(format!("Failure to download {} GLB variant from FAL webhook", label))
      .set_description(Some(format!(
        "We uploaded the primary GLB and marked the job as a success, \
        but the {} variant failed and the user may need assistance.\n\
        **Internal Job Token**: {}\n\
        **Fal ID**: {}\n",
        label,
        job.job_token.as_str(),
        job.external_third_party_id)))
      .set_urgency(Some(NotificationUrgency::Medium))
      .build();

  if let Err(pager_err) = pager.enqueue_page(notification) {
    warn!("Failed to enqueue {} GLB failure alert: {:?}", label, pager_err);
  }
}
