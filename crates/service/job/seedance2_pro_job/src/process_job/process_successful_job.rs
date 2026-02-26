use anyhow::anyhow;
use log::{error, info};

use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::generic_inference_jobs::inference_result_type::InferenceResultType;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory;
use enums::by_table::media_files::media_file_origin_product_category::MediaFileOriginProductCategory;
use enums::by_table::media_files::media_file_type::MediaFileType;
use errors::AnyhowResult;
use hashing::sha256::sha256_hash_bytes::sha256_hash_bytes;
use mysql_queries::queries::generic_inference::seedance2pro::list_pending_seedance2pro_jobs::PendingSeedance2ProJob;
use mysql_queries::queries::media_files::create::insert_builder::media_file_insert_builder::MediaFileInsertBuilder;
use mysql_queries::queries::generic_inference::web::mark_generic_inference_job_successfully_done_by_token::mark_generic_inference_job_successfully_done_by_token;
use seedance2pro::requests::poll_orders::poll_orders::OrderStatus;
use crate::job_dependencies::JobDependencies;

const PREFIX: &str = "artcraft_";
const SUFFIX: &str = ".mp4";

/// Download the completed video, upload to bucket, create media file record, and mark job done.
pub async fn process_successful_job(
  deps: &JobDependencies,
  job: &PendingSeedance2ProJob,
  order: &OrderStatus,
) -> AnyhowResult<()> {
  // Get the video URL.
  let video_url = match &order.result_url {
    Some(url) => url.as_str(),
    None => {
      // Fall back to the first result entry if the top-level result_url is missing.
      match order.results.first() {
        Some(result) => result.url.as_str(),
        None => {
          return Err(anyhow!(
            "Completed order {} has no result_url and no results",
            order.order_id
          ));
        }
      }
    }
  };

  info!(
    "Downloading video for order {} from: {}",
    order.order_id, video_url
  );

  // Download the video bytes.
  let video_bytes: Vec<u8> = reqwest::get(video_url)
    .await
    .map_err(|err| anyhow!("reqwest error downloading video: {:?}", err))?
    .bytes()
    .await
    .map_err(|err| anyhow!("error reading video bytes: {:?}", err))?
    .to_vec();

  info!(
    "Downloaded {} bytes for order {}",
    video_bytes.len(),
    order.order_id
  );

  // Hash the video.
  let checksum = sha256_hash_bytes(&video_bytes)
    .map_err(|err| anyhow!("error hashing video: {:?}", err))?;

  // Build the bucket path.
  let bucket_path = MediaFileBucketPath::generate_new(Some(PREFIX), Some(SUFFIX));

  let object_path = bucket_path.get_full_object_path_str();

  info!(
    "Uploading video to public bucket at path: {}",
    object_path
  );

  // Upload to public bucket.
  deps
    .public_bucket_client
    .upload_file_with_content_type_process(object_path, &video_bytes, "video/mp4")
    .await
    .map_err(|err| anyhow!("error uploading video to bucket: {:?}", err))?;

  info!(
    "Uploaded video for order {}. Creating media file record.",
    order.order_id
  );

  // Optionally extract frame dimensions from the order results.
  let maybe_frame_width = order.results.first().map(|r| r.width);
  let maybe_frame_height = order.results.first().map(|r| r.height);

  // Insert media file record.
  let media_file_token = MediaFileInsertBuilder::new()
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
    .maybe_frame_width(maybe_frame_width)
    .maybe_frame_height(maybe_frame_height)
    .checksum_sha2(&checksum)
    .maybe_prompt_token(job.maybe_prompt_token.as_ref())
    .public_bucket_directory_hash(&bucket_path)
    .insert_pool(&deps.mysql_pool)
    .await
    .map_err(|err| anyhow!("error inserting media file record: {:?}", err))?;

  info!(
    "Created media file {} for order {}. Marking job {} complete.",
    media_file_token.as_str(),
    order.order_id,
    job.job_token.as_str()
  );

  // Mark inference job as successfully completed.
  mark_generic_inference_job_successfully_done_by_token(
    &deps.mysql_pool,
    &job.job_token,
    Some(InferenceResultType::MediaFile),
    Some(media_file_token.as_str()),
    None,
    None,
  )
    .await
    .map_err(|err| {
      error!(
        "Error marking job {} done: {:?}",
        job.job_token.as_str(),
        err
      );
      anyhow!("error marking job done: {:?}", err)
    })?;

  info!("Job {} completed successfully.", job.job_token.as_str());

  Ok(())
}
