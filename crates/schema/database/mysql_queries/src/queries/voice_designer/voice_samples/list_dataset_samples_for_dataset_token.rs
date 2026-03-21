use anyhow::anyhow;
use chrono::{DateTime, Utc};
use log::warn;
use sqlx::{Error, MySql, MySqlPool};
use sqlx::pool::PoolConnection;

use enums_db::by_table::media_files::media_file_type::MediaFileType;
use errors::AnyhowResult;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::users::UserToken;
use tokens::tokens::zs_voice_dataset_samples::ZsVoiceDatasetSampleToken;
use tokens::tokens::zs_voice_datasets::ZsVoiceDatasetToken;

pub struct DatasetSampleRecordForList {
    pub sample_token: ZsVoiceDatasetSampleToken,

    pub media_file_token: MediaFileToken,
    pub media_type: MediaFileType,

    // Bucket path, prefix, and extension are all that are required to construct a path to
    // download media from cloud buckets.
    pub public_bucket_directory_hash: String,
    pub maybe_public_bucket_prefix: Option<String>,
    pub maybe_public_bucket_extension: Option<String>,

    pub maybe_creator_user_token: Option<UserToken>,

    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    // TODO: Other fields
}


pub async fn list_dataset_samples_for_dataset_token(
    dataset_token: &ZsVoiceDatasetToken,
    can_see_deleted: bool,
    mysql_pool: &MySqlPool,
) -> AnyhowResult<Vec<DatasetSampleRecordForList>> {
    let mut connection = mysql_pool.acquire().await?;
    list_samples_by_dataset_token_with_connection(
        dataset_token,
        can_see_deleted,
        &mut connection
    ).await
}

pub async fn list_samples_by_dataset_token_with_connection(
    dataset_token: &ZsVoiceDatasetToken,
    can_see_deleted: bool,
    mysql_connection: &mut PoolConnection<MySql>,
) -> AnyhowResult<Vec<DatasetSampleRecordForList>> {


    let maybe_samples = list_samples_by_dataset_token(
        mysql_connection,
        dataset_token,
        can_see_deleted
    ).await;

    let records = match maybe_samples {
        Ok(records) => records,
        Err(err) => {
            return match err {
                Error::RowNotFound => {
                    Ok(Vec::new())
                },
                _ => {
                    warn!("dataset sample list query error: {:?}", err);
                    Err(anyhow!("Error fetching dataset samples by dataset token: {:?}", err))
                }
            }
        }
    };

    Ok(records.into_iter()
        .map(|record| {
            DatasetSampleRecordForList {
                sample_token: record.token,
                media_file_token: record.media_file_token,
                media_type: record.media_type,
                public_bucket_directory_hash: record.public_bucket_directory_hash,
                maybe_public_bucket_prefix: record.maybe_public_bucket_prefix,
                maybe_public_bucket_extension: record.maybe_public_bucket_extension,
                maybe_creator_user_token: record.maybe_creator_user_token,
                created_at: record.created_at,
                updated_at: record.updated_at,
            }
        })
        .collect()
    )
}

async fn list_samples_by_dataset_token(
    mysql_connection: &mut PoolConnection<MySql>,
    dataset_token: &ZsVoiceDatasetToken,
    can_see_deleted: bool,
) -> Result<Vec<InternalRawDatasetSampleRecordForList>, Error> {
    let maybe_samples = if !can_see_deleted {
        sqlx::query_as!(
            InternalRawDatasetSampleRecordForList,
            r#"
                SELECT
                    zds.token as `token: tokens::tokens::zs_voice_dataset_samples::ZsVoiceDatasetSampleToken`,
                    zds.media_file_token as `media_file_token: tokens::tokens::media_files::MediaFileToken`,
                    m.media_type as `media_type: enums_db::by_table::media_files::media_file_type::MediaFileType`,
                    m.public_bucket_directory_hash,
                    m.maybe_public_bucket_prefix,
                    m.maybe_public_bucket_extension,
                    zds.maybe_creator_user_token as `maybe_creator_user_token: tokens::tokens::users::UserToken`,
                    zds.created_at,
                    zds.updated_at
                FROM zs_voice_dataset_samples as zds
                JOIN media_files as m
                    ON zds.media_file_token = m.token
                WHERE zds.dataset_token = ?
                    AND zds.user_deleted_at IS NULL
                    AND zds.mod_deleted_at IS NULL
            "#,
            dataset_token
        ).fetch_all(&mut **mysql_connection).await?
    } else {
        sqlx::query_as!(
            InternalRawDatasetSampleRecordForList,
            r#"
                SELECT
                    zds.token as `token: tokens::tokens::zs_voice_dataset_samples::ZsVoiceDatasetSampleToken`,
                    zds.media_file_token as `media_file_token: tokens::tokens::media_files::MediaFileToken`,
                    m.media_type as `media_type: enums_db::by_table::media_files::media_file_type::MediaFileType`,
                    m.public_bucket_directory_hash,
                    m.maybe_public_bucket_prefix,
                    m.maybe_public_bucket_extension,
                    zds.maybe_creator_user_token as `maybe_creator_user_token: tokens::tokens::users::UserToken`,
                    zds.created_at,
                    zds.updated_at
                FROM zs_voice_dataset_samples as zds
                JOIN media_files as m
                    ON zds.media_file_token = m.token
                WHERE zds.dataset_token = ?
            "#,
            dataset_token
        ).fetch_all(&mut **mysql_connection).await?
    };

    Ok(maybe_samples)
}


struct InternalRawDatasetSampleRecordForList {
    token: ZsVoiceDatasetSampleToken,

    media_file_token: MediaFileToken,
    media_type: MediaFileType,

    public_bucket_directory_hash: String,
    maybe_public_bucket_prefix: Option<String>,
    maybe_public_bucket_extension: Option<String>,

    maybe_creator_user_token: Option<UserToken>,

    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
    // TODO: Other fields
}
