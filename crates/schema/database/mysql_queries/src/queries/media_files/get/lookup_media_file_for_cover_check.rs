use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_type::MediaFileType;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::users::UserToken;

#[derive(Debug, Clone)]
pub struct MediaFileForCoverCheck {
  pub maybe_creator_user_token: Option<UserToken>,
  pub media_class: MediaFileClass,
  pub media_type: MediaFileType,
  pub maybe_cover_image_media_file_token: Option<MediaFileToken>,
}

pub struct LookupMediaFileForCoverCheckArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub media_file_token: &'e MediaFileToken,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Minimal lookup of a media file for cover-image authorization +
/// classification. Returns the creator user token (for ownership checks),
/// the media class and type (to decide whether the file can be used as a
/// cover directly), and the file's own self-referential cover-image token
/// (for the "use the cover's cover" fallback). Excludes soft-deleted rows.
pub async fn lookup_media_file_for_cover_check<'e, 'c: 'e, E>(
  args: LookupMediaFileForCoverCheckArgs<'e, 'c, E>,
) -> Result<Option<MediaFileForCoverCheck>, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let result = sqlx::query!(
    r#"
SELECT
  maybe_creator_user_token as `maybe_creator_user_token: UserToken`,
  media_class as `media_class: MediaFileClass`,
  media_type as `media_type: MediaFileType`,
  maybe_cover_image_media_file_token as `maybe_cover_image_media_file_token: MediaFileToken`
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

  Ok(result.map(|r| MediaFileForCoverCheck {
    maybe_creator_user_token: r.maybe_creator_user_token,
    media_class: r.media_class,
    media_type: r.media_type,
    maybe_cover_image_media_file_token: r.maybe_cover_image_media_file_token,
  }))
}
