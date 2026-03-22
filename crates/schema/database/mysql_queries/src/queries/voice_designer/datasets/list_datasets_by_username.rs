use anyhow::anyhow;
use chrono::{DateTime, Utc};
use log::{info, warn};
use sqlx::{Error, MySql, MySqlPool};
use sqlx::pool::PoolConnection;

use enums_db::common::visibility::Visibility;
use errors::AnyhowResult;
use tokens::tokens::users::UserToken;
use tokens::tokens::zs_voice_datasets::ZsVoiceDatasetToken;

// FIXME: This is the old style of query scoping and shouldn't be copied.

#[derive(Serialize)]
pub struct DatasetRecord {
    pub dataset_token: ZsVoiceDatasetToken,
    pub title: String,

    pub creator_user_token: UserToken,
    pub creator_username: String,
    pub creator_display_name: String,
    pub creator_email_gravatar_hash: String,
    pub creator_set_visibility: Visibility,

    pub ietf_language_tag: String,
    pub ietf_primary_language_subtag: String,

    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

pub async fn list_datasets_by_username(
    mysql_pool: &MySqlPool,
    username: &str,
    can_see_deleted: bool,
) -> AnyhowResult<Vec<DatasetRecord>> {
    let mut connection = mysql_pool.acquire().await?;
    list_datasets_by_username_with_connection(&mut connection, username, can_see_deleted).await
}

pub async fn list_datasets_by_username_with_connection(
    mysql_connection: &mut PoolConnection<MySql>,
    creator_username: &str,
    can_see_deleted: bool,
) -> AnyhowResult<Vec<DatasetRecord>> {

    let datasets =
            list_datasets_by_creator_username(mysql_connection, creator_username, can_see_deleted)
                .await;

    let datasets : Vec<InternalRawDatasetRecordForList> = match datasets {
        Ok(datasets) => datasets,
        Err(err) => {
            return match err {
                Error::RowNotFound => {
                    Ok(Vec::new())
                },
                _ => {
                    warn!("dataset list query error: {:?}", err);
                    Err(anyhow!("dataset list query error"))
                }
            }
        }
    };

    Ok(datasets.into_iter()
        .map(|dataset| {
            DatasetRecord {
                dataset_token: dataset.token,
                title: dataset.title,
                ietf_language_tag: dataset.ietf_language_tag,
                ietf_primary_language_subtag: dataset.ietf_primary_language_subtag,
                creator_user_token: dataset.creator_user_token,
                creator_username: dataset.creator_username,
                creator_display_name: dataset.creator_display_name,
                creator_email_gravatar_hash: dataset.creator_email_gravatar_hash,
                creator_set_visibility: dataset.creator_set_visibility,
                created_at: dataset.created_at,
                updated_at: dataset.updated_at,
            }
        })
        .filter(|dataset| {
            dataset.creator_username == creator_username || dataset.creator_set_visibility == Visibility::Public || can_see_deleted
        })
        .collect::<Vec<DatasetRecord>>())
}


async fn list_datasets_by_creator_username(
    mysql_connection: &mut PoolConnection<MySql>,
    creator_username: &str,
    can_see_deleted: bool,
) -> Result<Vec<InternalRawDatasetRecordForList>, Error> {
    // TODO: There has to be a better way.
    //  Sqlx doesn't like anything except string literals.
    let maybe_datasets = if !can_see_deleted {
        info!("listing datasets for user;");
        sqlx::query_as!(
      InternalRawDatasetRecordForList,
        r#"
        SELECT
            zd.token as `token: tokens::tokens::zs_voice_datasets::ZsVoiceDatasetToken`,
            zd.title,
            zd.ietf_language_tag,
            zd.ietf_primary_language_subtag,
            users.token as `creator_user_token: tokens::tokens::users::UserToken`,
            users.username as creator_username,
            users.display_name as creator_display_name,
            users.email_gravatar_hash as creator_email_gravatar_hash,
            zd.creator_set_visibility as `creator_set_visibility: enums_db::common::visibility::Visibility`,
            zd.created_at,
            zd.updated_at
        FROM zs_voice_datasets as zd
        JOIN users
            ON users.token = zd.maybe_creator_user_token
        WHERE
            users.username = ?
            AND zd.user_deleted_at IS NULL
            AND zd.mod_deleted_at IS NULL
        "#,
      creator_username)
            .fetch_all(&mut **mysql_connection)
            .await?
    } else {
        info!("listing datasets for user");
        sqlx::query_as!(
      InternalRawDatasetRecordForList
            ,
        r#"
        SELECT
            zd.token as `token: tokens::tokens::zs_voice_datasets::ZsVoiceDatasetToken`,
            zd.title,
            zd.ietf_language_tag,
            zd.ietf_primary_language_subtag,
            users.token as `creator_user_token: tokens::tokens::users::UserToken`,
            users.username as creator_username,
            users.display_name as creator_display_name,
            users.email_gravatar_hash as creator_email_gravatar_hash,
            zd.creator_set_visibility as `creator_set_visibility: enums_db::common::visibility::Visibility`,
            zd.created_at,
            zd.updated_at
        FROM zs_voice_datasets as zd
        JOIN users
            ON users.token = zd.maybe_creator_user_token
        WHERE
            users.username = ?
        "#,
      creator_username)
            .fetch_all(&mut **mysql_connection)
            .await?
    };

    Ok(maybe_datasets)
}

struct InternalRawDatasetRecordForList {
    token: ZsVoiceDatasetToken,
    title: String,
    ietf_language_tag: String,
    ietf_primary_language_subtag: String,
    creator_user_token: UserToken,
    creator_username: String,
    creator_display_name: String,
    creator_email_gravatar_hash: String,
    creator_set_visibility: Visibility,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}
