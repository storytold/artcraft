use anyhow::anyhow;
use chrono::{DateTime, Utc};
use log::error;
use sqlx::{MySql, MySqlPool};
use sqlx::pool::PoolConnection;

use enums_db::common::visibility::Visibility;
use errors::AnyhowResult;
use tokens::tokens::users::UserToken;
use tokens::tokens::zs_voices::ZsVoiceToken;

pub struct ZsVoice {
    pub token: ZsVoiceToken,
    pub title: String,
    pub ietf_language_tag: String,
    pub ietf_primary_language_subtag: String,
    pub bucket_hash: String,
    pub model_version: u64,
    pub maybe_creator_user_token: Option<UserToken>,
    pub creator_set_visibility: Visibility,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

pub async fn get_voice_by_token(
    voice_token: &ZsVoiceToken,
    can_see_deleted: bool,
    mysql_pool: &MySqlPool,
) -> AnyhowResult<Option<ZsVoice>> {
    let mut connection = mysql_pool.acquire().await?;
    get_voice_by_token_with_connection(
        voice_token,
        can_see_deleted,
        &mut connection
    ).await
}

pub async fn get_voice_by_token_with_connection(
    voice_token: &ZsVoiceToken,
    can_see_deleted: bool,
    mysql_connection: &mut PoolConnection<MySql>,
) -> AnyhowResult<Option<ZsVoice>> {

    let maybe_result = if can_see_deleted {
        select_include_deleted(
            voice_token,
            mysql_connection
        ).await
    } else {
        select_without_deleted(
            voice_token,
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
                "Error fetching voice by token: {:?}",
                err
            );
            return Err(anyhow!(
                "Error fetching voice by token: {:?}",
                err
            ));
        }
    };

    Ok(Some(ZsVoice {
        token: record.token,
        title: record.title,
        ietf_language_tag: record.ietf_language_tag,
        ietf_primary_language_subtag: record.ietf_primary_language_subtag,
        bucket_hash: record.bucket_hash,
        model_version: record.model_version as u64, // FIXME: Lazily widening.
        maybe_creator_user_token: record.maybe_creator_user_token,
        creator_set_visibility: record.creator_set_visibility,
        created_at: record.created_at,
        updated_at: record.updated_at,
    }))
}

async fn select_include_deleted(
    voice_token: &ZsVoiceToken,
    mysql_connection: &mut PoolConnection<MySql>,
) -> Result<RawVoice, sqlx::Error> {
    sqlx::query_as!(
      RawVoice,
        r#"
        SELECT
        zv.token as `token: tokens::tokens::zs_voices::ZsVoiceToken`,
        zv.title,
        zv.ietf_language_tag,
        zv.ietf_primary_language_subtag,
        zv.maybe_creator_user_token as `maybe_creator_user_token: tokens::tokens::users::UserToken`,
        zv.bucket_hash,
        zv.model_version,
        zv.creator_set_visibility as `creator_set_visibility: enums_db::common::visibility::Visibility`,
        zv.created_at,
        zv.updated_at
        FROM zs_voices as zv
        WHERE
            zv.token = ?
            "#,
        voice_token.as_str()
  )
        .fetch_one(&mut **mysql_connection).await
}

async fn select_without_deleted(
    voice_token: &ZsVoiceToken,
    mysql_connection: &mut PoolConnection<MySql>,
) -> Result<RawVoice, sqlx::Error> {
    sqlx::query_as!(
      RawVoice,
        r#"
        SELECT
        zv.token as `token: tokens::tokens::zs_voices::ZsVoiceToken`,
        zv.title,
        zv.ietf_language_tag,
        zv.ietf_primary_language_subtag,
        zv.maybe_creator_user_token as `maybe_creator_user_token: tokens::tokens::users::UserToken`,
        zv.bucket_hash,
        zv.model_version,
        zv.creator_set_visibility as `creator_set_visibility: enums_db::common::visibility::Visibility`,
        zv.created_at,
        zv.updated_at
        FROM zs_voices as zv
        WHERE
            zv.token = ?
            AND zv.user_deleted_at IS NULL
            AND zv.mod_deleted_at IS NULL
            "#,
        voice_token.as_str()
  )
        .fetch_one(&mut **mysql_connection).await
}
#[derive(Serialize)]
pub struct RawVoice {
    token: ZsVoiceToken,
    title: String,
    ietf_language_tag: String,
    ietf_primary_language_subtag: String,
    maybe_creator_user_token: Option<UserToken>,
    bucket_hash: String,
    model_version: u32,
    creator_set_visibility: Visibility,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}
