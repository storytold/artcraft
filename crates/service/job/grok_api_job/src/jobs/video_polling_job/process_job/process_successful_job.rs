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
use grok_api_client::api::requests::videos::video_status::video_status::VideoOutputInfo;
use hashing::sha256::sha256_hash_bytes::sha256_hash_bytes;
use mysql_queries::queries::generic_inference::api_providers::grok_api::list_pending_grok_api_jobs::PendingGrokApiJob;
use mysql_queries::queries::generic_inference::web::mark_generic_inference_job_successfully_done_by_token::mark_generic_inference_job_successfully_done_by_token;
use mysql_queries::queries::media_files::create::insert_builder::media_file_insert_builder::MediaFileInsertBuilder;

use crate::job_dependencies::JobDependencies;
use crate::jobs::video_polling_job::alert_on_error::alert_pager_and_return_err;

const VIDEO_PREFIX: &str = "artcraft_";
const VIDEO_SUFFIX: &str = ".mp4";

/// Handle a `VideoStatus::Complete` poll response: extract the video URL,
/// download and persist the video, and bump the job-stats counter. If the
/// `Complete` response is missing a `video.url`, log and skip (the job
/// stays pending so a later poll can retry). Internal failures during
/// download / upload / mark-done bump the failure counter.
pub async fn process_complete_response(
  deps: &JobDependencies,
  job: &PendingGrokApiJob,
  maybe_video: Option<VideoOutputInfo>,
) {
  let video_url = match maybe_video.as_ref().and_then(|v| v.url.clone()) {
    Some(url) => url,
    None => {
      warn!(
        "Grok request {} reported Complete with no video.url for job {}. Skipping.",
        job.request_id, job.job_token.as_str(),
      );
      return;
    }
  };

  info!(
    "Grok request {} completed, processing job {}.",
    job.request_id, job.job_token.as_str(),
  );

  match download_and_finalize_video(deps, job, &video_url).await {
    Ok(()) => {
      let _ = deps.job_stats.increment_success_count();
    }
    Err(err) => {
      warn!(
        "Error processing completed Grok request {} for job {}: {:?}",
        job.request_id, job.job_token.as_str(), err,
      );
      let _ = deps.job_stats.increment_failure_count();
    }
  }
}

/// Download the completed video from xAI, upload to bucket, create media file
/// record, and mark the job done.
async fn download_and_finalize_video(
  deps: &JobDependencies,
  job: &PendingGrokApiJob,
  video_url: &str,
) -> AnyhowResult<()> {

  // --- Step 1: Download the video. ---

  info!("Downloading video for job {} from: {}", job.job_token.as_str(), video_url);

  let video_bytes: Vec<u8> = match reqwest::get(video_url).await {
    Ok(resp) => match resp.bytes().await {
      Ok(bytes) => bytes.to_vec(),
      Err(err) => {
        error!("Error reading video bytes for job {}: {:?}", job.job_token.as_str(), err);
        return alert_pager_and_return_err(
          &deps.pager,
          "Grok API video download failed",
          err.into(),
          Some(job),
        );
      }
    },
    Err(err) => {
      error!("Error downloading video for job {}: {:?}", job.job_token.as_str(), err);
      return alert_pager_and_return_err(
        &deps.pager,
        "Grok API video download failed",
        err.into(),
        Some(job),
      );
    }
  };

  info!("Downloaded {} bytes for job {}", video_bytes.len(), job.job_token.as_str());

  // --- Step 2: Hash and upload. ---

  let checksum = sha256_hash_bytes(&video_bytes)
    .map_err(|err| anyhow!("error hashing video: {:?}", err))?;

  let bucket_path = MediaFileBucketPath::generate_new(Some(VIDEO_PREFIX), Some(VIDEO_SUFFIX));
  let object_path = bucket_path.get_full_object_path_str();

  info!("Uploading video to public bucket at path: {}", object_path);

  let upload_result = deps
    .public_bucket_client
    .upload_file_with_content_type_process(object_path, &video_bytes, "video/mp4")
    .await;

  if let Err(err) = upload_result {
    error!("Error uploading video for job {}: {:?}", job.job_token.as_str(), err);
    return alert_pager_and_return_err(
      &deps.pager,
      "Grok API bucket upload failed",
      err.into(),
      Some(job),
    );
  }

  info!("Uploaded video for job {}. Creating media file record.", job.job_token.as_str());

  // --- Step 3: Create media file record. ---

  let media_file_result = MediaFileInsertBuilder::new()
    .checksum_sha2(&checksum)
    .creator_ip_address(&job.creator_ip_address)
    .creator_set_visibility(job.creator_set_visibility)
    .file_size_bytes(video_bytes.len() as u64)
    .maybe_creator_anonymous_visitor(job.maybe_creator_anonymous_visitor_token.as_ref())
    .maybe_creator_user(job.maybe_creator_user_token.as_ref())
    .maybe_generation_provider(Some(GenerationProvider::Artcraft))
    .maybe_prompt_token(job.maybe_prompt_token.as_ref())
    .media_file_class(MediaFileClass::Video)
    .media_file_origin_category(MediaFileOriginCategory::Inference)
    .media_file_origin_product_category(MediaFileOriginProductCategory::VideoGeneration)
    .media_file_type(MediaFileType::Mp4)
    .mime_type("video/mp4")
    .public_bucket_directory_hash(&bucket_path)
    .insert_pool(&deps.mysql_pool)
    .await;

  let media_file_token = match media_file_result {
    Ok(token) => token,
    Err(err) => {
      error!("Error inserting media file record for job {}: {:?}", job.job_token.as_str(), err);
      return alert_pager_and_return_err(
        &deps.pager,
        "Grok API media file insert failed",
        err.into(),
        Some(job),
      );
    }
  };

  info!(
    "Created media file {} for job {}. Marking job complete.",
    media_file_token.as_str(), job.job_token.as_str()
  );

  // --- Step 4: Mark job as done. ---

  if let Err(err) = mark_generic_inference_job_successfully_done_by_token(
    &deps.mysql_pool,
    &job.job_token,
    Some(InferenceResultType::MediaFile),
    Some(media_file_token.as_str()),
    None,
    None,
  ).await {
    error!("Error marking job {} done: {:?}", job.job_token.as_str(), err);
    return alert_pager_and_return_err(
      &deps.pager,
      "Grok API job completion update failed",
      err.into(),
      Some(job),
    );
  }

  info!("Job {} completed successfully.", job.job_token.as_str());

  Ok(())
}
