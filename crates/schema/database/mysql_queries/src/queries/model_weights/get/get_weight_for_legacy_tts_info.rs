use anyhow::anyhow;
use chrono::{DateTime, Utc};
use log::error;
use sqlx::{MySql, MySqlPool};
use sqlx::pool::PoolConnection;

use enums::by_table::model_weights::weights_category::WeightsCategory;
use enums_db::by_table::model_weights::weights_types::WeightsType;
use enums::common::visibility::Visibility;
use errors::AnyhowResult;
use tokens::tokens::{model_weights::ModelWeightToken, users::UserToken};

use crate::column_types::vocoder_type::VocoderType;

#[derive(Serialize, Deserialize, Clone)]
pub struct ModelWeightForLegacyTtsInfo {
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
    pub maybe_default_pretrained_vocoder: Option<VocoderType>,
    pub maybe_text_pipeline_type: Option<String>,

    pub version: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub user_deleted_at: Option<DateTime<Utc>>,
    pub mod_deleted_at: Option<DateTime<Utc>>,
}

pub async fn get_weight_for_legacy_tts_info(
    weight_token: &ModelWeightToken,
    can_see_deleted: bool,
    mysql_pool: &MySqlPool
) -> AnyhowResult<Option<ModelWeightForLegacyTtsInfo>> {
    let mut connection = mysql_pool.acquire().await?;
    get_weight_for_legacy_tts_info_with_connection(weight_token, can_see_deleted, &mut connection).await
}

pub async fn get_weight_for_legacy_tts_info_with_connection(
    weight_token: &ModelWeightToken,
    can_see_deleted: bool,
    mysql_connection: &mut PoolConnection<MySql>
) -> AnyhowResult<Option<ModelWeightForLegacyTtsInfo>> {
    let maybe_result = if can_see_deleted {
        select_include_deleted(weight_token, mysql_connection).await
    } else {
        select_without_deleted(weight_token, mysql_connection).await
    };

    let record: RawWeight = match maybe_result {
        Ok(record) => record,
        Err(sqlx::Error::RowNotFound) => {
            return Ok(None);
        }
        Err(err) => {
            error!("Error fetching weights by token: {:?}", err);
            return Err(anyhow!("Error fetching weights by token: {:?}", err));
        }
    };

    // unwrap the result

    Ok(
        Some(ModelWeightForLegacyTtsInfo {
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
            version: record.version,
            created_at: record.created_at,
            updated_at: record.updated_at,
            user_deleted_at: record.user_deleted_at,
            mod_deleted_at: record.mod_deleted_at,
        })
    )
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
        wt.weights_category as `weights_category: enums::by_table::model_weights::weights_category::WeightsCategory`,
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
        w_extension.maybe_default_pretrained_vocoder as `maybe_default_pretrained_vocoder: crate::column_types::vocoder_type::VocoderType`,
        w_extension.text_pipeline_type as maybe_text_pipeline_type,

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

        WHERE
            wt.token = ?
            "#,
            weight_token.as_str()
        )
        .fetch_one(&mut **mysql_connection).await
}

async fn select_without_deleted(
    weight_token: &ModelWeightToken,
    mysql_connection: &mut PoolConnection<MySql>
) -> Result<RawWeight, sqlx::Error> {
    //as `weights_type: enums_db::by_table::model_weights::weights_types::WeightsType`,
    //as `weights_category: enums::by_table::model_weights::weights_category::WeightsCategory`
    sqlx
        ::query_as!(
            RawWeight,
            r#"
        SELECT
        wt.token as `token: tokens::tokens::model_weights::ModelWeightToken`,
        wt.title,
        wt.weights_type as `weights_type: enums_db::by_table::model_weights::weights_types::WeightsType`,
        wt.weights_category as `weights_category: enums::by_table::model_weights::weights_category::WeightsCategory`,
        wt.maybe_description_markdown,
        wt.maybe_description_rendered_html,
        wt.creator_ip_address,
        wt.creator_set_visibility as `creator_set_visibility: enums::common::visibility::Visibility`,

        wt.creator_user_token as `creator_user_token: tokens::tokens::users::UserToken`,
        users.username as creator_username,
        users.display_name as creator_display_name,
        users.email_gravatar_hash AS creator_gravatar_hash,

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
        w_extension.maybe_default_pretrained_vocoder as `maybe_default_pretrained_vocoder: crate::column_types::vocoder_type::VocoderType`,
        w_extension.text_pipeline_type as maybe_text_pipeline_type,

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

        WHERE
            wt.token = ?
            AND wt.user_deleted_at IS NULL
            AND wt.mod_deleted_at IS NULL
        "#,
            weight_token.as_str()
        )
        .fetch_one(&mut **mysql_connection).await
}

// RawWeight is the struct that is returned from the database in raw form.
#[derive(Serialize)]
pub struct RawWeight {
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
    pub maybe_default_pretrained_vocoder: Option<VocoderType>,
    pub maybe_text_pipeline_type: Option<String>,

    pub version: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub user_deleted_at: Option<DateTime<Utc>>,
    pub mod_deleted_at: Option<DateTime<Utc>>,
}
