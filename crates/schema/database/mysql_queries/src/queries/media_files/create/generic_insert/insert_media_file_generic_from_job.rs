use sqlx;
use sqlx::MySqlPool;

use enums::by_table::generic_synthetic_ids::id_category::IdCategory;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory;
use enums::by_table::media_files::media_file_origin_model_type::MediaFileOriginModelType;
use enums::by_table::media_files::media_file_origin_product_category::MediaFileOriginProductCategory;
use enums::by_table::media_files::media_file_type::MediaFileType;
use errors::AnyhowResult;
use tokens::tokens::batch_generations::BatchGenerationToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::prompts::PromptToken;
use tokens::tokens::users::UserToken;

use crate::payloads::media_file_extra_info::media_file_extra_info::MediaFileExtraInfo;
use crate::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;
use crate::queries::media_files::create::generic_insert::insert_media_file_generic::{insert_media_file_generic, InsertArgs};

pub struct InsertFromJobArgs<'a> {
    pub pool: &'a MySqlPool,

    // Job record provides some information: creator details, IP address, etc.
    pub job: &'a AvailableInferenceJob,

    // Important database indices
    pub media_class: MediaFileClass,
    pub media_type: MediaFileType,
    pub is_intermediate_system_file: bool,
    // TODO: is_user_upload

    // Product and other origination information
    pub origin_category: MediaFileOriginCategory,
    pub origin_product_category: MediaFileOriginProductCategory,
    pub maybe_origin_model_type: Option<MediaFileOriginModelType>,
    pub maybe_origin_model_token: Option<&'a ModelWeightToken>,
    pub maybe_origin_filename: Option<String>,

    // Media info
    pub maybe_mime_type: Option<&'a str>,
    pub file_size_bytes: u64,
    pub maybe_duration_millis: Option<u64>,
    pub maybe_audio_encoding: Option<&'a str>,
    pub maybe_video_encoding: Option<&'a str>,
    pub maybe_frame_width: Option<u32>,
    pub maybe_frame_height: Option<u32>,
    pub checksum_sha2: &'a str,

    // User text information
    pub maybe_title: Option<&'a str>,
    pub maybe_text_transcript: Option<&'a str>,

    // If generated from a scene, this is the scene media file token.
    pub maybe_scene_source_media_file_token: Option<&'a MediaFileToken>,

    // If additional prompt details are stored, this is the prompt token.
    pub maybe_prompt_token: Option<&'a PromptToken>,

    // If batch generated, this is the batch token.
    pub maybe_batch_token: Option<&'a BatchGenerationToken>,

    // Storage details
    pub public_bucket_directory_hash: &'a str,
    pub maybe_public_bucket_prefix: Option<&'a str>,
    pub maybe_public_bucket_extension: Option<&'a str>,

    // Counters
    pub maybe_creator_file_synthetic_id_category: IdCategory,
    pub maybe_creator_category_synthetic_id_category: IdCategory,

    /// Extra polymorphic data stored in `extra_file_modification_info` column.
    /// This differs on a per media type basis and can depend on the product
    /// that generates the media file.
    pub maybe_extra_media_info: Option<&'a MediaFileExtraInfo>,

    // Worker generation info
    pub is_generated_on_prem: bool,
    pub generated_by_worker: Option<&'a str>,
    pub generated_by_cluster: Option<&'a str>,

    // Moderation details (deprecated)
    pub maybe_mod_user_token: Option<&'a UserToken>,
}

pub async fn insert_media_file_generic_from_job(
    args: InsertFromJobArgs<'_>
) -> AnyhowResult<(MediaFileToken, u64)>
{
    insert_media_file_generic(InsertArgs {
        checksum_sha2: args.checksum_sha2,
        creator_ip_address: &args.job.creator_ip_address,
        creator_set_visibility: args.job.creator_set_visibility,
        file_size_bytes: args.file_size_bytes,
        generated_by_cluster: args.generated_by_cluster,
        generated_by_worker: args.generated_by_worker,
        is_generated_on_prem: args.is_generated_on_prem,
        is_intermediate_system_file: args.is_intermediate_system_file,
        is_user_upload: false, // NB: Jobs typically won't be user uploads. Maybe this becomes a param in the future(?)
        maybe_audio_encoding: args.maybe_audio_encoding,
        maybe_batch_token: args.maybe_batch_token,
        maybe_creator_anonymous_visitor_token: args.job.maybe_creator_anonymous_visitor_token_typed.as_ref(),
        maybe_creator_category_synthetic_id_category: args.maybe_creator_category_synthetic_id_category,
        maybe_creator_file_synthetic_id_category: args.maybe_creator_file_synthetic_id_category,
        maybe_creator_user_token: args.job.maybe_creator_user_token_typed.as_ref(),
        maybe_duration_millis: args.maybe_duration_millis,
        maybe_extra_media_info: args.maybe_extra_media_info,
        maybe_frame_height: args.maybe_frame_height,
        maybe_frame_width: args.maybe_frame_width,
        maybe_engine_category: None,
        maybe_mime_type: args.maybe_mime_type,
        maybe_mod_user_token: args.maybe_mod_user_token,
        maybe_origin_filename: args.maybe_origin_filename,
        maybe_origin_model_token: args.maybe_origin_model_token,
        maybe_origin_model_type: args.maybe_origin_model_type,
        maybe_prompt_token: args.maybe_prompt_token,
        maybe_public_bucket_extension: args.maybe_public_bucket_extension,
        maybe_public_bucket_prefix: args.maybe_public_bucket_prefix,
        maybe_scene_source_media_file_token: args.maybe_scene_source_media_file_token,
        maybe_text_transcript: args.maybe_text_transcript,
        maybe_title: args.maybe_title,
        maybe_video_encoding: args.maybe_video_encoding,
        maybe_cover_image_media_file_token: None,
        media_class: args.media_class,
        media_type: args.media_type,
        origin_category: args.origin_category,
        origin_product_category: args.origin_product_category,
        pool: &args.pool,
        public_bucket_directory_hash: args.public_bucket_directory_hash,
    }).await
}
