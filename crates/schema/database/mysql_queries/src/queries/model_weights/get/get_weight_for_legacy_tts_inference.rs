use chrono::{DateTime, Utc};
use log::error;
use sqlx::{MySql, MySqlPool};
use sqlx::pool::PoolConnection;

use enums_db::by_table::model_weights::weights_category::WeightsCategory;
use enums_db::by_table::model_weights::weights_types::WeightsType;
use enums::common::visibility::Visibility;
use enums::common::vocoder_type::VocoderType;
use tokens::tokens::{model_weights::ModelWeightToken, users::UserToken};

use crate::helpers::boolean_converters::nullable_i8_to_bool_default_false;
use crate::queries::tts::tts_models::get_tts_model_for_inference_improved::{CustomVocoderFields, TtsModelForInferenceError};

#[derive(Clone)]
pub struct ModelWeightForLegacyTtsInference {
    pub token: ModelWeightToken,
    pub title: String,
    pub weights_type: WeightsType,
    pub weights_category: WeightsCategory,
    pub maybe_description_markdown: Option<String>,
    pub maybe_description_rendered_html: Option<String>,

    pub creator_user_token: UserToken,
    pub creator_username: String,
    pub creator_display_name: String,
    pub creator_gravatar_hash: String,

    pub creator_ip_address: String,
    pub creator_set_visibility: Visibility,

    pub maybe_last_update_user_token: Option<UserToken>,
    pub original_download_url: Option<String>,
    pub original_filename: Option<String>,
    pub file_size_bytes: i64,
    pub file_checksum_sha2: String,
    pub public_bucket_hash: String,
    pub maybe_public_bucket_prefix: Option<String>,
    pub maybe_public_bucket_extension: Option<String>,

    pub maybe_cover_image_public_bucket_hash: Option<String>,
    pub maybe_cover_image_public_bucket_prefix: Option<String>,
    pub maybe_cover_image_public_bucket_extension: Option<String>,

    pub maybe_ratings_positive_count: Option<u32>,
    pub maybe_ratings_negative_count: Option<u32>,
    pub maybe_bookmark_count: Option<u32>,

    pub maybe_ietf_language_tag: Option<String>,
    pub maybe_ietf_primary_language_subtag: Option<String>,
    pub maybe_default_pretrained_vocoder: Option<String>,
    pub maybe_text_pipeline_type: Option<String>,

    // Joined custom vocoder fields
    pub maybe_custom_vocoder: Option<CustomVocoderFields>,

    pub use_default_mel_multiply_factor: bool,
    pub maybe_custom_mel_multiply_factor: Option<f64>,

    pub version: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub user_deleted_at: Option<DateTime<Utc>>,
    pub mod_deleted_at: Option<DateTime<Utc>>,
}

pub async fn get_weight_for_legacy_tts_inference(
    weight_token: &ModelWeightToken,
    mysql_pool: &MySqlPool
) -> Result<Option<ModelWeightForLegacyTtsInference>, TtsModelForInferenceError> {
    let mut connection = mysql_pool.acquire()
        .await
        .map_err(|err| {
            error!("Error acquiring db connection from pool: {:?}", err);
            TtsModelForInferenceError::DatabaseError {
                reason: format!("Mysql connection error: {:?}", err)
            }
        })?;

    get_weight_for_legacy_tts_inference_with_connection(weight_token, &mut connection).await
}

pub async fn get_weight_for_legacy_tts_inference_with_connection(
    weight_token: &ModelWeightToken,
    mysql_connection: &mut PoolConnection<MySql>
) -> Result<Option<ModelWeightForLegacyTtsInference>, TtsModelForInferenceError> {
    let maybe_result = select_include_deleted(weight_token, mysql_connection).await;

    let record: RawWeight = match maybe_result {
        Ok(record) => record,
        Err(sqlx::Error::RowNotFound) => {
            return Ok(None);
        }
        Err(err) => {
            error!("Error fetching weights by token: {:?}", err);
            return Err(TtsModelForInferenceError::DatabaseError {
                reason: format!("Mysql error: {:?}", err)
            });
        }
    };

    if record.mod_deleted_at.is_some() || record.user_deleted_at.is_some() {
        return Err(TtsModelForInferenceError::ModelDeleted);
    }

    Ok(Some(ModelWeightForLegacyTtsInference {
        token: record.token,
        title: record.title,
        weights_type: record.weights_type,
        weights_category: record.weights_category,
        maybe_description_markdown: record.maybe_description_markdown,
        maybe_description_rendered_html: record.maybe_description_rendered_html,
        creator_user_token: record.creator_user_token,
        creator_username: record.creator_username,
        creator_display_name: record.creator_display_name,
        creator_gravatar_hash: record.creator_gravatar_hash,
        creator_ip_address: record.creator_ip_address,
        creator_set_visibility: record.creator_set_visibility,
        maybe_last_update_user_token: record.maybe_last_update_user_token,
        original_download_url: record.original_download_url,
        original_filename: record.original_filename,
        file_size_bytes: record.file_size_bytes,
        file_checksum_sha2: record.file_checksum_sha2,
        public_bucket_hash: record.public_bucket_hash,
        maybe_public_bucket_prefix: record.maybe_public_bucket_prefix,
        maybe_public_bucket_extension: record.maybe_public_bucket_extension,
        maybe_cover_image_public_bucket_hash: record.maybe_cover_image_public_bucket_hash,
        maybe_cover_image_public_bucket_prefix: record.maybe_cover_image_public_bucket_prefix,
        maybe_cover_image_public_bucket_extension: record.maybe_cover_image_public_bucket_extension,
        maybe_ratings_positive_count: record.maybe_ratings_positive_count,
        maybe_ratings_negative_count: record.maybe_ratings_negative_count,
        maybe_bookmark_count: record.maybe_bookmark_count,
        maybe_ietf_language_tag: record.maybe_ietf_language_tag,
        maybe_ietf_primary_language_subtag: record.maybe_ietf_primary_language_subtag,
        maybe_default_pretrained_vocoder: record.maybe_default_pretrained_vocoder,
        maybe_text_pipeline_type: record.maybe_text_pipeline_type,
        maybe_custom_vocoder: match record.maybe_custom_vocoder_token {
            // NB: We're relying on a single field's presence to infer that the others vocoder fields
            // are also there. If for some reason they aren't, fail open.
            None => None,
            Some(vocoder_token) => Some(CustomVocoderFields {
                vocoder_token,
                vocoder_type: record.maybe_custom_vocoder_type.ok_or(
                    TtsModelForInferenceError::DatabaseError { reason: "custom_vocoder_type field error".to_string() })?,
                vocoder_title: record.maybe_custom_vocoder_title.ok_or(
                    TtsModelForInferenceError::DatabaseError { reason: "custom_vocoder_title field error".to_string() })?,
                vocoder_private_bucket_hash: record.maybe_custom_vocoder_private_bucket_hash.ok_or(
                    TtsModelForInferenceError::DatabaseError { reason: "vocoder_private_bucket_hash field error".to_string() })?,
            })
        },
        use_default_mel_multiply_factor: nullable_i8_to_bool_default_false(record.use_default_mel_multiply_factor),
        maybe_custom_mel_multiply_factor: record.maybe_custom_mel_multiply_factor,
        version: record.version,
        created_at: record.created_at,
        updated_at: record.updated_at,
        user_deleted_at: record.user_deleted_at,
        mod_deleted_at: record.mod_deleted_at,
    }))
}

async fn select_include_deleted(
    weight_token: &ModelWeightToken,
    mysql_connection: &mut PoolConnection<MySql>
) -> Result<RawWeight, sqlx::Error> {
    sqlx
        ::query_as!(
            RawWeight,
            r#"
        SELECT
        wt.token as `token: tokens::tokens::model_weights::ModelWeightToken`,
        wt.title,
        wt.weights_type as `weights_type: enums_db::by_table::model_weights::weights_types::WeightsType`,
        wt.weights_category as `weights_category: enums_db::by_table::model_weights::weights_category::WeightsCategory`,
        wt.maybe_description_markdown,
        wt.maybe_description_rendered_html,

        wt.creator_user_token as `creator_user_token: tokens::tokens::users::UserToken`,
        users.username as creator_username,
        users.display_name as creator_display_name,
        users.email_gravatar_hash AS creator_gravatar_hash,

        wt.creator_ip_address,
        wt.creator_set_visibility as `creator_set_visibility: enums::common::visibility::Visibility`,
        wt.maybe_last_update_user_token as `maybe_last_update_user_token: tokens::tokens::users::UserToken`,
        wt.original_download_url,
        wt.original_filename,
        wt.file_size_bytes,
        wt.file_checksum_sha2,

        wt.public_bucket_hash,
        wt.maybe_public_bucket_prefix,
        wt.maybe_public_bucket_extension,

        cover_image.public_bucket_directory_hash as maybe_cover_image_public_bucket_hash,
        cover_image.maybe_public_bucket_prefix as maybe_cover_image_public_bucket_prefix,
        cover_image.maybe_public_bucket_extension as maybe_cover_image_public_bucket_extension,

        entity_stats.ratings_positive_count as maybe_ratings_positive_count,
        entity_stats.ratings_negative_count as maybe_ratings_negative_count,
        entity_stats.bookmark_count as maybe_bookmark_count,

        w_extension.ietf_language_tag as maybe_ietf_language_tag,
        w_extension.ietf_primary_language_subtag as maybe_ietf_primary_language_subtag,
        w_extension.maybe_default_pretrained_vocoder,
        w_extension.text_pipeline_type as maybe_text_pipeline_type,
        w_extension.use_default_mel_multiply_factor,
        w_extension.maybe_custom_mel_multiply_factor,

        w_extension.maybe_custom_vocoder_token,

        vocoder.vocoder_type as `maybe_custom_vocoder_type: enums::common::vocoder_type::VocoderType`,
        vocoder.title as maybe_custom_vocoder_title,
        vocoder.private_bucket_hash as maybe_custom_vocoder_private_bucket_hash,

        wt.version,
        wt.created_at,
        wt.updated_at,
        wt.user_deleted_at,
        wt.mod_deleted_at

        FROM model_weights as wt
        JOIN users
            ON users.token = wt.creator_user_token
        LEFT OUTER JOIN media_files as cover_image
            ON cover_image.token = wt.maybe_cover_image_media_file_token
        LEFT OUTER JOIN entity_stats
            ON entity_stats.entity_type = "model_weight"
            AND entity_stats.entity_token = wt.token

        LEFT OUTER JOIN model_weights_extension_tts_details as w_extension
            ON w_extension.model_weights_token = wt.token

        LEFT OUTER JOIN vocoder_models AS vocoder
            ON vocoder.token = w_extension.maybe_custom_vocoder_token

        WHERE
            wt.token = ?
            "#,
            weight_token.as_str()
        )
        .fetch_one(&mut **mysql_connection).await
}

#[derive(Serialize)]
pub struct RawWeight {
    token: ModelWeightToken,
    title: String,
    weights_type: WeightsType,
    weights_category: WeightsCategory,
    maybe_description_markdown: Option<String>,
    maybe_description_rendered_html: Option<String>,

    creator_user_token: UserToken,
    creator_username: String,
    creator_display_name: String,
    creator_gravatar_hash: String,

    creator_ip_address: String,
    creator_set_visibility: Visibility,
    maybe_last_update_user_token: Option<UserToken>,
    original_download_url: Option<String>,
    original_filename: Option<String>,
    file_size_bytes: i64,
    file_checksum_sha2: String,
    public_bucket_hash: String,
    maybe_public_bucket_prefix: Option<String>,
    maybe_public_bucket_extension: Option<String>,

    maybe_cover_image_public_bucket_hash: Option<String>,
    maybe_cover_image_public_bucket_prefix: Option<String>,
    maybe_cover_image_public_bucket_extension: Option<String>,

    maybe_ratings_positive_count: Option<u32>,
    maybe_ratings_negative_count: Option<u32>,
    maybe_bookmark_count: Option<u32>,

    maybe_ietf_language_tag: Option<String>,
    maybe_ietf_primary_language_subtag: Option<String>,
    maybe_default_pretrained_vocoder: Option<String>,
    maybe_text_pipeline_type: Option<String>,

    // Joined custom vocoder fields
    maybe_custom_vocoder_token: Option<String>,
    maybe_custom_vocoder_type: Option<VocoderType>,
    maybe_custom_vocoder_title: Option<String>,
    maybe_custom_vocoder_private_bucket_hash: Option<String>,

    use_default_mel_multiply_factor: Option<i8>, // bool; note this was *not* optional before, but is because of our join
    maybe_custom_mel_multiply_factor: Option<f64>,

    version: i32,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
    user_deleted_at: Option<DateTime<Utc>>,
    mod_deleted_at: Option<DateTime<Utc>>,
}
