use std::marker::PhantomData;

use sqlx;
use sqlx::{Executor, MySql};

use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_engine_category::MediaFileEngineCategory;
use enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory;
use enums::by_table::media_files::media_file_origin_model_type::MediaFileOriginModelType;
use enums::by_table::media_files::media_file_origin_product_category::MediaFileOriginProductCategory;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::common::generation_provider::GenerationProvider;
use enums::common::platform_type::PlatformType;
use enums::common::visibility::Visibility;
use tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken;
use tokens::tokens::batch_generations::BatchGenerationToken;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::prompts::PromptToken;
use tokens::tokens::users::UserToken;

/// Arguments for [`insert_media_file_generic_executor`].
///
/// This is the executor-generic core of `insert_media_file_generic`: it runs
/// the single INSERT statement and nothing else. Synthetic-ID increments and
/// extra-info serialization stay with the caller (see
/// `insert_media_file_generic`, which wraps this in a transaction).
pub struct InsertMediaFileGenericExecutorArgs<'a, 'c, E>
where
    E: 'a + Executor<'c, Database = MySql>,
{
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

    // If produced by an inference job, the job that generated this file.
    pub maybe_source_job_token: Option<&'a InferenceJobToken>,

    // Storage details
    pub public_bucket_directory_hash: &'a str,
    pub maybe_public_bucket_prefix: Option<&'a str>,
    pub maybe_public_bucket_extension: Option<&'a str>,

    // Counters, pre-computed by the caller (see
    // `transactional_increment_generic_synthetic_id`).
    pub maybe_creator_file_synthetic_id: Option<u64>,
    pub maybe_creator_category_synthetic_id: Option<u64>,

    /// Extra polymorphic data stored in `extra_file_modification_info`,
    /// pre-serialized to JSON by the caller.
    pub maybe_extra_file_modification_info: Option<String>,

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

    pub mysql_executor: E,
    pub phantom: PhantomData<&'c E>,
}

/// Insert a media file record using any executor (pool, connection, or open
/// transaction). This is the single-statement core shared by
/// `insert_media_file_generic` and the specialized inserts.
pub async fn insert_media_file_generic_executor<'a, 'c: 'a, E>(
    args: InsertMediaFileGenericExecutorArgs<'a, 'c, E>,
) -> Result<(MediaFileToken, u64), sqlx::Error>
where
    E: 'a + Executor<'c, Database = MySql>,
{
    let result_token = MediaFileToken::generate();

    let mut maybe_generation_provider_str = None;
    let is_intermediate_system_file = args.is_intermediate_system_file;
    let mut is_user_upload = args.is_user_upload;
    let mut origin_category = args.origin_category;

    if let Some(generation_provider) = args.maybe_generation_provider {
        // Overrides if we're using a generation provider.
        // NB: `is_intermediate_system_file` is deliberately NOT reset here:
        // generated cover images / thumbnails set both a generation provider
        // and the intermediate flag, and clobbering the flag made them appear
        // in users' asset collections. The flag defaults to false at call
        // sites, so honoring the explicit setting is always correct.
        maybe_generation_provider_str = Some(generation_provider.to_str());
        is_user_upload = false;
        if generation_provider != GenerationProvider::Artcraft {
            origin_category = MediaFileOriginCategory::ThirdPartyInference;
        }
    }

    let query_result = sqlx::query!(
        r#"
        INSERT INTO media_files
        SET
            token = ?,

            media_class = ?,
            media_type = ?,

            is_user_upload = ?,
            is_intermediate_system_file = ?,

            origin_category = ?,
            origin_product_category = ?,
            maybe_origin_model_type = ?,
            maybe_origin_model_token = ?,
            maybe_origin_filename = ?,

            maybe_batch_token = ?,
            maybe_source_job_token = ?,

            maybe_mime_type = ?,
            file_size_bytes = ?,
            maybe_duration_millis = ?,
            maybe_audio_encoding = ?,
            maybe_video_encoding = ?,
            maybe_frame_width = ?,
            maybe_frame_height = ?,
            maybe_prompt_token = ?,
            checksum_sha2 = ?,

            maybe_engine_category = ?,

            maybe_title = ?,
            maybe_text_transcript = ?,

            maybe_scene_source_media_file_token = ?,

            public_bucket_directory_hash = ?,
            maybe_public_bucket_prefix = ?,
            maybe_public_bucket_extension = ?,

            maybe_creator_user_token = ?,
            maybe_creator_anonymous_visitor_token = ?,

            creator_ip_address = ?,
            creator_set_visibility = ?,

            maybe_creator_file_synthetic_id = ?,
            maybe_creator_category_synthetic_id = ?,

            extra_file_modification_info = ?,

            maybe_generation_provider = ?,

            platform_type = ?,

            maybe_cover_image_media_file_token = ?,

            maybe_mod_user_token = ?,
            is_generated_on_prem = ?,
            generated_by_worker = ?,
            generated_by_cluster = ?
        "#,
        result_token,

        args.media_class.to_str(),
        args.media_type.to_str(),

        is_user_upload,
        is_intermediate_system_file,

        origin_category.to_str(),
        args.origin_product_category.to_str(),
        args.maybe_origin_model_type.map(|e| e.to_str()),
        args.maybe_origin_model_token.map(|t| t.to_string()),
        args.maybe_origin_filename,

        args.maybe_batch_token.map(|t| t.as_str()),
        args.maybe_source_job_token.map(|t| t.as_str()),

        args.maybe_mime_type,
        args.file_size_bytes,
        args.maybe_duration_millis,
        args.maybe_audio_encoding,
        args.maybe_video_encoding,
        args.maybe_frame_width,
        args.maybe_frame_height,
        args.maybe_prompt_token.map(|t| t.as_str()),
        args.checksum_sha2,

        args.maybe_engine_category.map(|e| e.to_str()),

        args.maybe_title,
        args.maybe_text_transcript,

        args.maybe_scene_source_media_file_token.map(|t| t.as_str()),

        args.public_bucket_directory_hash,
        args.maybe_public_bucket_prefix,
        args.maybe_public_bucket_extension,

        args.maybe_creator_user_token.map(|t| t.as_str()),
        args.maybe_creator_anonymous_visitor_token.map(|t| t.as_str()),

        args.creator_ip_address,
        args.creator_set_visibility.to_str(),

        args.maybe_creator_file_synthetic_id,
        args.maybe_creator_category_synthetic_id,

        args.maybe_extra_file_modification_info,

        maybe_generation_provider_str,

        args.maybe_platform_type.map(|p| p.to_str()),

        args.maybe_cover_image_media_file_token.map(|t| t.as_str()),

        args.maybe_mod_user_token,
        args.is_generated_on_prem,
        args.generated_by_worker,
        args.generated_by_cluster
    ).execute(args.mysql_executor).await?;

    Ok((result_token, query_result.last_insert_id()))
}
