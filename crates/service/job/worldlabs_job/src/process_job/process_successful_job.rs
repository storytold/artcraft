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
use mysql_queries::queries::generic_inference::worldlabs::list_pending_worldlabs_jobs::PendingWorldlabsJob;
use mysql_queries::queries::media_files::create::insert_builder::media_file_insert_builder::MediaFileInsertBuilder;
use mysql_queries::queries::generic_inference::web::mark_generic_inference_job_successfully_done_by_token::mark_generic_inference_job_successfully_done_by_token;
use tokens::tokens::media_files::MediaFileToken;
use world_labs_api::api::requests::get_operation::get_operation::GetOperationResponse;
use crate::job_dependencies::JobDependencies;

const SPLAT_PREFIX: &str = "artcraft_";
const SPLAT_SUFFIX: &str = ".ceramic.spz"; // NB: "ceramic" triggers some heuristics in Artcraft, such as flipping the model upside down

const THUMB_PREFIX: &str = "artcraft_";
const THUMB_SUFFIX: &str = ".png";

/// Download the completed splat, upload to bucket, create media file record, and mark job done.
pub async fn process_successful_job(
  deps: &JobDependencies,
  job: &PendingWorldlabsJob,
  operation: &GetOperationResponse,
) -> AnyhowResult<()> {
  // Get the full-res splat URL from the completed world.
  let world = operation.world.as_ref()
    .ok_or_else(|| anyhow!("Completed operation {} has no world object", operation.operation_id))?;

  let splat_url = world.assets.as_ref()
    .and_then(|a| a.splats.as_ref())
    .and_then(|s| s.spz_url_full_res.as_ref())
    .ok_or_else(|| anyhow!(
      "Completed operation {} has no spz_url_full_res",
      operation.operation_id
    ))?;

  // --- Step 1: Download and upload the thumbnail as a cover image. ---

  let maybe_cover_token = match world.assets.as_ref().and_then(|a| a.thumbnail_url.as_ref()) {
    Some(thumbnail_url) => {
      match download_and_upload_thumbnail(deps, job, operation, thumbnail_url).await {
        Ok(token) => Some(token),
        Err(err) => {
          warn!(
            "Failed to create thumbnail cover image for operation {}: {:?}. Continuing without cover.",
            operation.operation_id, err
          );
          None
        }
      }
    }
    None => {
      info!("No thumbnail_url for operation {}; skipping cover image.", operation.operation_id);
      None
    }
  };

  // --- Step 2: Download and upload the splat. ---

  info!(
    "Downloading splat for operation {} from: {}",
    operation.operation_id, splat_url
  );

  // Download the splat bytes.
  let splat_bytes: Vec<u8> = reqwest::get(splat_url)
    .await
    .map_err(|err| anyhow!("reqwest error downloading splat: {:?}", err))?
    .bytes()
    .await
    .map_err(|err| anyhow!("error reading splat bytes: {:?}", err))?
    .to_vec();

  info!(
    "Downloaded {} bytes for operation {}",
    splat_bytes.len(),
    operation.operation_id
  );

  // Hash the splat.
  let checksum = sha256_hash_bytes(&splat_bytes)
    .map_err(|err| anyhow!("error hashing splat: {:?}", err))?;

  // Build the bucket path.
  let bucket_path = MediaFileBucketPath::generate_new(Some(SPLAT_PREFIX), Some(SPLAT_SUFFIX));

  let object_path = bucket_path.get_full_object_path_str();

  info!(
    "Uploading splat to public bucket at path: {}",
    object_path
  );

  // Upload to public bucket.
  deps
    .public_bucket_client
    .upload_file_with_content_type_process(object_path, &splat_bytes, "application/gzip")
    .await
    .map_err(|err| anyhow!("error uploading splat to bucket: {:?}", err))?;

  info!(
    "Uploaded splat for operation {}. Creating media file record.",
    operation.operation_id
  );

  // Insert media file record.
  let media_file_token = MediaFileInsertBuilder::new()
    .maybe_creator_user(job.maybe_creator_user_token.as_ref())
    .maybe_creator_anonymous_visitor(job.maybe_creator_anonymous_visitor_token.as_ref())
    .creator_ip_address(&job.creator_ip_address)
    .creator_set_visibility(job.creator_set_visibility)
    .media_file_class(MediaFileClass::Dimensional)
    .media_file_type(MediaFileType::Spz)
    .media_file_origin_category(MediaFileOriginCategory::Inference)
    .media_file_origin_product_category(MediaFileOriginProductCategory::WorldGeneration)
    .mime_type("application/gzip")
    .file_size_bytes(splat_bytes.len() as u64)
    .checksum_sha2(&checksum)
    .maybe_prompt_token(job.maybe_prompt_token.as_ref())
    .maybe_cover_image_media_file_token(maybe_cover_token.as_ref())
    .public_bucket_directory_hash(&bucket_path)
    .insert_pool(&deps.mysql_pool)
    .await
    .map_err(|err| anyhow!("error inserting media file record: {:?}", err))?;

  info!(
    "Created media file {} for operation {}. Marking job {} complete.",
    media_file_token.as_str(),
    operation.operation_id,
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

/// Guess (suffix, mime_type, MediaFileType) from a URL's file extension.
/// Falls back to PNG if the extension is unrecognized or absent.
fn guess_image_format_from_url(url: &str) -> (&'static str, &'static str, MediaFileType) {
  // Strip query string / fragment before checking the extension.
  let path = url.split('?').next().unwrap_or(url);
  let path = path.split('#').next().unwrap_or(path);

  if let Some(dot) = path.rfind('.') {
    match &path[dot..] {
      ".jpg" | ".jpeg" => (".jpg", "image/jpeg", MediaFileType::Jpg),
      ".png" => (".png", "image/png", MediaFileType::Png),
      _ => (THUMB_SUFFIX, "image/png", MediaFileType::Png),
    }
  } else {
    (THUMB_SUFFIX, "image/png", MediaFileType::Png)
  }
}

/// Download a thumbnail image, upload it to the public bucket, and create a media file record for it.
async fn download_and_upload_thumbnail(
  deps: &JobDependencies,
  job: &PendingWorldlabsJob,
  operation: &GetOperationResponse,
  thumbnail_url: &str,
) -> AnyhowResult<MediaFileToken> {
  info!(
    "Downloading thumbnail for operation {} from: {}",
    operation.operation_id, thumbnail_url
  );

  let (suffix, mime_type, media_file_type) = guess_image_format_from_url(thumbnail_url);

  let thumb_bytes: Vec<u8> = reqwest::get(thumbnail_url)
    .await
    .map_err(|err| anyhow!("reqwest error downloading thumbnail: {:?}", err))?
    .bytes()
    .await
    .map_err(|err| anyhow!("error reading thumbnail bytes: {:?}", err))?
    .to_vec();

  info!(
    "Downloaded {} thumbnail bytes for operation {}",
    thumb_bytes.len(),
    operation.operation_id
  );

  let checksum = sha256_hash_bytes(&thumb_bytes)
    .map_err(|err| anyhow!("error hashing thumbnail: {:?}", err))?;

  let bucket_path = MediaFileBucketPath::generate_new(Some(THUMB_PREFIX), Some(suffix));
  let object_path = bucket_path.get_full_object_path_str();

  info!("Uploading thumbnail to public bucket at path: {}", object_path);

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
    .media_file_origin_product_category(MediaFileOriginProductCategory::WorldGeneration)
    .mime_type(mime_type)
    .file_size_bytes(thumb_bytes.len() as u64)
    .checksum_sha2(&checksum)
    .maybe_prompt_token(job.maybe_prompt_token.as_ref())
    .public_bucket_directory_hash(&bucket_path)
    .insert_pool(&deps.mysql_pool)
    .await
    .map_err(|err| anyhow!("error inserting thumbnail media file record: {:?}", err))?;

  info!(
    "Created thumbnail media file {} for operation {}.",
    thumb_token.as_str(),
    operation.operation_id
  );

  Ok(thumb_token)
}
