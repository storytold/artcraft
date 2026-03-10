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
use mysql_queries::queries::generic_inference::worldlabs::list_pending_worldlabs_jobs::PendingWorldlabsJob;
use mysql_queries::queries::media_files::create::insert_builder::media_file_insert_builder::MediaFileInsertBuilder;
use mysql_queries::queries::generic_inference::web::mark_generic_inference_job_successfully_done_by_token::mark_generic_inference_job_successfully_done_by_token;
use world_labs_api::api::requests::get_operation::get_operation::GetOperationResponse;
use crate::job_dependencies::JobDependencies;

const PREFIX: &str = "artcraft_";
const SUFFIX: &str = ".spz";

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
  let bucket_path = MediaFileBucketPath::generate_new(Some(PREFIX), Some(SUFFIX));

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
    .media_file_origin_product_category(MediaFileOriginProductCategory::ImageGeneration)
    .mime_type("application/gzip")
    .file_size_bytes(splat_bytes.len() as u64)
    .checksum_sha2(&checksum)
    .maybe_prompt_token(job.maybe_prompt_token.as_ref())
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
