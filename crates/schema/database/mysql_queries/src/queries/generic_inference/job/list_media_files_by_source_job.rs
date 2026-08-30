use std::marker::PhantomData;

use chrono::{DateTime, Utc};
use sqlx::{Executor, MySql};

use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_type::MediaFileType;
use tokens::tokens::batch_generations::BatchGenerationToken;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::prompts::PromptToken;
use tokens::tokens::users::UserToken;

/// A job has a bounded number of outputs (the largest batches are single
/// digits), so the list is capped rather than paginated.
const MAX_RESULTS: u32 = 100;

pub struct JobMediaFileRecord {
  pub token: MediaFileToken,

  pub media_class: MediaFileClass,
  pub media_type: MediaFileType,

  pub maybe_batch_token: Option<BatchGenerationToken>,
  pub maybe_prompt_token: Option<PromptToken>,

  pub public_bucket_directory_hash: String,
  pub maybe_public_bucket_prefix: Option<String>,
  pub maybe_public_bucket_extension: Option<String>,

  pub maybe_file_cover_image_public_bucket_hash: Option<String>,
  pub maybe_file_cover_image_public_bucket_prefix: Option<String>,
  pub maybe_file_cover_image_public_bucket_extension: Option<String>,

  pub maybe_origin_filename: Option<String>,
  pub maybe_duration_millis: Option<u64>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

pub struct ListMediaFilesBySourceJobArgs<'a, 'c, E>
where
  E: 'a + Executor<'c, Database = MySql>,
{
  /// The inference job whose outputs to list.
  pub job_token: &'a InferenceJobToken,

  /// Only return files created by this user (the session user). Enforces that
  /// callers can only list the outputs of their own jobs.
  pub creator_user_token: &'a UserToken,

  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// List the media files produced by an inference job (`maybe_source_job_token`),
/// oldest first. Deliberately lean: no user/model/stats joins — just the file
/// fields plus a self-join for the cover image.
pub async fn list_media_files_by_source_job<'a, 'c: 'a, E>(
  args: ListMediaFilesBySourceJobArgs<'a, 'c, E>,
) -> Result<Vec<JobMediaFileRecord>, sqlx::Error>
where
  E: 'a + Executor<'c, Database = MySql>,
{
  sqlx::query_as!(
      JobMediaFileRecord,
      r#"
SELECT
    m.token as `token: tokens::tokens::media_files::MediaFileToken`,

    m.media_class as `media_class: enums::by_table::media_files::media_file_class::MediaFileClass`,
    m.media_type as `media_type: enums::by_table::media_files::media_file_type::MediaFileType`,

    m.maybe_batch_token as `maybe_batch_token: tokens::tokens::batch_generations::BatchGenerationToken`,
    m.maybe_prompt_token as `maybe_prompt_token: tokens::tokens::prompts::PromptToken`,

    m.public_bucket_directory_hash,
    m.maybe_public_bucket_prefix,
    m.maybe_public_bucket_extension,

    media_file_cover_image.public_bucket_directory_hash as maybe_file_cover_image_public_bucket_hash,
    media_file_cover_image.maybe_public_bucket_prefix as maybe_file_cover_image_public_bucket_prefix,
    media_file_cover_image.maybe_public_bucket_extension as maybe_file_cover_image_public_bucket_extension,

    m.maybe_origin_filename,
    m.maybe_duration_millis as `maybe_duration_millis: u64`,

    m.created_at,
    m.updated_at

FROM media_files AS m
LEFT OUTER JOIN media_files as media_file_cover_image
    ON media_file_cover_image.token = m.maybe_cover_image_media_file_token
WHERE
    m.maybe_source_job_token = ?
    AND m.maybe_creator_user_token = ?
    AND m.user_deleted_at IS NULL
    AND m.mod_deleted_at IS NULL
    AND NOT m.is_intermediate_system_file
ORDER BY m.id ASC
LIMIT ?
      "#,
      args.job_token,
      args.creator_user_token,
      MAX_RESULTS,
    )
      .fetch_all(args.mysql_executor)
      .await
}
