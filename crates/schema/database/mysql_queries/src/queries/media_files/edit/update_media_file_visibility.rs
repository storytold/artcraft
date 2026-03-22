use anyhow::anyhow;
use sqlx::MySqlPool;

use enums_db::common::visibility::Visibility;
use errors::AnyhowResult;
use tokens::tokens::media_files::MediaFileToken;

pub struct UpdateMediaFileArgs<'a> {
    pub media_file_token: &'a MediaFileToken,
    pub creator_set_visibility: &'a Visibility,
    pub maybe_mod_user_token: Option<&'a str>,
    pub mysql_pool: &'a MySqlPool
}

pub async fn update_media_file_visibility(args: UpdateMediaFileArgs<'_>) -> AnyhowResult<()>{
    // TODO: enforce checks for idempotency token
    let transaction = args.mysql_pool.begin().await?;
    let query_result = sqlx::query!(
        r#"
        UPDATE media_files
        SET
            creator_set_visibility = ?,
            maybe_mod_user_token = ?
        WHERE token = ?
        LIMIT 1
        "#,
        args.creator_set_visibility.to_str(),
        args.maybe_mod_user_token,
        args.media_file_token.as_str(),
    ).execute(args.mysql_pool).await;

    // TODO(Kasisnu): This should probably rollback
    transaction.commit().await?;

    match query_result {
        Ok(_) => Ok(()),
        Err(err) => Err(anyhow!("media_file update error: {:?}", err)),
    }
}
