use anyhow::anyhow;
use sqlx;
use sqlx::MySqlPool;

use enums::by_table::generic_synthetic_ids::id_category::IdCategory;
use enums::by_table::media_files::media_file_animation_type::MediaFileAnimationType;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_engine_category::MediaFileEngineCategory;
use enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory;
use enums::by_table::media_files::media_file_origin_product_category::MediaFileOriginProductCategory;
use enums::by_table::media_files::media_file_project_type::MediaFileProjectType;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::common::visibility::Visibility;
use errors::AnyhowResult;
use tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::users::UserToken;

use crate::queries::generic_synthetic_ids::transactional_increment_generic_synthetic_id::transactional_increment_generic_synthetic_id;

pub enum UploadType {
  Filesystem,
  DeviceCaptureApi,
  StorytellerEngine,
}

pub struct UpsertMediaFileFromUploadArgs<'a> {
  pub pool: &'a MySqlPool,

  /// If the media file token is present, we're upserting an existing media file.
  pub maybe_media_file_token: Option<&'a MediaFileToken>,

  pub maybe_media_class: Option<MediaFileClass>,
  pub media_file_type: MediaFileType,

  /// Only set for internal Artcraft project documents (`media_class = 'project'`).
  pub maybe_project_type: Option<MediaFileProjectType>,

  pub maybe_engine_category: Option<MediaFileEngineCategory>,
  pub maybe_animation_type: Option<MediaFileAnimationType>,

  pub maybe_creator_user_token: Option<&'a UserToken>,
  pub maybe_creator_anonymous_visitor_token: Option<&'a AnonymousVisitorTrackingToken>,
  pub creator_ip_address: &'a str,
  pub creator_set_visibility: Visibility,

  pub upload_type: UploadType,

  pub maybe_mime_type: Option<&'a str>,
  pub file_size_bytes: u64,
  pub duration_millis: u64,
  pub sha256_checksum: &'a str,

  // TODO: Media duration.
  //pub duration_millis: u64,

  pub public_bucket_directory_hash: &'a str,
  pub maybe_public_bucket_prefix: Option<&'a str>,
  pub maybe_public_bucket_extension: Option<&'a str>,
}

pub async fn upsert_media_file_from_file_upload(
  args: UpsertMediaFileFromUploadArgs<'_>
) -> AnyhowResult<(MediaFileToken, u64)>
{
  let token = args.maybe_media_file_token
      .map(|token| token.clone())
      .unwrap_or_else(|| MediaFileToken::generate());

  let origin_category = match args.upload_type {
    UploadType::Filesystem => MediaFileOriginCategory::Upload,
    UploadType::DeviceCaptureApi => MediaFileOriginCategory::DeviceApi,
    UploadType::StorytellerEngine => MediaFileOriginCategory::StorytellerStudio,
  };

  let mut maybe_creator_file_synthetic_id : Option<u64> = None;
  let mut maybe_creator_category_synthetic_id : Option<u64> = None;

  let mut transaction = args.pool.begin().await?;

  if let Some(user_token) = args.maybe_creator_user_token.as_deref() {

    let next_media_file_id = transactional_increment_generic_synthetic_id(
      &user_token,
      IdCategory::MediaFile,
      &mut transaction
    ).await?;

    let next_voice_conversion_id = transactional_increment_generic_synthetic_id(
      &user_token,
      IdCategory::FileUpload,
      &mut transaction
    ).await?;

    maybe_creator_file_synthetic_id = Some(next_media_file_id);
    maybe_creator_category_synthetic_id = Some(next_voice_conversion_id);
  }

  const ORIGIN_PRODUCT_CATEGORY : MediaFileOriginProductCategory = MediaFileOriginProductCategory::Unknown;

  let media_class = args.maybe_media_class.unwrap_or(MediaFileClass::Unknown);

  let record_id = {
    let query_result = sqlx::query!(
        r#"
INSERT INTO media_files
SET
  token = ?,

  media_class = ?,
  media_type = ?,
  maybe_project_type = ?,

  origin_category = ?,
  origin_product_category = ?,

  maybe_engine_category = ?,
  maybe_animation_type = ?,

  maybe_mime_type = ?,
  file_size_bytes = ?,

  checksum_sha2 = ?,

  public_bucket_directory_hash = ?,
  maybe_public_bucket_prefix = ?,
  maybe_public_bucket_extension = ?,

  maybe_creator_user_token = ?,
  maybe_creator_anonymous_visitor_token = ?,
  creator_ip_address = ?,

  creator_set_visibility = ?,

  maybe_creator_file_synthetic_id = ?,
  maybe_creator_category_synthetic_id = ?,

  is_user_upload = TRUE,

  maybe_origin_model_type = NULL,
  maybe_origin_model_token = NULL

ON DUPLICATE KEY UPDATE

  media_class = ?,
  media_type = ?,
  maybe_project_type = ?,

  origin_category = ?,
  origin_product_category = ?,

  maybe_engine_category = ?,
  maybe_animation_type = ?,

  maybe_mime_type = ?,
  file_size_bytes = ?,

  checksum_sha2 = ?,

  public_bucket_directory_hash = ?,
  maybe_public_bucket_prefix = ?,
  maybe_public_bucket_extension = ?,

  maybe_creator_user_token = ?,
  maybe_creator_anonymous_visitor_token = ?,
  creator_ip_address = ?,

  creator_set_visibility = ?,

  maybe_creator_file_synthetic_id = ?,
  maybe_creator_category_synthetic_id = ?,

  is_user_upload = TRUE,

  maybe_origin_model_type = NULL,
  maybe_origin_model_token = NULL
        "#,
      token.as_str(),

      media_class.to_str(),
      args.media_file_type.to_str(),
      args.maybe_project_type.map(|project_type| project_type.to_str()),

      origin_category.to_str(),
      ORIGIN_PRODUCT_CATEGORY.to_str(),

      args.maybe_engine_category.map(|s| s.to_str()),
      args.maybe_animation_type.map(|s| s.to_str()),

      args.maybe_mime_type,
      args.file_size_bytes,

      args.sha256_checksum,

      args.public_bucket_directory_hash,
      args.maybe_public_bucket_prefix,
      args.maybe_public_bucket_extension,

      args.maybe_creator_user_token,
      args.maybe_creator_anonymous_visitor_token,
      args.creator_ip_address,

      args.creator_set_visibility.to_str(),

      maybe_creator_file_synthetic_id,
      maybe_creator_category_synthetic_id,

      // Duplicate key

      media_class.to_str(),
      args.media_file_type.to_str(),
      args.maybe_project_type.map(|project_type| project_type.to_str()),

      origin_category.to_str(),
      ORIGIN_PRODUCT_CATEGORY.to_str(),

      args.maybe_engine_category.map(|s| s.to_str()),
      args.maybe_animation_type.map(|s| s.to_str()),

      args.maybe_mime_type,
      args.file_size_bytes,

      args.sha256_checksum,

      args.public_bucket_directory_hash,
      args.maybe_public_bucket_prefix,
      args.maybe_public_bucket_extension,

      args.maybe_creator_user_token,
      args.maybe_creator_anonymous_visitor_token,
      args.creator_ip_address,

      args.creator_set_visibility.to_str(),

      maybe_creator_file_synthetic_id,
      maybe_creator_category_synthetic_id,
    )
        .execute(&mut *transaction)
        .await;

    let record_id = match query_result {
      Ok(res) => {
        res.last_insert_id()
      },
      Err(err) => {
        // TODO: handle better
        //transaction.rollback().await?;
        return Err(anyhow!("Mysql error: {:?}", err));
      }
    };

    record_id
  };

  transaction.commit().await?;

  Ok((token, record_id))
}
