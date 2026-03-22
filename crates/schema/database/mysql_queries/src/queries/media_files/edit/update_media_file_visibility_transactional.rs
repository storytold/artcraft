use std::marker::PhantomData;
use anyhow::anyhow;
use sqlx::{Executor, MySql, MySqlPool, Transaction};

use enums_db::common::visibility::Visibility;
use errors::AnyhowResult;
use tokens::tokens::media_files::MediaFileToken;

pub struct UpdateMediaFileTransactionalArgs<'a, 'b>
{
    pub media_file_token: &'a MediaFileToken,
    pub creator_set_visibility: Visibility,

    pub transaction: &'a mut Transaction<'b, MySql>,
}

pub async fn update_media_file_visibility_transactional(args: UpdateMediaFileTransactionalArgs<'_, '_>) -> AnyhowResult<()>{
    let query_result = sqlx::query!(
        r#"
        UPDATE media_files
        SET
            creator_set_visibility = ?
        WHERE token = ?
        LIMIT 1
        "#,
        args.creator_set_visibility.to_str(),
        args.media_file_token.as_str(),
    ).execute(&mut **args.transaction).await;

    match query_result {
        Ok(_) => Ok(()),
        Err(err) => Err(anyhow!("media_file update error: {:?}", err)),
    }
}
