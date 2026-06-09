use std::sync::Arc;
use anyhow::anyhow;
use log::{error, info, warn};

use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::generic_inference_jobs::inference_result_type::InferenceResultType;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory;
use enums::by_table::media_files::media_file_origin_product_category::MediaFileOriginProductCategory;
use enums::by_table::media_files::media_file_type::MediaFileType;
use errors::AnyhowResult;
use hashing::sha256::sha256_hash_bytes::sha256_hash_bytes;
use mysql_queries::queries::generic_inference::api_providers::gmicloud::list_pending_gmicloud_jobs::PendingGmiCloudJob;
use mysql_queries::queries::media_files::create::insert_builder::media_file_insert_builder::MediaFileInsertBuilder;
use mysql_queries::queries::generic_inference::web::mark_generic_inference_job_successfully_done_by_token::mark_generic_inference_job_successfully_done_by_token;
use tokens::tokens::media_files::MediaFileToken;

use crate::alert_on_error::alert_pager_and_return_err;
use crate::job_dependencies::JobDependencies;

const VIDEO_PREFIX: &str = "artcraft_";
const VIDEO_SUFFIX: &str = ".mp4";

const THUMB_PREFIX: &str = "artcraft_";

/// Download the completed video, upload to bucket, create media file record, and mark job done.
pub async fn process_successful_job(
  deps: &JobDependencies,
  job: &PendingGmiCloudJob,
  video_url: &str,
  maybe_thumbnail_url: Option<&str>,
) -> AnyhowResult<()> {

  // --- Step 1: Download and upload thumbnail as cover image (if available). ---

  let maybe_cover_token = match maybe_thumbnail_url {
    Some(thumbnail_url) => {
      match download_and_upload_thumbnail(deps, job, thumbnail_url).await {
        Ok(token) => Some(token),
        Err(err) => {
          warn!(
            "Failed to create thumbnail for job {}: {:?}. Continuing without cover.",
            job.job_token.as_str(), err
          );
          None
        }
      }
    }
    None => None,
  };

  // --- Step 2: Download the video. ---

  info!("Downloading video for job {} from: {}", job.job_token.as_str(), video_url);

  let video_bytes: Vec<u8> = match reqwest::get(video_url).await {
    Ok(resp) => match resp.bytes().await {
      Ok(bytes) => bytes.to_vec(),
      Err(err) => {
        error!("Error reading video bytes for job {}: {:?}", job.job_token.as_str(), err);
        return alert_pager_and_return_err(
          &deps.pager,
          "GmiCloud video download failed",
          err.into(),
          Some(job),
        );
      }
    },
    Err(err) => {
      error!("Error downloading video for job {}: {:?}", job.job_token.as_str(), err);
      return alert_pager_and_return_err(
        &deps.pager,
        "GmiCloud video download failed",
        err.into(),
        Some(job),
      );
    }
  };

  info!("Downloaded {} bytes for job {}", video_bytes.len(), job.job_token.as_str());

  // --- Step 3: Hash and upload. ---

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
      "GmiCloud bucket upload failed",
      err.into(),
      Some(job),
    );
  }

  info!("Uploaded video for job {}. Creating media file record.", job.job_token.as_str());

  // --- Step 4: Create media file record. ---

  let media_file_result = MediaFileInsertBuilder::new()
    .maybe_creator_user(job.maybe_creator_user_token.as_ref())
    .maybe_creator_anonymous_visitor(job.maybe_creator_anonymous_visitor_token.as_ref())
    .creator_ip_address(&job.creator_ip_address)
    .creator_set_visibility(job.creator_set_visibility)
    .media_file_class(MediaFileClass::Video)
    .media_file_type(MediaFileType::Mp4)
    .media_file_origin_category(MediaFileOriginCategory::Inference)
    .media_file_origin_product_category(MediaFileOriginProductCategory::VideoGeneration)
    .mime_type("video/mp4")
    .file_size_bytes(video_bytes.len() as u64)
    .checksum_sha2(&checksum)
    .maybe_prompt_token(job.maybe_prompt_token.as_ref())
    .maybe_platform_type(job.maybe_platform_type)
    .maybe_cover_image_media_file_token(maybe_cover_token.as_ref())
    .public_bucket_directory_hash(&bucket_path)
    .insert_pool(&deps.mysql_pool)
    .await;

  let media_file_token = match media_file_result {
    Ok(token) => token,
    Err(err) => {
      error!("Error inserting media file record for job {}: {:?}", job.job_token.as_str(), err);
      return alert_pager_and_return_err(
        &deps.pager,
        "GmiCloud media file insert failed",
        err.into(),
        Some(job),
      );
    }
  };

  info!(
    "Created media file {} for job {}. Marking job complete.",
    media_file_token.as_str(), job.job_token.as_str()
  );

  // --- Step 5: Mark job as done. ---

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
      "GmiCloud job completion update failed",
      err.into(),
      Some(job),
    );
  }

  info!("Job {} completed successfully.", job.job_token.as_str());

  Ok(())
}

fn guess_image_format_from_url(url: &str) -> (&'static str, &'static str, MediaFileType) {
  let path = url.split('?').next().unwrap_or(url);
  let path = path.split('#').next().unwrap_or(path);

  if let Some(dot) = path.rfind('.') {
    match &path[dot..] {
      ".jpg" | ".jpeg" => (".jpg", "image/jpeg", MediaFileType::Jpg),
      ".png" => (".png", "image/png", MediaFileType::Png),
      _ => (".png", "image/png", MediaFileType::Png),
    }
  } else {
    (".png", "image/png", MediaFileType::Png)
  }
}

async fn download_and_upload_thumbnail(
  deps: &JobDependencies,
  job: &PendingGmiCloudJob,
  thumbnail_url: &str,
) -> AnyhowResult<MediaFileToken> {
  info!("Downloading thumbnail for job {} from: {}", job.job_token.as_str(), thumbnail_url);

  let (suffix, mime_type, media_file_type) = guess_image_format_from_url(thumbnail_url);

  let thumb_bytes: Vec<u8> = reqwest::get(thumbnail_url)
    .await
    .map_err(|err| anyhow!("reqwest error downloading thumbnail: {:?}", err))?
    .bytes()
    .await
    .map_err(|err| anyhow!("error reading thumbnail bytes: {:?}", err))?
    .to_vec();

  let checksum = sha256_hash_bytes(&thumb_bytes)
    .map_err(|err| anyhow!("error hashing thumbnail: {:?}", err))?;

  let bucket_path = MediaFileBucketPath::generate_new(Some(THUMB_PREFIX), Some(suffix));
  let object_path = bucket_path.get_full_object_path_str();

  deps
    .public_bucket_client
    .upload_file_with_content_type_process(object_path, &thumb_bytes, mime_type)
    .await
    .map_err(|err| anyhow!("error uploading thumbnail to bucket: {:?}", err))?;

  let thumb_token = MediaFileInsertBuilder::new()
    .maybe_creator_user(job.maybe_creator_user_token.as_ref())
    .maybe_creator_anonymous_visitor(job.maybe_creator_anonymous_visitor_token.as_ref())
    .creator_ip_address(&job.creator_ip_address)
    .creator_set_visibility(job.creator_set_visibility)
    .media_file_class(MediaFileClass::Image)
    .media_file_type(media_file_type)
    .is_intermediate_system_file(true)
    .media_file_origin_category(MediaFileOriginCategory::Inference)
    .media_file_origin_product_category(MediaFileOriginProductCategory::VideoGeneration)
    .mime_type(mime_type)
    .file_size_bytes(thumb_bytes.len() as u64)
    .checksum_sha2(&checksum)
    .maybe_prompt_token(job.maybe_prompt_token.as_ref())
    .maybe_platform_type(job.maybe_platform_type)
    .public_bucket_directory_hash(&bucket_path)
    .insert_pool(&deps.mysql_pool)
    .await
    .map_err(|err| anyhow!("error inserting thumbnail media file record: {:?}", err))?;

  info!("Created thumbnail media file {} for job {}.", thumb_token.as_str(), job.job_token.as_str());

  Ok(thumb_token)
}
