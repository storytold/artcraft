use anyhow::anyhow;
use chrono::{DateTime, Utc};
use log::error;
use sqlx::{MySql, MySqlPool};
use sqlx::pool::PoolConnection;

use enums_db::by_table::model_weights::weights_category::WeightsCategory;
use enums_db::by_table::model_weights::weights_types::WeightsType;
use enums::common::visibility::Visibility;
use errors::AnyhowResult;
use tokens::tokens::{model_weights::ModelWeightToken, users::UserToken};

use crate::helpers::boolean_converters::i64_to_bool;
use crate::helpers::transform_optional_result::transform_optional_result;
use crate::utils::transactor::Transactor;
// Notes ensure that Enums have sqlx::Type
//  'weights_type: enums_db::by_table::model_weights::weights_types::WeightsType' use this to map
// Retrieved Model Weight can be constrained to the fields that are needed

// NB: Serialize is only for internal moderator endpoints
#[derive(Serialize)]
pub struct RetrievedModelWeight {
    pub token: ModelWeightToken,
    pub title: String,
    pub weights_type: WeightsType,
    pub weights_category: WeightsCategory,
    pub maybe_description_markdown: Option<String>,
    pub maybe_description_rendered_html: Option<String>,

    pub maybe_ietf_language_tag: Option<String>,
    pub maybe_ietf_primary_language_subtag: Option<String>,

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
    pub cached_usage_count: u64,

    pub is_featured: bool,

    pub version: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub user_deleted_at: Option<DateTime<Utc>>,
    pub mod_deleted_at: Option<DateTime<Utc>>,
}

pub async fn get_weight_by_token(
    weight_token: &ModelWeightToken,
    can_see_deleted: bool,
    mysql_pool: &MySqlPool
) -> AnyhowResult<Option<RetrievedModelWeight>> {
    let mut connection = mysql_pool.acquire().await?;
    get_weights_by_token_with_connection(weight_token, can_see_deleted, &mut connection).await
}

pub async fn get_weights_by_token_with_connection(
    weight_token: &ModelWeightToken,
    can_see_deleted: bool,
    mysql_connection: &mut PoolConnection<MySql>
) -> AnyhowResult<Option<RetrievedModelWeight>> {
    get_weight_by_token_with_transactor(
        weight_token,
        can_see_deleted,
        Transactor::for_connection(mysql_connection)
    ).await
}

pub async fn get_weight_by_token_with_transactor(
    weight_token: &ModelWeightToken,
    can_see_deleted: bool,
    transactor: Transactor<'_, '_>,
) -> AnyhowResult<Option<RetrievedModelWeight>> {
    let maybe_result = if can_see_deleted {
        select_include_deleted(weight_token, transactor).await
    } else {
        select_without_deleted(weight_token, transactor).await
    };

    let record: RawWeight = match maybe_result {
        Ok(Some(record)) => record,
        Ok(None) => return Ok(None),
        Err(sqlx::Error::RowNotFound) => return Ok(None),
        Err(err) => {
            error!("Error fetching weights by token: {:?}", err);
            return Err(anyhow!("Error fetching weights by token: {:?}", err));
        }
    };

    // unwrap the result

    Ok(
        Some(RetrievedModelWeight {
            token: record.token,
            title: record.title,
            weights_type: record.weights_type,
            weights_category: record.weights_category,
            maybe_description_markdown: record.maybe_description_markdown,
            maybe_description_rendered_html: record.maybe_description_rendered_html,
            maybe_ietf_language_tag: record.maybe_ietf_language_tag,
            maybe_ietf_primary_language_subtag: record.maybe_ietf_primary_language_subtag,
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
            cached_usage_count: record.cached_usage_count,
            is_featured: i64_to_bool(record.is_featured),
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
    mut transactor: Transactor<'_, '_>,
) -> Result<Option<RawWeight>, sqlx::Error> {
    let query = sqlx
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

        wt.maybe_ietf_language_tag,
        wt.maybe_ietf_primary_language_subtag,

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
        wt.cached_usage_count,

        featured_items.entity_token IS NOT NULL AS is_featured,

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
        LEFT OUTER JOIN featured_items
            ON featured_items.entity_type = "model_weight"
            AND featured_items.entity_token = wt.token
            AND featured_items.deleted_at IS NULL
        WHERE
            wt.token = ?
            "#,
            weight_token.as_str()
        );

    let result = match transactor {
        Transactor::Pool { pool } => {
            query.fetch_one(pool).await
        },
        Transactor::Connection { connection } => {
            query.fetch_one(connection).await
        },
        Transactor::Transaction { transaction } => {
            query.fetch_one(&mut **transaction).await
        },
    };

    let maybe_record = transform_optional_result(result)?;

    Ok(maybe_record)
}

async fn select_without_deleted(
    weight_token: &ModelWeightToken,
    mut transactor: Transactor<'_, '_>,
) -> Result<Option<RawWeight>, sqlx::Error> {
    let query = sqlx
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

        wt.maybe_ietf_language_tag,
        wt.maybe_ietf_primary_language_subtag,

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
        wt.cached_usage_count,

        featured_items.entity_token IS NOT NULL AS is_featured,

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
        LEFT OUTER JOIN featured_items
            ON featured_items.entity_type = "model_weight"
            AND featured_items.entity_token = wt.token
            AND featured_items.deleted_at IS NULL
        WHERE
            wt.token = ?
            AND wt.user_deleted_at IS NULL
            AND wt.mod_deleted_at IS NULL
        "#,
            weight_token.as_str()
        );

    let result = match transactor {
        Transactor::Pool { pool } => {
            query.fetch_one(pool).await
        },
        Transactor::Connection { connection } => {
            query.fetch_one(connection).await
        },
        Transactor::Transaction { transaction } => {
            query.fetch_one(&mut **transaction).await
        },
    };

    let maybe_record = transform_optional_result(result)?;

    Ok(maybe_record)
}

// RawWeight is the struct that is returned from the database in raw form.
#[derive(Serialize)]
struct RawWeight {
    token: ModelWeightToken,
    title: String,
    weights_type: WeightsType,
    weights_category: WeightsCategory,
    maybe_description_markdown: Option<String>,
    maybe_description_rendered_html: Option<String>,

    maybe_ietf_language_tag: Option<String>,
    maybe_ietf_primary_language_subtag: Option<String>,

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
    cached_usage_count: u64,

    is_featured: i64,

    version: i32,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
    user_deleted_at: Option<DateTime<Utc>>,
    mod_deleted_at: Option<DateTime<Utc>>,
}
