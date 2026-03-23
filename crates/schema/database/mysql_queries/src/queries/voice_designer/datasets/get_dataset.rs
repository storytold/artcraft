use anyhow::anyhow;
use chrono::{DateTime, Utc};
use log::error;
use sqlx::{MySql, MySqlPool};
use sqlx::pool::PoolConnection;

use enums_db::common::visibility::Visibility;
use errors::AnyhowResult;
use tokens::tokens::zs_voice_datasets::ZsVoiceDatasetToken;

pub struct ZsDataset {
    pub token: ZsVoiceDatasetToken,
    pub title: String,
    pub ietf_language_tag: String,
    pub ietf_primary_language_subtag: String,
    pub maybe_creator_user_token: Option<String>,
    pub creator_set_visibility: Visibility,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

pub async fn get_dataset_by_token(
  dataset_token: &ZsVoiceDatasetToken,
  can_see_deleted: bool,
  mysql_pool: &MySqlPool,
) -> AnyhowResult<Option<ZsDataset>> {
  let mut connection = mysql_pool.acquire().await?;
  get_dataset_by_token_with_connection(
    dataset_token,
    can_see_deleted,
    &mut connection
  ).await
}

pub async fn get_dataset_by_token_with_connection(
  dataset_token: &ZsVoiceDatasetToken,
  can_see_deleted: bool,
  mysql_connection: &mut PoolConnection<MySql>,
) -> AnyhowResult<Option<ZsDataset>> {

    let maybe_result = if can_see_deleted {
        select_include_deleted(
            dataset_token,
            mysql_connection
        ).await
    } else {
        select_without_deleted(
            dataset_token,
            mysql_connection
        ).await
    };

    let record = match maybe_result {
        Ok(record) => record,
        Err(sqlx::Error::RowNotFound) => {
            return Ok(None);
        },
        Err(err) => {
            error!(
                "Error fetching dataset by token: {:?}",
                err
            );
            return Err(anyhow!(
                "Error fetching dataset by token: {:?}",
                err
            ));
        }
    };

    Ok(Some(ZsDataset {
        token: record.token,
        title: record.title,
        ietf_language_tag: record.ietf_language_tag,
        ietf_primary_language_subtag: record.ietf_primary_language_subtag,
        maybe_creator_user_token: record.maybe_creator_user_token,
        creator_set_visibility: record.creator_set_visibility,
        created_at: record.created_at,
        updated_at: record.updated_at,
    }))
}

async fn select_include_deleted(
  dataset_token: &ZsVoiceDatasetToken,
  mysql_connection: &mut PoolConnection<MySql>,
) -> Result<RawDataset, sqlx::Error> {
  sqlx::query_as!(
      RawDataset,
        r#"
        SELECT
        zd.token as `token: tokens::tokens::zs_voice_datasets::ZsVoiceDatasetToken`,
        zd.title,
        zd.ietf_language_tag,
        zd.ietf_primary_language_subtag,
        zd.maybe_creator_user_token,
        zd.creator_set_visibility as `creator_set_visibility: enums_db::common::visibility::Visibility`,
        zd.created_at,
        zd.updated_at
        FROM zs_voice_datasets as zd
        WHERE
            zd.token = ?
            "#,
        dataset_token.as_str()
  )
      .fetch_one(&mut **mysql_connection).await
}

async fn select_without_deleted(
  dataset_token: &ZsVoiceDatasetToken,
  mysql_connection: &mut PoolConnection<MySql>,
) -> Result<RawDataset, sqlx::Error> {
  sqlx::query_as!(
      RawDataset,
        r#"
        SELECT
        zd.token as `token: tokens::tokens::zs_voice_datasets::ZsVoiceDatasetToken`,
        zd.title,
        zd.ietf_language_tag,
        zd.ietf_primary_language_subtag,
        zd.maybe_creator_user_token,
        zd.creator_set_visibility as `creator_set_visibility: enums_db::common::visibility::Visibility`,
        zd.created_at,
        zd.updated_at
        FROM zs_voice_datasets as zd
        WHERE
            zd.token = ?
            AND zd.user_deleted_at IS NULL
            AND zd.mod_deleted_at IS NULL
            "#,
        dataset_token.as_str()
  )
      .fetch_one(&mut **mysql_connection).await
}
#[derive(Serialize)]
pub struct RawDataset {
    token: ZsVoiceDatasetToken,
    title: String,
    ietf_language_tag: String,
    ietf_primary_language_subtag: String,
    maybe_creator_user_token: Option<String>,
    creator_set_visibility: Visibility,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}