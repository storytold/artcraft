use anyhow::anyhow;
use sqlx;
use sqlx::MySqlPool;

use enums::by_table::generic_synthetic_ids::id_category::IdCategory;
use enums::by_table::media_files::media_file_animation_type::MediaFileAnimationType;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_engine_category::MediaFileEngineCategory;
use enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory;
use enums::by_table::media_files::media_file_origin_product_category::MediaFileOriginProductCategory;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::common::generation_provider::GenerationProvider;
use enums::common::visibility::Visibility;
use errors::AnyhowResult;
use tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken;
use tokens::tokens::batch_generations::BatchGenerationToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::prompts::PromptToken;
use tokens::tokens::users::UserToken;

use crate::queries::generic_synthetic_ids::transactional_increment_generic_synthetic_id::transactional_increment_generic_synthetic_id;

pub enum UploadType {
  ThirdPartyInference,
  Filesystem,
  DeviceCaptureApi,
  StorytellerEngine,
}

pub struct InsertMediaFileFromUploadArgs<'a> {
  pub pool: &'a MySqlPool,

  pub media_file_type: MediaFileType,
  pub maybe_media_class: Option<MediaFileClass>,

  pub upload_type: UploadType,

  pub maybe_engine_category: Option<MediaFileEngineCategory>,
  pub maybe_animation_type: Option<MediaFileAnimationType>,

  pub maybe_creator_user_token: Option<&'a UserToken>,
  pub maybe_creator_anonymous_visitor_token: Option<&'a AnonymousVisitorTrackingToken>,
  pub creator_ip_address: &'a str,
  pub creator_set_visibility: Visibility,

  pub maybe_mime_type: Option<&'a str>,
  pub file_size_bytes: u64,
  pub sha256_checksum: &'a str,

  pub maybe_prompt_token: Option<&'a PromptToken>,
  pub maybe_batch_token: Option<&'a BatchGenerationToken>,

  pub maybe_title: Option<&'a str>,
  pub maybe_duration_millis: Option<u64>,

  pub maybe_scene_source_media_file_token: Option<&'a MediaFileToken>,
  pub is_intermediate_system_file: bool,

  /// If provided, the third-party provider that generated this file.
  /// When set, `is_user_upload` and `is_intermediate_system_file` will be set to false.
  pub maybe_generation_provider: Option<GenerationProvider>,

  pub public_bucket_directory_hash: &'a str,
  pub maybe_public_bucket_prefix: Option<&'a str>,
  pub maybe_public_bucket_extension: Option<&'a str>,
}

pub async fn insert_media_file_from_file_upload(
  args: InsertMediaFileFromUploadArgs<'_>
) -> AnyhowResult<(MediaFileToken, u64)>
{
  let token = MediaFileToken::generate();

  let mut origin_category = match args.upload_type {
    UploadType::ThirdPartyInference => MediaFileOriginCategory::ThirdPartyInference,
    UploadType::Filesystem => MediaFileOriginCategory::Upload,
    UploadType::DeviceCaptureApi => MediaFileOriginCategory::DeviceApi,
    UploadType::StorytellerEngine => MediaFileOriginCategory::StorytellerStudio,
  };

  let mut maybe_generation_provider_str = None;
  let mut is_intermediate_system_file = args.is_intermediate_system_file;
  let mut is_user_upload = true;

  if let Some(generation_provider) = args.maybe_generation_provider {
    // Overrides if we're using a generation provider
    maybe_generation_provider_str = Some(generation_provider.to_str());
    is_intermediate_system_file = false;
    is_user_upload = false;
    if generation_provider != GenerationProvider::Artcraft {
      origin_category = MediaFileOriginCategory::ThirdPartyInference;
    }
  }

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

  let record_id = {
    let query_result = sqlx::query!(
        r#"
INSERT INTO media_files
SET
  token = ?,

  media_class = ?,
  media_type = ?,

  origin_category = ?,
  origin_product_category = ?,

  maybe_engine_category = ?,
  maybe_animation_type = ?,

  maybe_mime_type = ?,
  file_size_bytes = ?,

  checksum_sha2 = ?,

  maybe_prompt_token = ?,
  maybe_batch_token = ?,

  maybe_title = ?,
  maybe_duration_millis = ?,

  public_bucket_directory_hash = ?,
  maybe_public_bucket_prefix = ?,
  maybe_public_bucket_extension = ?,

  maybe_creator_user_token = ?,
  maybe_creator_anonymous_visitor_token = ?,
  creator_ip_address = ?,

  creator_set_visibility = ?,

  maybe_scene_source_media_file_token = ?,

  is_intermediate_system_file = ?,
  is_user_upload = ?,

  maybe_generation_provider = ?,

  maybe_creator_file_synthetic_id = ?,
  maybe_creator_category_synthetic_id = ?,

  maybe_origin_model_type = NULL,
  maybe_origin_model_token = NULL
        "#,
      token.as_str(),

      args.maybe_media_class
        .map(|media_class| media_class.to_str())
        .unwrap_or_else(|| MediaFileClass::Unknown.to_str()),

      args.media_file_type.to_str(),

      origin_category.to_str(),
      ORIGIN_PRODUCT_CATEGORY.to_str(),

      args.maybe_engine_category.map(|s| s.to_str()),
      args.maybe_animation_type.map(|s| s.to_str()),

      args.maybe_mime_type,
      args.file_size_bytes,

      args.sha256_checksum,

      args.maybe_prompt_token.map(|t| t.as_str()),
      args.maybe_batch_token.map(|t| t.as_str()),

      args.maybe_title,
      args.maybe_duration_millis,

      args.public_bucket_directory_hash,
      args.maybe_public_bucket_prefix,
      args.maybe_public_bucket_extension,

      args.maybe_creator_user_token,
      args.maybe_creator_anonymous_visitor_token,
      args.creator_ip_address,

      args.creator_set_visibility.to_str(),

      args.maybe_scene_source_media_file_token.map(|t| t.as_str()),

      is_intermediate_system_file,
      is_user_upload,

      maybe_generation_provider_str,

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
