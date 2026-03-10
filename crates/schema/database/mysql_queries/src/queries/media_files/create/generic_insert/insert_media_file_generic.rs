use anyhow::anyhow;
use sqlx;
use sqlx::MySqlPool;

use enums::by_table::generic_synthetic_ids::id_category::IdCategory;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_engine_category::MediaFileEngineCategory;
use enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory;
use enums::by_table::media_files::media_file_origin_model_type::MediaFileOriginModelType;
use enums::by_table::media_files::media_file_origin_product_category::MediaFileOriginProductCategory;
use enums::by_table::media_files::media_file_type::MediaFileType;
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

    // Cover image (e.g. thumbnail for 3D splats)
    pub maybe_cover_image_media_file_token: Option<&'a MediaFileToken>,

    // Moderation details (deprecated)
    pub maybe_mod_user_token: Option<&'a UserToken>,
}

pub async fn insert_media_file_generic(
    args: InsertArgs<'_>
) -> AnyhowResult<(MediaFileToken, u64)>
{
    let result_token = MediaFileToken::generate();

    let extra_file_modification_info = args
        .maybe_extra_media_info.map(|extra| extra.to_json_string())
        .transpose()?;

    let mut maybe_creator_file_synthetic_id : Option<u64> = None;
    let mut maybe_creator_category_synthetic_id : Option<u64> = None;

    let is_batch_generated = args.maybe_batch_token.is_some();

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

            is_batch_generated = ?,
            maybe_batch_token = ?,

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

            maybe_cover_image_media_file_token = ?,

            maybe_mod_user_token = ?,
            is_generated_on_prem = ?,
            generated_by_worker = ?,
            generated_by_cluster = ?
        "#,
        result_token,

        args.media_class.to_str(),
        args.media_type.to_str(),

        args.is_user_upload,
        args.is_intermediate_system_file,

        args.origin_category.to_str(),
        args.origin_product_category.to_str(),
        args.maybe_origin_model_type.map(|e| e.to_str()),
        args.maybe_origin_model_token.map(|t| t.to_string()),
        args.maybe_origin_filename,

        is_batch_generated,
        args.maybe_batch_token.map(|t| t.as_str()),

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

        maybe_creator_file_synthetic_id,
        maybe_creator_category_synthetic_id,

        extra_file_modification_info,

        args.maybe_cover_image_media_file_token.map(|t| t.as_str()),

        args.maybe_mod_user_token,
        args.is_generated_on_prem,
        args.generated_by_worker,
        args.generated_by_cluster
    ).execute(&mut *transaction).await;

    let record_id = match query_result {
        Ok(res) => res.last_insert_id(),
        Err(err) => {
            // TODO: handle better
            //transaction.rollback().await?;
            return Err(anyhow!("Mysql error: {:?}", err));
        }
    };

    transaction.commit().await?;
    Ok((result_token, record_id))
}
