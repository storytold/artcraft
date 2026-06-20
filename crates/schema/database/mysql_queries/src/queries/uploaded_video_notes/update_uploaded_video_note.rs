use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use enums::by_table::uploaded_video_notes::uploaded_video_note_reported_model_type::UploadedVideoNoteReportedModelType;
use enums::by_table::uploaded_video_notes::uploaded_video_note_reported_website::UploadedVideoNoteReportedWebsite;
use tokens::tokens::uploaded_video_notes::UploadVideoNoteToken;

pub struct UpdateUploadedVideoNoteArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub token: &'e UploadVideoNoteToken,

  pub maybe_filename: Option<&'e str>,
  pub maybe_reported_model_type: Option<UploadedVideoNoteReportedModelType>,
  pub maybe_reported_model_name: Option<&'e str>,
  pub maybe_website: Option<UploadedVideoNoteReportedWebsite>,
  pub maybe_other_website: Option<&'e str>,
  pub maybe_comments: Option<&'e str>,

  pub maybe_email_address: Option<&'e str>,
  pub can_share_report: bool,
  pub was_scammed: bool,

  /// IP address of the request making the update; stamped on `maybe_comment_update_ip_address`.
  pub maybe_comment_update_ip_address: Option<&'e str>,

  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Update the mutable fields of an `uploaded_video_notes` record by `token`. The
/// `version` vector clock is incremented by 1, and `updated_at` is refreshed via
/// the column's `ON UPDATE` clause. Returns the number of rows affected (0 if no
/// row matched).
pub async fn update_uploaded_video_note<'e, 'c: 'e, E>(
  args: UpdateUploadedVideoNoteArgs<'e, 'c, E>,
) -> Result<u64, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let result = sqlx::query!(
    r#"
UPDATE uploaded_video_notes
SET
  maybe_filename = ?,
  maybe_reported_model_type = ?,
  maybe_reported_model_name = ?,
  maybe_website = ?,
  maybe_other_website = ?,
  maybe_comments = ?,
  maybe_email_address = ?,
  can_share_report = ?,
  was_scammed = ?,
  maybe_comment_update_ip_address = ?,
  version = version + 1
WHERE token = ?
LIMIT 1
    "#,
    args.maybe_filename,
    args.maybe_reported_model_type.map(|model_type| model_type.to_str()),
    args.maybe_reported_model_name,
    args.maybe_website.map(|website| website.to_str()),
    args.maybe_other_website,
    args.maybe_comments,
    args.maybe_email_address,
    args.can_share_report,
    args.was_scammed,
    args.maybe_comment_update_ip_address,
    args.token.as_str(),
  )
    .execute(args.mysql_executor)
    .await?;

  Ok(result.rows_affected())
}
