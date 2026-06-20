use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use enums::by_table::uploaded_video_notes::uploaded_video_note_reported_model_type::UploadedVideoNoteReportedModelType;
use enums::by_table::uploaded_video_notes::uploaded_video_note_reported_website::UploadedVideoNoteReportedWebsite;
use tokens::tokens::uploaded_video_notes::UploadVideoNoteToken;
use tokens::tokens::uploaded_videos::UploadedVideoToken;

pub struct InsertUploadedVideoNoteArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub uploaded_video_token: &'e UploadedVideoToken,

  pub maybe_filename: Option<&'e str>,
  pub maybe_reported_model_type: Option<UploadedVideoNoteReportedModelType>,
  pub maybe_reported_model_name: Option<&'e str>,
  pub maybe_website: Option<UploadedVideoNoteReportedWebsite>,
  pub maybe_other_website: Option<&'e str>,
  pub maybe_comments: Option<&'e str>,

  pub maybe_email_address: Option<&'e str>,
  pub can_share_report: bool,
  pub was_scammed: bool,

  pub comment_create_ip_address: &'e str,

  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Insert a new `uploaded_video_notes` record. The `UploadVideoNoteToken` is
/// minted here (in the data-access layer, not the handler) and returned.
/// `created_at` is set to `NOW()`.
pub async fn insert_uploaded_video_note<'e, 'c: 'e, E>(
  args: InsertUploadedVideoNoteArgs<'e, 'c, E>,
) -> Result<UploadVideoNoteToken, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let token = UploadVideoNoteToken::generate();

  sqlx::query!(
    r#"
INSERT INTO uploaded_video_notes
SET
  token = ?,
  uploaded_video_token = ?,
  maybe_filename = ?,
  maybe_reported_model_type = ?,
  maybe_reported_model_name = ?,
  maybe_website = ?,
  maybe_other_website = ?,
  maybe_comments = ?,
  maybe_email_address = ?,
  can_share_report = ?,
  was_scammed = ?,
  comment_create_ip_address = ?,
  created_at = NOW()
    "#,
    token.as_str(),
    args.uploaded_video_token.as_str(),
    args.maybe_filename,
    args.maybe_reported_model_type.map(|model_type| model_type.to_str()),
    args.maybe_reported_model_name,
    args.maybe_website.map(|website| website.to_str()),
    args.maybe_other_website,
    args.maybe_comments,
    args.maybe_email_address,
    args.can_share_report,
    args.was_scammed,
    args.comment_create_ip_address,
  )
    .execute(args.mysql_executor)
    .await?;

  Ok(token)
}
