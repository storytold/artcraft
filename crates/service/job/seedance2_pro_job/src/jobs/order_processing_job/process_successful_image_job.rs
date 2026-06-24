use anyhow::anyhow;
use log::{error, info, warn};

use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::generic_inference_jobs::inference_result_type::InferenceResultType;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory;
use enums::by_table::media_files::media_file_origin_product_category::MediaFileOriginProductCategory;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::common::generation_provider::GenerationProvider;
use errors::AnyhowResult;
use hashing::sha256::sha256_hash_bytes::sha256_hash_bytes;
use mysql_queries::queries::generic_inference::api_providers::seedance2pro::list_pending_seedance2pro_video_jobs::PendingSeedance2ProJob;
use mysql_queries::queries::generic_inference::job::select_inference_job_status_for_update::select_inference_job_status_for_update;
use mysql_queries::queries::generic_inference::web::mark_generic_inference_job_successfully_done_by_token_with_executor::{mark_generic_inference_job_successfully_done_by_token_with_executor, MarkGenericInferenceJobSuccessfullyDoneByTokenWithExecutorArgs};
use mysql_queries::queries::media_files::create::insert_builder::media_file_insert_builder::MediaFileInsertBuilder;
use seedance2pro_client::requests::poll_orders::poll_orders::{OrderStatus, MediaResult};
use tokens::tokens::batch_generations::BatchGenerationToken;
use tokens::tokens::media_files::MediaFileToken;

use crate::alert_on_error::alert_pager_and_return_err;
use crate::job_dependencies::JobDependencies;
use crate::jobs::order_processing_job::is_job_status_terminal::is_job_status_terminal;

const PREFIX: &str = "artcraft_";
const SUFFIX: &str = ".png";
const MIME_TYPE: &str = "image/png";

/// Process a completed Midjourney image order from Kinovi.
///
/// Each completed Midjourney task returns up to four images (one per
/// position in the 2×2 grid). We download each, upload to the public
/// bucket, and insert a `media_files` row per image. The inference job
/// row is marked successful with the first media file as the primary
/// result entity.
pub async fn process_successful_image_job(
  deps: &JobDependencies,
  job: &PendingSeedance2ProJob,
  order: &OrderStatus,
) -> AnyhowResult<()> {
  if order.results.is_empty() {
    return Err(anyhow!(
      "Completed image order {} has no result entries",
      order.order_id
    ));
  }

  info!(
    "Processing completed image order {}: {} image(s) to download.",
    order.order_id, order.results.len(),
  );

  // Download, hash, upload, and insert one media_file per image. We
  // process sequentially: Kinovi/upstream is the bottleneck here, so
  // parallelising adds little while complicating refund-on-partial-failure.
  let mut created_tokens: Vec<MediaFileToken> = Vec::with_capacity(order.results.len());

  let is_batch = order.results.len() > 1;

  let maybe_batch_prompt_token = if is_batch {
    Some(BatchGenerationToken::generate())
  } else {
    None
  };

  for (idx, result) in order.results.iter().enumerate() {
    let token = match download_and_store_one_image(deps, job, order, result, idx, maybe_batch_prompt_token.as_ref()).await {
      Ok(t) => t,
      Err(err) => {
        // The first image is the headline result. If it fails, surface
        // the error so the caller can retry on the next poll. Failures on
        // later images are logged but don't sink the whole order — we
        // still want the primary result available to the user.
        if idx == 0 {
          return Err(err);
        }
        warn!(
          "Failed to process image {}/{} for order {}: {:?}",
          idx + 1, order.results.len(), order.order_id, err,
        );
        continue;
      }
    };
    created_tokens.push(token);
  }

  let primary_token = created_tokens.first().ok_or_else(|| {
    anyhow!(
      "No media files were created for order {} despite {} result(s)",
      order.order_id, order.results.len(),
    )
  })?;

  info!(
    "Created {} media file(s) for order {} (primary={}). Finalizing job {}.",
    created_tokens.len(),
    order.order_id,
    primary_token.as_str(),
    job.job_token.as_str(),
  );

  // Finalize inside a transaction: re-check the job is still pending under a row
  // lock, then mark it complete. See `process_successful_video_job` for the rationale.
  let mut transaction = deps.mysql_pool.begin().await.map_err(|err| {
    anyhow!("error beginning finalize transaction for job {}: {:?}", job.job_token.as_str(), err)
  })?;

  let maybe_status = select_inference_job_status_for_update(&mut *transaction, &job.job_token)
    .await
    .map_err(|err| anyhow!("error locking job {} for finalize: {:?}", job.job_token.as_str(), err))?;

  // ── Terminal-state guard (do NOT remove) ──
  //
  // Bail unless the job is still pending. A concurrent finalizer (another poll,
  // a web cancel) may have settled it between the processing loop's pre-check
  // and this locked re-read. If we don't stop here we'd re-mark a finished job
  // and leak the just-uploaded media files. This is the single most important
  // check in this function, so it's a discrete, early-returning step.

  let status = match maybe_status {
    Some(status) => status,
    None => {
      let _ = transaction.rollback().await;
      return Err(anyhow!(
        "Job {} vanished before finalize (order {})",
        job.job_token.as_str(), order.order_id,
      ));
    }
  };

  if is_job_status_terminal(status) {
    warn!(
      "Job {} is already terminal ({:?}); skipping mark-done (order {}). \
      {} media file(s) may be orphaned.",
      job.job_token.as_str(), status, order.order_id, created_tokens.len(),
    );
    let _ = transaction.rollback().await;
    return Ok(());
  }

  // Still pending — mark it done within the locked transaction.

  if let Err(err) = mark_generic_inference_job_successfully_done_by_token_with_executor(
    MarkGenericInferenceJobSuccessfullyDoneByTokenWithExecutorArgs {
      executor: &mut *transaction,
      token: &job.job_token,
      maybe_entity_type: Some(InferenceResultType::MediaFile),
      maybe_entity_token: Some(primary_token.as_str()),
      total_job_duration: None,
      inference_duration: None,
    },
  ).await {
    let _ = transaction.rollback().await;
    error!("Error marking image job {} done: {:?}", job.job_token.as_str(), err);
    return alert_pager_and_return_err(
      &deps.pager,
      "Kinovi image job completion update failed",
      anyhow!("error marking job done: {:?}", err),
      Some(job),
    );
  }

  transaction.commit().await.map_err(|err| {
    anyhow!("error committing finalize transaction for job {}: {:?}", job.job_token.as_str(), err)
  })?;

  info!("Image job {} completed successfully.", job.job_token.as_str());

  Ok(())
}

/// Download a single image from Kinovi's CDN, upload to our public bucket,
/// and insert a `media_files` row. Returns the new media file token.
async fn download_and_store_one_image(
  deps: &JobDependencies,
  job: &PendingSeedance2ProJob,
  order: &OrderStatus,
  result: &MediaResult,
  index: usize,
  maybe_batch_token: Option<&BatchGenerationToken>,
) -> AnyhowResult<MediaFileToken> {
  let image_url = result.url.as_str();

  info!(
    "Downloading image {}/{} for order {} from: {}",
    index + 1, order.results.len(), order.order_id, image_url,
  );

  let image_bytes: Vec<u8> = reqwest::get(image_url)
    .await
    .map_err(|err| anyhow!("reqwest error downloading image {}: {:?}", index, err))?
    .bytes()
    .await
    .map_err(|err| anyhow!("error reading image bytes for index {}: {:?}", index, err))?
    .to_vec();

  info!(
    "Downloaded {} bytes for image {}/{} of order {}",
    image_bytes.len(), index + 1, order.results.len(), order.order_id,
  );

  let checksum = sha256_hash_bytes(&image_bytes)
    .map_err(|err| anyhow!("error hashing image {}: {:?}", index, err))?;

  let bucket_path = MediaFileBucketPath::generate_new(Some(PREFIX), Some(SUFFIX));
  let object_path = bucket_path.get_full_object_path_str();

  info!(
    "Uploading image {}/{} to public bucket at path: {}",
    index + 1, order.results.len(), object_path,
  );

  deps
    .public_bucket_client
    .upload_file_with_content_type_process(object_path, &image_bytes, MIME_TYPE)
    .await
    .map_err(|err| anyhow!("bucket upload failed for image {}: {:?}", index, err))?;

  let media_file_token = MediaFileInsertBuilder::new()
    .checksum_sha2(&checksum)
    .creator_ip_address(&job.creator_ip_address)
    .creator_set_visibility(job.creator_set_visibility)
    .file_size_bytes(image_bytes.len() as u64)
    .maybe_batch_generation_token(maybe_batch_token)
    .maybe_creator_anonymous_visitor(job.maybe_creator_anonymous_visitor_token.as_ref())
    .maybe_creator_user(job.maybe_creator_user_token.as_ref())
    .maybe_frame_height(result.maybe_height)
    .maybe_frame_width(result.maybe_width)
    .maybe_generation_provider(Some(GenerationProvider::Artcraft))
    .maybe_prompt_token(job.maybe_prompt_token.as_ref())
    .maybe_platform_type(job.maybe_platform_type)
    .media_file_class(MediaFileClass::Image)
    .media_file_origin_category(MediaFileOriginCategory::Inference)
    .media_file_origin_product_category(MediaFileOriginProductCategory::ImageGeneration)
    .media_file_type(MediaFileType::Png)
    .mime_type(MIME_TYPE)
    .public_bucket_directory_hash(&bucket_path)
    .insert_pool(&deps.mysql_pool)
    .await
    .map_err(|err| anyhow!("media_file insert failed for image {}: {:?}", index, err))?;

  Ok(media_file_token)
}

#[cfg(test)]
mod tests {
  use super::*;

  /// Quick sanity check that the bucket-path constants are what the rest
  /// of the codebase expects for image generations (the video flow uses
  /// `artcraft_` + `.mp4`; we use `.png`).
  #[test]
  fn bucket_path_uses_png_suffix() {
    assert_eq!(PREFIX, "artcraft_");
    assert_eq!(SUFFIX, ".png");
    assert_eq!(MIME_TYPE, "image/png");
  }

  /// Generated bucket paths should end with the configured `.png` suffix
  /// (the underlying helper is shared with the video flow but parameterised
  /// on the extension).
  #[test]
  fn generated_bucket_path_ends_with_png() {
    let path = MediaFileBucketPath::generate_new(Some(PREFIX), Some(SUFFIX));
    let s = path.get_full_object_path_str().to_string();
    assert!(s.ends_with(".png"), "expected .png suffix, got {}", s);
    assert!(s.contains("artcraft_"), "expected `artcraft_` prefix in path, got {}", s);
  }
}
