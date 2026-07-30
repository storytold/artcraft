use std::path::Path;
use std::time::Duration;

use cloud_storage::legacy_bucket_client::local_object_disk_path;
use log::{error, info};
use sqlx::MySqlPool;

use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use bucket_paths::path_conventions::video_thumbnail_suffixes::{VIDEO_ANIMATED_GIF_THUMBNAIL_SUFFIX, VIDEO_STATIC_JPG_THUMBNAIL_SUFFIX};
use enums::by_table::generic_inference_jobs::inference_result_type::InferenceResultType;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory;
use enums::by_table::media_files::media_file_origin_product_category::MediaFileOriginProductCategory;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::common::generation_provider::GenerationProvider;
use errors::AnyhowResult;
use hashing::sha256::sha256_hash_bytes::sha256_hash_bytes;
use mysql_queries::queries::generic_inference::job::mark_job_failed_by_token::{mark_job_failed_by_token, MarkJobFailedByTokenArgs};
use mysql_queries::queries::generic_inference::web::list_pending_fake_generation_jobs::{list_pending_fake_generation_jobs, PendingFakeGenerationJob};
use mysql_queries::queries::generic_inference::web::mark_generic_inference_job_successfully_done_by_token_with_executor::{
  mark_generic_inference_job_successfully_done_by_token_with_executor,
  MarkGenericInferenceJobSuccessfullyDoneByTokenWithExecutorArgs,
};
use mysql_queries::queries::media_files::create::insert_builder::media_file_insert_builder::MediaFileInsertBuilder;
use tokens::tokens::media_files::MediaFileToken;

use crate::http_server::endpoints::generate::common::job_failure_test::test_synthetic_failure_reason;

/// Placeholder result assets, relative to the repo root (the server's working
/// directory — its config search path already depends on that).
const FAKE_IMAGE_RESULT_SOURCE: &str = "test_data/image/juno.jpg";
const FAKE_VIDEO_RESULT_SOURCE: &str = "test_data/video/mp4/golden_sun_garoh.mp4";

const JOBS_PER_TICK: u32 = 25;

/// Dev-only companion to DEV_FAKE_GENERATION (see ServerState): polls for
/// pending jobs whose external id is `fake_…` and, once they are older than
/// DEV_FAKE_GENERATION_RESOLVE_SECS, resolves them the way a real provider
/// callback would — a `media_files` row backed by a placeholder asset under
/// LOCAL_MEDIA_ROOT for success, or a synthetic failure when the prompt
/// contains the `simulate_artcraft_failure` / `test_artcraft_failure`
/// triggers (with an optional FrontendFailureCategory word, same as the
/// legacy handlers).
pub async fn dev_fake_generation_resolver_thread(mysql_pool: MySqlPool) {
  let resolve_after = easyenv::get_env_duration_seconds_or_default(
    "DEV_FAKE_GENERATION_RESOLVE_SECS", Duration::from_secs(6));

  let poll_interval = easyenv::get_env_duration_seconds_or_default(
    "DEV_FAKE_GENERATION_POLL_SECS", Duration::from_secs(2));

  info!("Dev fake-generation resolver running: jobs resolve after ~{}s (poll every {}s).",
      resolve_after.as_secs(), poll_interval.as_secs());

  loop {
    tokio::time::sleep(poll_interval).await;

    let jobs = match list_pending_fake_generation_jobs(
      &mysql_pool,
      resolve_after.as_secs() as u32,
      JOBS_PER_TICK,
    ).await {
      Ok(jobs) => jobs,
      Err(err) => {
        error!("Dev fake-generation resolver failed to list pending jobs: {:?}", err);
        continue;
      }
    };

    for job in jobs {
      let job_token = job.job_token.clone();
      if let Err(err) = resolve_job(&mysql_pool, &job, resolve_after).await {
        error!("Dev fake-generation resolver failed on job {}: {:?}", job_token.as_str(), err);
        // Fail the job so the frontend sees a terminal state instead of an
        // eternally-pending spinner (and so we don't retry it every tick).
        let mark_result = mark_job_failed_by_token(MarkJobFailedByTokenArgs {
          pool: &mysql_pool,
          job_token: &job_token,
          maybe_public_failure_reason: Some("Dev fake generation could not produce a result."),
          internal_debugging_failure_reason: &format!("dev fake resolver error: {:?}", err),
          maybe_frontend_failure_category: None,
        }).await;
        if let Err(mark_err) = mark_result {
          error!("Also failed to mark job {} failed: {:?}", job_token.as_str(), mark_err);
        }
      }
    }
  }
}

async fn resolve_job(
  mysql_pool: &MySqlPool,
  job: &PendingFakeGenerationJob,
  simulated_duration: Duration,
) -> AnyhowResult<()> {
  let prompt = job.maybe_positive_prompt.as_deref().unwrap_or("");

  if let Some(failure) = test_synthetic_failure_reason(prompt) {
    mark_job_failed_by_token(MarkJobFailedByTokenArgs {
      pool: mysql_pool,
      job_token: &job.job_token,
      maybe_public_failure_reason: failure.frontend_failure_message.as_deref(),
      internal_debugging_failure_reason: "DEV_FAKE_GENERATION synthetic failure (prompt trigger)",
      maybe_frontend_failure_category: Some(failure.frontend_failure_category),
    }).await?;
    info!("Dev fake-generation: job {} failed synthetically ({:?}).",
        job.job_token.as_str(), failure.frontend_failure_category);
    return Ok(());
  }

  let media_token = insert_fake_result_media(mysql_pool, job).await?;

  mark_generic_inference_job_successfully_done_by_token_with_executor(
    MarkGenericInferenceJobSuccessfullyDoneByTokenWithExecutorArgs {
      executor: mysql_pool,
      token: &job.job_token,
      maybe_entity_type: Some(InferenceResultType::MediaFile),
      maybe_entity_token: Some(media_token.as_str()),
      total_job_duration: Some(simulated_duration),
      inference_duration: Some(simulated_duration),
    },
  ).await?;

  info!("Dev fake-generation: job {} completed with media file {}.",
      job.job_token.as_str(), media_token.as_str());
  Ok(())
}

/// Copy a placeholder asset to a fresh bucket path under LOCAL_MEDIA_ROOT and
/// insert the `media_files` row, mirroring what the Fal webhook success path
/// does with a real provider result (minus the R2 upload).
async fn insert_fake_result_media(
  mysql_pool: &MySqlPool,
  job: &PendingFakeGenerationJob,
) -> AnyhowResult<MediaFileToken> {
  let is_video = job.inference_category.contains("video");

  let (source_path, extension, media_class, media_type, mime_type, product_category) = if is_video {
    (FAKE_VIDEO_RESULT_SOURCE, ".mp4", MediaFileClass::Video, MediaFileType::Mp4,
     "video/mp4", MediaFileOriginProductCategory::VideoGeneration)
  } else {
    (FAKE_IMAGE_RESULT_SOURCE, ".jpg", MediaFileClass::Image, MediaFileType::Jpg,
     "image/jpeg", MediaFileOriginProductCategory::ImageGeneration)
  };

  let media_root = std::env::var("LOCAL_MEDIA_ROOT")
      .ok()
      .filter(|root| !root.trim().is_empty())
      .ok_or_else(|| anyhow::anyhow!(
        "LOCAL_MEDIA_ROOT must be set for DEV_FAKE_GENERATION results to be viewable"))?;

  let file_bytes = tokio::fs::read(source_path).await
      .map_err(|err| anyhow::anyhow!(
        "cannot read placeholder asset {} (server must run from the repo root): {}", source_path, err))?;

  let bucket_path = MediaFileBucketPath::generate_new(Some("fake_"), Some(extension));
  let disk_path = local_object_disk_path(Path::new(&media_root), &bucket_path.get_full_object_path_str())?;

  if let Some(parent) = disk_path.parent() {
    tokio::fs::create_dir_all(parent).await?;
  }
  tokio::fs::write(&disk_path, &file_bytes).await?;

  if is_video {
    // The video thumbnail job never runs locally, so drop the thumbnail
    // siblings the gallery expects next to the object. The animated "gif" is
    // really JPEG bytes — browsers decode <img> content by magic bytes, and a
    // still preview is plenty for dev.
    let thumb_bytes = tokio::fs::read(FAKE_IMAGE_RESULT_SOURCE).await?;
    let base = disk_path.to_string_lossy().to_string();
    tokio::fs::write(format!("{base}{VIDEO_STATIC_JPG_THUMBNAIL_SUFFIX}"), &thumb_bytes).await?;
    tokio::fs::write(format!("{base}{VIDEO_ANIMATED_GIF_THUMBNAIL_SUFFIX}"), &thumb_bytes).await?;
  }

  let checksum = sha256_hash_bytes(&file_bytes)?;

  let media_token = MediaFileInsertBuilder::new()
      .checksum_sha2(&checksum)
      .creator_ip_address("127.0.0.1")
      .file_size_bytes(file_bytes.len() as u64)
      .maybe_creator_user(job.maybe_creator_user_token.as_ref())
      .maybe_generation_provider(Some(GenerationProvider::Artcraft))
      .maybe_prompt_token(job.maybe_prompt_token.as_ref())
      .media_file_class(media_class)
      .media_file_origin_category(MediaFileOriginCategory::Inference)
      .media_file_origin_product_category(product_category)
      .media_file_type(media_type)
      .mime_type(mime_type)
      .public_bucket_directory_hash(&bucket_path)
      .insert_pool(mysql_pool)
      .await
      .map_err(|err| anyhow::anyhow!("failed to insert fake result media file: {:?}", err))?;

  Ok(media_token)
}
