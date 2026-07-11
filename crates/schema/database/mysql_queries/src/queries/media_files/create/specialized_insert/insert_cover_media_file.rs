use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory;
use enums::by_table::media_files::media_file_origin_product_category::MediaFileOriginProductCategory;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::common::generation_provider::GenerationProvider;
use enums::common::platform_type::PlatformType;
use enums::common::visibility::Visibility;
use tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::prompts::PromptToken;
use tokens::tokens::users::UserToken;

use crate::queries::media_files::create::generic_insert::insert_media_file_generic_executor::{insert_media_file_generic_executor, InsertMediaFileGenericExecutorArgs};

pub struct InsertCoverMediaFileArgs<'a, 'c, E>
where
  E: 'a + Executor<'c, Database = MySql>,
{
  // Creator info (copied from the generation job).
  pub maybe_creator_user_token: Option<&'a UserToken>,
  pub maybe_creator_anonymous_visitor_token: Option<&'a AnonymousVisitorTrackingToken>,
  pub creator_ip_address: &'a str,

  /// The image format of the cover (png, jpg, webp, ...).
  pub media_file_type: MediaFileType,
  pub mime_type: &'a str,
  pub file_size_bytes: u64,
  pub checksum_sha2: &'a str,
  pub public_bucket_path: &'a MediaFileBucketPath,

  /// Product category of the generation the cover belongs to (e.g.
  /// `WorldGeneration` for gaussian splat covers).
  pub maybe_origin_product_category: Option<MediaFileOriginProductCategory>,
  pub maybe_prompt_token: Option<&'a PromptToken>,
  pub maybe_platform_type: Option<PlatformType>,

  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Insert a cover image media file record (e.g. a mesh/splat thumbnail
/// downloaded from a generation provider).
///
/// Cover images are always `media_class = image` and — critically — always
/// `is_intermediate_system_file = TRUE`, so they never appear in the user's
/// asset collection. They are low-quality preview renders, not assets the
/// user paid to generate.
///
/// Cover images deliberately do not consume the creator's synthetic file IDs:
/// those number the user's visible assets, and covers are hidden.
pub async fn insert_cover_media_file<'a, 'c: 'a, E>(
  args: InsertCoverMediaFileArgs<'a, 'c, E>,
) -> Result<MediaFileToken, sqlx::Error>
where
  E: 'a + Executor<'c, Database = MySql>,
{
  let (media_token, _record_id) = insert_media_file_generic_executor(InsertMediaFileGenericExecutorArgs {
    maybe_creator_user_token: args.maybe_creator_user_token,
    maybe_creator_anonymous_visitor_token: args.maybe_creator_anonymous_visitor_token,
    creator_ip_address: args.creator_ip_address,
    creator_set_visibility: Visibility::Public,
    media_class: MediaFileClass::Image,
    media_type: args.media_file_type,
    is_user_upload: false,
    is_intermediate_system_file: true,
    origin_category: MediaFileOriginCategory::Inference,
    origin_product_category: args.maybe_origin_product_category
        .unwrap_or(MediaFileOriginProductCategory::Unknown),
    maybe_origin_model_type: None,
    maybe_origin_model_token: None,
    maybe_origin_filename: None,
    maybe_mime_type: Some(args.mime_type),
    file_size_bytes: args.file_size_bytes,
    maybe_duration_millis: None,
    maybe_audio_encoding: None,
    maybe_video_encoding: None,
    maybe_frame_width: None,
    maybe_frame_height: None,
    checksum_sha2: args.checksum_sha2,
    maybe_engine_category: None,
    maybe_title: None,
    maybe_text_transcript: None,
    maybe_scene_source_media_file_token: None,
    maybe_prompt_token: args.maybe_prompt_token,
    maybe_batch_token: None,
    public_bucket_directory_hash: args.public_bucket_path.get_object_hash(),
    maybe_public_bucket_prefix: args.public_bucket_path.get_optional_prefix(),
    maybe_public_bucket_extension: args.public_bucket_path.get_optional_extension(),
    maybe_creator_file_synthetic_id: None,
    maybe_creator_category_synthetic_id: None,
    maybe_extra_file_modification_info: None,
    is_generated_on_prem: false,
    generated_by_worker: None,
    generated_by_cluster: None,
    maybe_generation_provider: Some(GenerationProvider::Artcraft),
    maybe_platform_type: args.maybe_platform_type,
    maybe_cover_image_media_file_token: None,
    maybe_mod_user_token: None,
    mysql_executor: args.mysql_executor,
    phantom: Default::default(),
  }).await?;

  Ok(media_token)
}
