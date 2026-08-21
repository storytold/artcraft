use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use enums::common::visibility::Visibility;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::users::UserToken;

/// Just enough of a media file to decide whether a requester may see
/// its tags.
#[derive(Debug, Clone)]
pub struct MediaFileAccessFields {
  pub maybe_creator_user_token: Option<UserToken>,
  pub creator_set_visibility: Visibility,
}

pub struct GetMediaFileAccessFieldsArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub media_file_token: &'e MediaFileToken,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Fetch the owner + visibility of a (live) media file. Returns
/// `Ok(None)` if the file doesn't exist or is soft-deleted.
pub async fn get_media_file_access_fields<'e, 'c: 'e, E>(
  args: GetMediaFileAccessFieldsArgs<'e, 'c, E>,
) -> Result<Option<MediaFileAccessFields>, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let result = sqlx::query!(
    r#"
SELECT
  maybe_creator_user_token as `maybe_creator_user_token: UserToken`,
  creator_set_visibility as `creator_set_visibility: Visibility`
FROM media_files
WHERE token = ?
  AND user_deleted_at IS NULL
  AND mod_deleted_at IS NULL
LIMIT 1
    "#,
    args.media_file_token.as_str(),
  )
    .fetch_optional(args.mysql_executor)
    .await?;

  Ok(result.map(|r| MediaFileAccessFields {
    maybe_creator_user_token: r.maybe_creator_user_token,
    creator_set_visibility: r.creator_set_visibility,
  }))
}
