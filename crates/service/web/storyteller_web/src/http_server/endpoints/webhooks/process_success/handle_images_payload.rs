use crate::state::server_state::ServerState;
use crate::util::http_download_url_to_bytes::http_download_url_to_bytes;
use anyhow::anyhow;
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory;
use enums::by_table::media_files::media_file_type::MediaFileType;
use errors::AnyhowResult;
use hashing::sha256::sha256_hash_bytes::sha256_hash_bytes;
use images::encoding::webp_bytes_to_png_bytes::webp_bytes_to_png_bytes;
use images::image_info::image_info::ImageInfo;
use log::info;
use mimetypes::mimetype_info::file_extension::FileExtension;
use mimetypes::mimetype_info::mimetype_info::MimetypeInfo;
use mysql_queries::queries::generic_inference::fal::get_inference_job_by_fal_id::FalJobDetails;
use mysql_queries::queries::media_files::create::insert_builder::media_file_insert_builder::MediaFileInsertBuilder;
use serde_json::{Map, Value};
use tokens::tokens::batch_generations::BatchGenerationToken;
use tokens::tokens::media_files::MediaFileToken;

const PREFIX : Option<&str> = Some("artcraft_");

#[derive(Deserialize, Debug)]
pub struct FalWebhookImage {
  pub content_type: Option<String>,
  pub file_name: Option<String>,
  pub file_size: Option<usize>,
  pub height: Option<usize>,
  pub width: Option<usize>,
  pub url: Option<String>,
}

pub async fn handle_images_payload(
  payload: &Map<String, Value>,
  job: &FalJobDetails,
  server_state: &ServerState,
) -> AnyhowResult<(Option<MediaFileToken>, Option<BatchGenerationToken>)> {

  let images_value = payload.get("images")
      .ok_or_else(|| anyhow!("no `images` key in payload"))?;

  info!("Fal Images Payload: {:?}", images_value);
  
  let images: Vec<FalWebhookImage> = serde_json::from_value(images_value.clone())?;
  
  let mut maybe_media_token = None;

  // NB: We are not going to create `batch_generations` table records. We don't need them.
  // The foreign key in `media_files` is enough to look up the rest of the batch.
  let mut maybe_batch_token = None;

  if images.len() > 1 {
    maybe_batch_token = Some(BatchGenerationToken::generate());
  }

  for image in images {
    let media_token = upload_image(job, server_state, &image, maybe_batch_token.as_ref()).await?;
    
    if maybe_media_token.is_none() {
      maybe_media_token = Some(media_token); // Set the first media token
    }
  }
  
  Ok((maybe_media_token, maybe_batch_token))
}

async fn upload_image(
  job: &FalJobDetails,
  server_state: &ServerState,
  image: &FalWebhookImage,
  maybe_batch_token: Option<&BatchGenerationToken>,
) -> AnyhowResult<MediaFileToken> {
  let image_url = image.url
      .as_deref()
      .ok_or_else(|| anyhow!("no `url` in image payload"))?;

  //let mime_type = image.content_type
  //    .as_deref()
  //    .ok_or_else(|| anyhow!("no `content_type` in image payload"))?;

  let file_bytes = http_download_url_to_bytes(image_url)
      .await
      .map_err(|e| anyhow!("Failed to download image: {:?}", e))?;

  let mimetype_info = MimetypeInfo::get_for_bytes(&file_bytes)
      .ok_or_else(|| anyhow!("Failed to get mimetype info"))?;

  info!("File type: {}, extension: {:?}",
       mimetype_info.mime_type(),
       mimetype_info.file_extension());

  match mimetype_info.file_extension() {
    Some(FileExtension::Webp) => {
      info!("Artcraft can't handle WebP images yet; converting to PNG...");

      let file_bytes = webp_bytes_to_png_bytes(&file_bytes)?;

      let mimetype_info = MimetypeInfo::get_for_bytes(&file_bytes)
          .ok_or_else(|| anyhow!("Failed to get mimetype info"))?;

      info!("Updated file type: {}, extension: {:?}",
        mimetype_info.mime_type(),
        mimetype_info.file_extension());

      upload_image_bytes(
        job,
        server_state,
        image,
        &file_bytes,
        mimetype_info,
        maybe_batch_token,
      ).await
    }
    _ => {
      upload_image_bytes(
        job,
        server_state,
        image,
        &file_bytes,
        mimetype_info,
        maybe_batch_token,
      ).await
    }
  }
}

async fn upload_image_bytes(
  job: &FalJobDetails,
  server_state: &ServerState,
  image: &FalWebhookImage,
  file_bytes: &[u8],
  mimetype_info: MimetypeInfo,
  maybe_batch_token: Option<&BatchGenerationToken>,
) -> AnyhowResult<MediaFileToken> {

  let mime_type = mimetype_info.mime_type();

  let media_file_type = MediaFileType::try_from_mime_type(mime_type)
      .ok_or_else(|| anyhow!("Unsupported media file type: {}", mime_type))?;

  info!("MediaFileType: {:?}", media_file_type);

  let extension_with_period = mimetype_info.file_extension()
      .map(|ext| ext.extension_with_period())
      .ok_or_else(|| anyhow!("Failed to get file extension from mimetype info"))?;

  let file_size_bytes = file_bytes.len();
  let file_hash = sha256_hash_bytes(&file_bytes)?;
  let image_info = ImageInfo::decode_image_from_bytes(&file_bytes)?;

  let public_upload_path = MediaFileBucketPath::generate_new(PREFIX, Some(&extension_with_period));

  info!("Uploading media to bucket path: {}", public_upload_path.get_full_object_path_str());

  server_state.public_bucket_client.upload_file_with_content_type_process(
    public_upload_path.get_full_object_path_str(),
    file_bytes.as_ref(),
    &mime_type)
      .await?;

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
      .await?;

  info!("Image media file uploaded with token: {} ; possible batch token: {:?}",
    media_token, maybe_batch_token);

  Ok(media_token)
}
