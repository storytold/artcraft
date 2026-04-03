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
use mysql_queries::queries::characters::activate_character_with_media::activate_character_with_media;
use mysql_queries::queries::characters::get_character_token_by_kinovi_id::get_character_token_by_kinovi_id;
use mysql_queries::queries::generic_inference::seedance2pro::list_pending_seedance2pro_character_jobs::PendingSeedance2ProCharacterJob;
use mysql_queries::queries::generic_inference::web::mark_generic_inference_job_successfully_done_by_token::mark_generic_inference_job_successfully_done_by_token;
use mysql_queries::queries::media_files::create::insert_builder::media_file_insert_builder::MediaFileInsertBuilder;
use seedance2pro_client::requests::poll_characters::poll_characters::CharacterStatus;

use crate::job_dependencies::JobDependencies;

const PREFIX: &str = "artcraft_";
const SUFFIX_PNG: &str = ".png";
const SUFFIX_JPG: &str = ".jpg";

/// Process a successfully completed character creation.
///
/// 1. Download result images and upload them as media files.
/// 2. Activate the character with the new media tokens.
/// 3. Mark the inference job as completed.
pub async fn process_successful_character(
  deps: &JobDependencies,
  job: &PendingSeedance2ProCharacterJob,
  character: &CharacterStatus,
) -> AnyhowResult<()> {

  info!(
    "Processing successful character {} for job {}",
    character.character_id, job.job_token.as_str(),
  );

  // --- Look up our character record ---

  let character_token = get_character_token_by_kinovi_id(&character.character_id, &deps.mysql_pool)
      .await
      .map_err(|err| anyhow!("Error looking up character by kinovi_id: {:?}", err))?
      .ok_or_else(|| anyhow!("Character not found for kinovi_id: {}", character.character_id))?;

  // --- Download and upload result images ---

  // The first result image with type "avatar" is the avatar; otherwise use the first image.
  // The first result image with type "full" or the second image is the full image.
  let mut maybe_avatar_media_token = None;
  let mut maybe_full_image_media_token = None;

  for (i, result_image) in character.result_images.iter().enumerate() {
    let is_avatar = result_image.image_type.as_deref() == Some("avatar") || (i == 0 && maybe_avatar_media_token.is_none());
    let is_full = result_image.image_type.as_deref() == Some("full") || (i == 1 && maybe_full_image_media_token.is_none());

    if !is_avatar && !is_full {
      continue;
    }

    let media_token = match download_and_create_media_file(deps, job, &result_image.url).await {
      Ok(token) => token,
      Err(err) => {
        warn!("Error processing result image {}: {:?}", result_image.url, err);
        continue;
      }
    };

    if is_avatar && maybe_avatar_media_token.is_none() {
      maybe_avatar_media_token = Some(media_token);
    } else if is_full && maybe_full_image_media_token.is_none() {
      maybe_full_image_media_token = Some(media_token);
    }
  }

  // --- Activate character ---

  activate_character_with_media(
    &character_token,
    maybe_avatar_media_token.as_ref(),
    maybe_full_image_media_token.as_ref(),
    character.asset_id.as_deref(),
    &deps.mysql_pool,
  )
      .await
      .map_err(|err| anyhow!("Error activating character: {:?}", err))?;

  info!("Activated character {} (token={})", character.character_id, character_token);

  // --- Mark job as completed ---

  mark_generic_inference_job_successfully_done_by_token(
    &deps.mysql_pool,
    &job.job_token,
    Some(InferenceResultType::Character),
    Some(character_token.as_str()),
    None,
    None,
  )
      .await
      .map_err(|err| anyhow!("Error marking job as done: {:?}", err))?;

  info!("Marked job {} as completed.", job.job_token.as_str());

  Ok(())
}

// =============== Private helpers ===============

/// Download an image from a URL, upload to bucket, and create a media file record.
async fn download_and_create_media_file(
  deps: &JobDependencies,
  job: &PendingSeedance2ProCharacterJob,
  image_url: &str,
) -> AnyhowResult<tokens::tokens::media_files::MediaFileToken> {
  info!("Downloading character image: {}", image_url);

  let image_bytes: Vec<u8> = reqwest::get(image_url)
    .await
    .map_err(|err| anyhow!("reqwest error downloading image: {:?}", err))?
    .bytes()
    .await
    .map_err(|err| anyhow!("error reading image bytes: {:?}", err))?
    .to_vec();

  info!("Downloaded {} bytes from {}", image_bytes.len(), image_url);

  let checksum = sha256_hash_bytes(&image_bytes)
    .map_err(|err| anyhow!("error hashing image: {:?}", err))?;

  // Determine extension from URL or default to png.
  let suffix = if image_url.contains(".jpg") || image_url.contains(".jpeg") {
    SUFFIX_JPG
  } else {
    SUFFIX_PNG
  };

  let media_type = if suffix == SUFFIX_JPG { MediaFileType::Jpg } else { MediaFileType::Png };
  let mime_type = if suffix == SUFFIX_JPG { "image/jpeg" } else { "image/png" };

  let bucket_path = MediaFileBucketPath::generate_new(Some(PREFIX), Some(suffix));
  let object_path = bucket_path.get_full_object_path_str();

  info!("Uploading character image to bucket: {}", object_path);

  deps.public_bucket_client
    .upload_file_with_content_type_process(object_path, &image_bytes, mime_type)
    .await
    .map_err(|err| anyhow!("error uploading image to bucket: {:?}", err))?;

  let media_file_token = MediaFileInsertBuilder::new()
    .maybe_creator_user(job.maybe_creator_user_token.as_ref())
    .media_file_class(MediaFileClass::Image)
    .media_file_type(media_type)
    .is_intermediate_system_file(true)
    .media_file_origin_category(MediaFileOriginCategory::Inference)
    .media_file_origin_product_category(MediaFileOriginProductCategory::VideoGeneration)
    .mime_type(mime_type)
    .file_size_bytes(image_bytes.len() as u64)
    .checksum_sha2(&checksum)
    .public_bucket_directory_hash(&bucket_path)
    .insert_pool(&deps.mysql_pool)
    .await
    .map_err(|err| anyhow!("error inserting media file record: {:?}", err))?;

  info!("Created media file {} for character image", media_file_token.as_str());

  Ok(media_file_token)
}
