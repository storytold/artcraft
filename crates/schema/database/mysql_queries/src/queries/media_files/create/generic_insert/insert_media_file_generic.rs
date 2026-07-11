use anyhow::anyhow;
use sqlx::MySqlPool;

use enums::by_table::generic_synthetic_ids::id_category::IdCategory;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_engine_category::MediaFileEngineCategory;
use enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory;
use enums::by_table::media_files::media_file_origin_model_type::MediaFileOriginModelType;
use enums::by_table::media_files::media_file_origin_product_category::MediaFileOriginProductCategory;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::common::generation_provider::GenerationProvider;
use enums::common::platform_type::PlatformType;
use enums::common::visibility::Visibility;
use errors::AnyhowResult;
use tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken;
use tokens::tokens::batch_generations::BatchGenerationToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::prompts::PromptToken;
use tokens::tokens::users::UserToken;

use crate::payloads::media_file_extra_info::media_file_extra_info::MediaFileExtraInfo;
use crate::queries::generic_synthetic_ids::transactional_increment_generic_synthetic_id::transactional_increment_generic_synthetic_id;
use crate::queries::media_files::create::generic_insert::insert_media_file_generic_executor::{insert_media_file_generic_executor, InsertMediaFileGenericExecutorArgs};

pub struct InsertArgs<'a> {
    pub pool: &'a MySqlPool,

    // Creator info
    pub maybe_creator_user_token: Option<&'a UserToken>,
    pub maybe_creator_anonymous_visitor_token: Option<&'a AnonymousVisitorTrackingToken>,
    pub creator_ip_address: &'a str,
    pub creator_set_visibility: Visibility,

    // Important database indices
    pub media_class: MediaFileClass,
    pub media_type: MediaFileType,
    pub is_user_upload: bool,
    pub is_intermediate_system_file: bool,

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

    // Media info for certain product areas
    pub maybe_engine_category: Option<MediaFileEngineCategory>, // TODO: Deprecate

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

    /// If provided, the third-party provider that generated this file.
    pub maybe_generation_provider: Option<GenerationProvider>,

    /// The platform the creating request came from, inferred from its User-Agent.
    /// For inference results, this is copied from the originating job.
    pub maybe_platform_type: Option<PlatformType>,

    // Cover image (e.g. thumbnail for 3D splats)
    pub maybe_cover_image_media_file_token: Option<&'a MediaFileToken>,

    // Moderation details (deprecated)
    pub maybe_mod_user_token: Option<&'a UserToken>,
}

/// Insert a media file record, allocating the creator's synthetic IDs in the
/// same transaction. Wraps [`insert_media_file_generic_executor`], which runs
/// the actual INSERT.
pub async fn insert_media_file_generic(
    args: InsertArgs<'_>
) -> AnyhowResult<(MediaFileToken, u64)>
{
    let extra_file_modification_info = args
        .maybe_extra_media_info.map(|extra| extra.to_json_string())
        .transpose()?;

    let mut maybe_creator_file_synthetic_id : Option<u64> = None;
    let mut maybe_creator_category_synthetic_id : Option<u64> = None;

    let mut transaction = args.pool.begin().await?;

    if let Some(user_token) = args.maybe_creator_user_token.as_deref() {
        let next_media_file_id = transactional_increment_generic_synthetic_id(
            user_token,
            args.maybe_creator_file_synthetic_id_category,
            &mut transaction
        ).await?;

        let category_id = transactional_increment_generic_synthetic_id(
            user_token,
            args.maybe_creator_category_synthetic_id_category,
            &mut transaction
        ).await?;

        maybe_creator_file_synthetic_id = Some(next_media_file_id);
        maybe_creator_category_synthetic_id = Some(category_id);
    }

    let query_result = insert_media_file_generic_executor(InsertMediaFileGenericExecutorArgs {
        maybe_creator_user_token: args.maybe_creator_user_token,
        maybe_creator_anonymous_visitor_token: args.maybe_creator_anonymous_visitor_token,
        creator_ip_address: args.creator_ip_address,
        creator_set_visibility: args.creator_set_visibility,
        media_class: args.media_class,
        media_type: args.media_type,
        is_user_upload: args.is_user_upload,
        is_intermediate_system_file: args.is_intermediate_system_file,
        origin_category: args.origin_category,
        origin_product_category: args.origin_product_category,
        maybe_origin_model_type: args.maybe_origin_model_type,
        maybe_origin_model_token: args.maybe_origin_model_token,
        maybe_origin_filename: args.maybe_origin_filename,
        maybe_mime_type: args.maybe_mime_type,
        file_size_bytes: args.file_size_bytes,
        maybe_duration_millis: args.maybe_duration_millis,
        maybe_audio_encoding: args.maybe_audio_encoding,
        maybe_video_encoding: args.maybe_video_encoding,
        maybe_frame_width: args.maybe_frame_width,
        maybe_frame_height: args.maybe_frame_height,
        checksum_sha2: args.checksum_sha2,
        maybe_engine_category: args.maybe_engine_category,
        maybe_title: args.maybe_title,
        maybe_text_transcript: args.maybe_text_transcript,
        maybe_scene_source_media_file_token: args.maybe_scene_source_media_file_token,
        maybe_prompt_token: args.maybe_prompt_token,
        maybe_batch_token: args.maybe_batch_token,
        public_bucket_directory_hash: args.public_bucket_directory_hash,
        maybe_public_bucket_prefix: args.maybe_public_bucket_prefix,
        maybe_public_bucket_extension: args.maybe_public_bucket_extension,
        maybe_creator_file_synthetic_id,
        maybe_creator_category_synthetic_id,
        maybe_extra_file_modification_info: extra_file_modification_info,
        is_generated_on_prem: args.is_generated_on_prem,
        generated_by_worker: args.generated_by_worker,
        generated_by_cluster: args.generated_by_cluster,
        maybe_generation_provider: args.maybe_generation_provider,
        maybe_platform_type: args.maybe_platform_type,
        maybe_cover_image_media_file_token: args.maybe_cover_image_media_file_token,
        maybe_mod_user_token: args.maybe_mod_user_token,
        mysql_executor: &mut *transaction,
        phantom: Default::default(),
    }).await;

    let (result_token, record_id) = match query_result {
        Ok(result) => result,
        Err(err) => {
            // TODO: handle better
            //transaction.rollback().await?;
            return Err(anyhow!("Mysql error: {:?}", err));
        }
    };

    transaction.commit().await?;
    Ok((result_token, record_id))
}
