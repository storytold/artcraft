use sqlx;
use sqlx::MySqlPool;

use enums::by_table::generic_synthetic_ids::id_category::IdCategory;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory;
use enums::by_table::media_files::media_file_origin_product_category::MediaFileOriginProductCategory;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::common::visibility::Visibility;
use errors::AnyhowResult;
use tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::users::UserToken;

use crate::queries::media_files::create::generic_insert::insert_media_file_generic::{insert_media_file_generic, InsertArgs};

pub struct InsertStudioSceneRenderArgs<'a> {
  pub pool: &'a MySqlPool,

  // User
  pub maybe_creator_user_token: Option<&'a UserToken>,
  pub maybe_creator_anonymous_visitor_token: Option<&'a AnonymousVisitorTrackingToken>,
  pub creator_ip_address: &'a str,
  pub creator_set_visibility: Visibility,

  // If generated from a scene, this is the scene media file token.
  pub maybe_scene_source_media_file_token: Option<&'a MediaFileToken>,

  // Probably mp4, but could change.
  pub media_type: MediaFileType,
  pub maybe_mime_type: Option<&'a str>,
  pub maybe_audio_encoding: Option<&'a str>,
  pub maybe_video_encoding: Option<&'a str>,
  pub maybe_frame_width: Option<u32>,
  pub maybe_frame_height: Option<u32>,

  pub maybe_duration_millis: Option<u64>,
  pub file_size_bytes: u64,
  pub sha256_checksum: &'a str,

  pub maybe_title: Option<&'a str>,

  pub public_bucket_directory_hash: &'a str,
  pub maybe_public_bucket_prefix: Option<&'a str>,
  pub maybe_public_bucket_extension: Option<&'a str>,
}

pub async fn insert_media_file_from_studio_scene_render(
  args: InsertStudioSceneRenderArgs<'_>
) -> AnyhowResult<MediaFileToken>
{
  let (new_media_token, _id) = insert_media_file_generic(InsertArgs {
    pool: &args.pool,

    // Dynamic bits (user)
    maybe_creator_user_token: args.maybe_creator_user_token,
    maybe_creator_anonymous_visitor_token: args.maybe_creator_anonymous_visitor_token,
    creator_ip_address: args.creator_ip_address,
    creator_set_visibility: args.creator_set_visibility,

    // Dynamic bits (file type and details)
    media_type: args.media_type,
    maybe_mime_type: args.maybe_mime_type,
    maybe_audio_encoding: args.maybe_audio_encoding,
    maybe_video_encoding: args.maybe_video_encoding,
    file_size_bytes: args.file_size_bytes,
    maybe_duration_millis: args.maybe_duration_millis,
    maybe_frame_width: args.maybe_frame_width,
    maybe_frame_height: args.maybe_frame_height,
    checksum_sha2: args.sha256_checksum,

    // Dynamic bits (file data)
    maybe_title: args.maybe_title,

    // Dynamic bits (foreign keys)
    maybe_scene_source_media_file_token: args.maybe_scene_source_media_file_token,

    // Dynamic bits (bucket storage)
    public_bucket_directory_hash: args.public_bucket_directory_hash,
    maybe_public_bucket_prefix: args.maybe_public_bucket_prefix,
    maybe_public_bucket_extension: args.maybe_public_bucket_extension,

    // Static bits (media class)
    media_class: MediaFileClass::Video,

    // Static bits (lookup)
    origin_category: MediaFileOriginCategory::StorytellerStudio,
    origin_product_category: MediaFileOriginProductCategory::StorytellerStudio,
    maybe_origin_model_type: None,

    // NB: All client uploads should be marked as such, even if it makes the frontend product
    // weird (i.e. users won't think of these as uploads)
    is_user_upload: true,
    is_intermediate_system_file: true,

    // Static bits (counters)
    maybe_creator_file_synthetic_id_category: IdCategory::MediaFile,
    maybe_creator_category_synthetic_id_category: IdCategory::StudioRender,

    // Static bits (we don't use a worker)
    is_generated_on_prem: false,
    generated_by_worker: None,
    generated_by_cluster: None,

    // Static bits (unused misc)
    maybe_extra_media_info: None,
    maybe_origin_model_token: None,
    maybe_text_transcript: None,
    maybe_origin_filename: None,
    maybe_batch_token: None,
    maybe_prompt_token: None,
    maybe_mod_user_token: None,
    maybe_engine_category: None,
    maybe_cover_image_media_file_token: None,
  }).await?;

  Ok(new_media_token)
}
