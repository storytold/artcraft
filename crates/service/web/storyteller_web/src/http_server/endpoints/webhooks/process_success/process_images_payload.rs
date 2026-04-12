use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;
use crate::http_server::endpoints::webhooks::process_success::resolve_file_metadata::resolve_file_metadata;
use crate::state::server_state::ServerState;
use crate::util::http_download_url_to_bytes::http_download_url_to_bytes;
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory;
use enums::by_table::media_files::media_file_type::MediaFileType;
use fal_client::webhook_api::hydrated::hydrated_webhook_contents::ImagesData;
use hashing::sha256::sha256_hash_bytes::sha256_hash_bytes;
use images::encoding::webp_bytes_to_png_bytes::webp_bytes_to_png_bytes;
use images::image_info::image_info::ImageInfo;
use log::{error, info, warn};
use mimetypes::mimetype_info::file_extension::FileExtension;
use mysql_queries::queries::generic_inference::fal::get_inference_job_by_fal_id::FalJobDetails;
use mysql_queries::queries::media_files::create::insert_builder::media_file_insert_builder::MediaFileInsertBuilder;
use pager::client::pager::Pager;
use pager::notification::notification_details_builder::NotificationDetailsBuilder;
use pager::notification::notification_urgency::NotificationUrgency;
use tokens::tokens::batch_generations::BatchGenerationToken;
use tokens::tokens::media_files::MediaFileToken;

const PREFIX : Option<&str> = Some("artcraft_");

pub async fn process_images_payload(
  images_data: &[ImagesData],
  job: &FalJobDetails,
  server_state: &ServerState,
  pager: &Pager,
) -> Result<(Option<MediaFileToken>, Option<BatchGenerationToken>), AdvancedCommonWebError> {

  let mut maybe_media_token = None;

  // NB: We are not going to create `batch_generations` table records. We don't need them.
  // The foreign key in `media_files` is enough to look up the rest of the batch.
  let mut maybe_batch_token = None;

  if images_data.len() > 1 {
    maybe_batch_token = Some(BatchGenerationToken::generate());
  }

  // NB: Fal has been failing for some images in batches of many images.
  // Rather than fail the entire batch, let's skip the failure(s) and notify ourselves.
  let mut success_count = 0;
  let mut maybe_error = None;

  for (i, image) in images_data.iter().enumerate() {
    info!("Uploading image {} of {}: {:?}", i + 1, images_data.len(), image.url);

    let result = upload_image(job, server_state, image, maybe_batch_token.as_ref()).await;

    let media_token = match result {
      Ok(token) => token,
      Err(err) => {
        maybe_error = Some(err);
        continue;
      }
    };

    if maybe_media_token.is_none() {
      maybe_media_token = Some(media_token); // Set the first media token
    }

    success_count += 1;
  }

  if success_count == 0 {
    if let Some(err) = maybe_error {
      return Err(AdvancedCommonWebError::from_error(err));
    } else {
      // NB: Branch should be unreachable.
      return Err(AdvancedCommonWebError::server_error_with_message("none of the images could be processed"));
    }
  }

  if let Some(err) = maybe_error {
    // Even if some images were downloaded, let's still page about any failures.
    let notification = NotificationDetailsBuilder::from_boxed_error(err.into())
        .set_title(format!("Failure to download all images from FAL webhook: {} out of {} succeeded", success_count, images_data.len()))
        .set_description(Some(format!(
          "We uploaded all of the images we could and marked the job as a success, \
          but the user may need assistance with the remaining images and/or reimbursement.\n\
          **Internal Job Token**: {}\n\
          **Fal ID**: {}\n",
          job.job_token.as_str(),
          job.external_third_party_id)))
        .set_urgency(Some(NotificationUrgency::Medium))
        .build();

    if let Err(pager_err) = pager.enqueue_page(notification) {
      error!("Failed to enqueue FAL webhook parse error alert: {:?}", pager_err);
    }
  }

  Ok((maybe_media_token, maybe_batch_token))
}

async fn upload_image(
  job: &FalJobDetails,
  server_state: &ServerState,
  image: &ImagesData,
  maybe_batch_token: Option<&BatchGenerationToken>,
) -> Result<MediaFileToken, AdvancedCommonWebError> {
  let image_url = image.url
      .as_deref()
      .ok_or_else(|| {
        warn!("No `url` in image payload");
        AdvancedCommonWebError::server_error_with_message("no `url` in image payload")
      })?;

  // Download with a retry if the first attempt returns suspiciously few bytes.
  let mut file_bytes = http_download_url_to_bytes(image_url)
      .await
      .map_err(|e| {
        warn!("Failed to download image from {}: {:?}", image_url, e);
        AdvancedCommonWebError::server_error_with_message(
          &format!("Failed to download image: {:?}", e))
      })?;

  if file_bytes.len() <= 10 {
    warn!(
      "Downloaded only {} bytes from {} — retrying once",
      file_bytes.len(),
      image_url,
    );
    file_bytes = http_download_url_to_bytes(image_url)
        .await
        .map_err(|e| {
          warn!("Failed to download image on retry from {}: {:?}", image_url, e);
          AdvancedCommonWebError::server_error_with_message(
            &format!("Failed to download image on retry: {:?}", e))
        })?;
  }

  // Resolve mime type: magic bytes first, fal content_type as fallback.
  let metadata = resolve_file_metadata(&file_bytes, image.content_type.as_deref())
      .ok_or_else(|| {
        warn!(
          "Could not determine file type for image (bytes: {}, fal content_type: {:?})",
          file_bytes.len(),
          image.content_type,
        );
        AdvancedCommonWebError::server_error_with_message(
          &format!("Could not determine file type for image (bytes: {}, fal content_type: {:?})",
            file_bytes.len(), image.content_type))
      })?;

  info!("File type: {}, extension: {:?}, source: {:?}",
    metadata.mime_type, metadata.file_extension, metadata.source);

  match metadata.file_extension {
    FileExtension::Webp => {
      info!("Artcraft can't handle WebP images yet; converting to PNG...");

      let converted = webp_bytes_to_png_bytes(&file_bytes)
          .map_err(|e| {
            warn!("Failed to convert WebP to PNG: {:?}", e);
            AdvancedCommonWebError::from_error(e)
          })?;

      let converted_metadata = resolve_file_metadata(&converted, Some("image/png"))
          .ok_or_else(|| {
            warn!("Failed to determine file type after WebP→PNG conversion");
            AdvancedCommonWebError::server_error_with_message(
              "Failed to determine file type after WebP→PNG conversion")
          })?;

      info!("Converted file type: {}, extension: {:?}",
        converted_metadata.mime_type, converted_metadata.file_extension);

      upload_image_bytes(
        job,
        server_state,
        &converted,
        &converted_metadata.mime_type,
        converted_metadata.file_extension,
        maybe_batch_token,
      ).await
    }
    _ => {
      upload_image_bytes(
        job,
        server_state,
        &file_bytes,
        &metadata.mime_type,
        metadata.file_extension,
        maybe_batch_token,
      ).await
    }
  }
}

async fn upload_image_bytes(
  job: &FalJobDetails,
  server_state: &ServerState,
  file_bytes: &[u8],
  mime_type: &str,
  file_extension: FileExtension,
  maybe_batch_token: Option<&BatchGenerationToken>,
) -> Result<MediaFileToken, AdvancedCommonWebError> {

  let media_file_type = MediaFileType::try_from_mime_type(mime_type)
      .ok_or_else(|| {
        warn!("Unsupported media file type: {}", mime_type);
        AdvancedCommonWebError::server_error_with_message(
          &format!("Unsupported media file type: {}", mime_type))
      })?;

  info!("MediaFileType: {:?}", media_file_type);

  let extension_with_period = file_extension.extension_with_period();

  let file_size_bytes = file_bytes.len();
  let file_hash = sha256_hash_bytes(&file_bytes)
      .map_err(|e| {
        warn!("Failed to hash image bytes: {:?}", e);
        AdvancedCommonWebError::from_anyhow_error(e)
      })?;
  let image_info = ImageInfo::decode_image_from_bytes(&file_bytes)
      .map_err(|e| {
        warn!("Failed to decode image info: {:?}", e);
        AdvancedCommonWebError::from_error(e)
      })?;

  let public_upload_path = MediaFileBucketPath::generate_new(PREFIX, Some(&extension_with_period));

  info!("Uploading media to bucket path: {}", public_upload_path.get_full_object_path_str());

  server_state.public_bucket_client.upload_file_with_content_type_process(
    public_upload_path.get_full_object_path_str(),
    file_bytes.as_ref(),
    mime_type)
      .await
      .map_err(|e| {
        warn!("Failed to upload image to bucket: {:?}", e);
        AdvancedCommonWebError::from_anyhow_error(e)
      })?;

  let mut query_builder = MediaFileInsertBuilder::new()
      .maybe_creator_user(job.maybe_creator_user_token.as_ref())
      .maybe_creator_anonymous_visitor(job.maybe_creator_anonymous_visitor_token.as_ref())
      .creator_ip_address(&job.creator_ip_address)
      .public_bucket_directory_hash(&public_upload_path)
      .media_file_class(MediaFileClass::Image)
      .media_file_type(media_file_type)
      .media_file_origin_category(MediaFileOriginCategory::Inference)
      //.media_file_origin_product_category(MediaFileOriginProductCategory::Unknown)
      .mime_type(mime_type)
      .file_size_bytes(file_size_bytes as u64)
      .frame_width(image_info.width())
      .frame_height(image_info.height())
      .maybe_prompt_token(job.maybe_prompt_token.as_ref())
      .checksum_sha2(&file_hash);

  if let Some(batch_token) = maybe_batch_token {
    query_builder = query_builder.maybe_batch_generation_token(Some(batch_token));
  }

  let media_token = query_builder
      .insert_pool(&server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Failed to insert image media file record: {:?}", e);
        AdvancedCommonWebError::from_error(e)
      })?;

  info!("Image media file uploaded with token: {} ; possible batch token: {:?}",
    media_token, maybe_batch_token);

  Ok(media_token)
}

#[cfg(test)]
mod tests {
  use crate::util::http_download_url_to_bytes::http_download_url_to_bytes;
  use mimetypes::mimetype_info::mimetype_info::MimetypeInfo;

  /// Diagnostic test: download real fal-hosted images and check if MimetypeInfo
  /// can detect them. This test is #[ignore]'d because it makes real HTTP
  /// requests.
  #[tokio::test]
  #[ignore]
  async fn diagnose_fal_image_mimetype_detection() {
    let urls = [
      "https://v3b.fal.media/files/b/[REDACT].png",
      "https://v3b.fal.media/files/b/[REDACT].png",
      "https://v3b.fal.media/files/b/[REDACT].png",
      "https://v3b.fal.media/files/b/[REDACT].png",
    ];

    for url in urls {
      println!("\n--- Downloading: {} ---", url);
      let bytes = http_download_url_to_bytes(url).await
        .unwrap_or_else(|e| panic!("Failed to download {}: {:?}", url, e));

      println!("  Downloaded {} bytes", bytes.len());

      // Print first 32 bytes as hex for magic number inspection.
      let head: Vec<u8> = bytes.iter().take(32).cloned().collect();
      println!("  First 32 bytes (hex): {:02x?}", head);
      println!("  First 16 bytes (ascii): {:?}", String::from_utf8_lossy(&head[..16.min(head.len())]));

      let mimetype = MimetypeInfo::get_for_bytes(&bytes);
      match mimetype {
        Some(info) => {
          println!("  Detected mime type: {}", info.mime_type());
          println!("  Detected extension: {:?}", info.file_extension());
        }
        None => {
          println!("  ERROR: MimetypeInfo::get_for_bytes returned None!");
          println!("  This is the bug — infer could not detect the file type.");
        }
      }
    }
  }

  /// Diagnostic test: download a real fal-hosted video and check mimetype.
  #[tokio::test]
  #[ignore]
  async fn diagnose_fal_video_mimetype_detection() {
    let url = "https://v3b.fal.media/files/b/[REDACT].mp4";

    println!("\n--- Downloading: {} ---", url);
    let bytes = http_download_url_to_bytes(url).await
      .unwrap_or_else(|e| panic!("Failed to download {}: {:?}", url, e));

    println!("  Downloaded {} bytes", bytes.len());

    let head: Vec<u8> = bytes.iter().take(32).cloned().collect();
    println!("  First 32 bytes (hex): {:02x?}", head);
    println!("  First 16 bytes (ascii): {:?}", String::from_utf8_lossy(&head[..16.min(head.len())]));

    let mimetype = MimetypeInfo::get_for_bytes(&bytes);
    match mimetype {
      Some(info) => {
        println!("  Detected mime type: {}", info.mime_type());
        println!("  Detected extension: {:?}", info.file_extension());
      }
      None => {
        println!("  ERROR: MimetypeInfo::get_for_bytes returned None!");
        println!("  This is the bug — infer could not detect the file type.");
      }
    }
  }
}
