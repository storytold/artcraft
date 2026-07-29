use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use enums::by_table::media_files::media_file_project_type::MediaFileProjectType;
use enums::by_table::media_files::media_file_type::MediaFileType;
use tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::users::UserToken;

#[derive(Debug, Clone)]
pub struct MediaFileForProjectUpdate {
  pub maybe_creator_user_token: Option<UserToken>,
  pub maybe_creator_anonymous_visitor_token: Option<AnonymousVisitorTrackingToken>,
  pub media_type: MediaFileType,
  pub maybe_project_type: Option<MediaFileProjectType>,
}

pub struct LookupMediaFileForProjectUpdateArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub media_file_token: &'e MediaFileToken,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Minimal lookup of a media file for a project-save (overwrite) request:
/// the creator tokens (for ownership checks) and the media/project types
/// (to confirm the record is the right kind of project document).
/// Excludes soft-deleted rows.
pub async fn lookup_media_file_for_project_update<'e, 'c: 'e, E>(
  args: LookupMediaFileForProjectUpdateArgs<'e, 'c, E>,
) -> Result<Option<MediaFileForProjectUpdate>, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let result = sqlx::query!(
    r#"
SELECT
  maybe_creator_user_token as `maybe_creator_user_token: UserToken`,
  maybe_creator_anonymous_visitor_token as `maybe_creator_anonymous_visitor_token: AnonymousVisitorTrackingToken`,
  media_type as `media_type: MediaFileType`,
  maybe_project_type as `maybe_project_type: MediaFileProjectType`
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

  Ok(result.map(|record| MediaFileForProjectUpdate {
    maybe_creator_user_token: record.maybe_creator_user_token,
    maybe_creator_anonymous_visitor_token: record.maybe_creator_anonymous_visitor_token,
    media_type: record.media_type,
    maybe_project_type: record.maybe_project_type,
  }))
}
