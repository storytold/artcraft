// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use chrono::{DateTime, Utc};
use enums_db::by_table::media_files::media_file_class::MediaFileClass;
use enums_db::by_table::media_files::media_file_type::MediaFileType;
use enums::common::visibility::Visibility;
use errors::AnyhowResult;
use log::warn;
use sqlx::pool::PoolConnection;
use sqlx::{MySql, MySqlPool};
use tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken;
use tokens::tokens::batch_generations::BatchGenerationToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::prompts::PromptToken;
use tokens::tokens::users::UserToken;

use crate::helpers::boolean_converters::i8_to_bool;
use crate::payloads::prompt_args::prompt_inner_payload::PromptInnerPayload;
use crate::utils::transactor::Transactor;

pub struct MediaFileBatch {
  pub media_files: Vec<MediaFile>,
}

#[derive(Serialize, Debug)]
pub struct MediaFile {
  pub token: MediaFileToken,

  pub media_class: MediaFileClass,
  pub media_type: MediaFileType,

  pub maybe_mime_type: Option<String>,

  pub maybe_batch_token: Option<BatchGenerationToken>,

  pub maybe_title: Option<String>,
  pub maybe_text_transcript: Option<String>,

  pub maybe_origin_filename: Option<String>,

  pub maybe_duration_millis: Option<u64>,

  pub maybe_creator_user_token: Option<UserToken>,
  pub maybe_creator_username: Option<String>,
  pub maybe_creator_display_name: Option<String>,
  pub maybe_creator_gravatar_hash: Option<String>,

  /// This should not be exposed for GET endpoints, but is useful for permission checking.
  pub maybe_creator_anonymous_visitor_token: Option<AnonymousVisitorTrackingToken>,

  pub creator_set_visibility: Visibility,

  pub is_user_upload: bool,
  pub is_intermediate_system_file: bool,

  pub maybe_prompt_token: Option<PromptToken>,
  pub maybe_prompt_args: Option<PromptInnerPayload>,

  pub maybe_file_cover_image_public_bucket_hash: Option<String>,
  pub maybe_file_cover_image_public_bucket_prefix: Option<String>,
  pub maybe_file_cover_image_public_bucket_extension: Option<String>,

  pub public_bucket_directory_hash: String,
  pub maybe_public_bucket_prefix: Option<String>,
  pub maybe_public_bucket_extension: Option<String>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,

  // pub maybe_moderator_fields: Option<MediaFileModeratorFields>,
}

#[derive(Serialize)]
pub struct MediaFileRaw {
  pub token: MediaFileToken,

  pub media_class: MediaFileClass,
  pub media_type: MediaFileType,

  pub maybe_mime_type: Option<String>,

  pub maybe_batch_token: Option<BatchGenerationToken>,

  pub maybe_title: Option<String>,
  pub maybe_text_transcript: Option<String>,

  pub maybe_origin_filename: Option<String>,

  pub maybe_duration_millis: Option<i32>,

  pub maybe_creator_user_token: Option<UserToken>,
  pub maybe_creator_username: Option<String>,
  pub maybe_creator_display_name: Option<String>,
  pub maybe_creator_gravatar_hash: Option<String>,

  /// This should not be exposed for GET endpoints, but is useful for permission checking.
  pub maybe_creator_anonymous_visitor_token: Option<AnonymousVisitorTrackingToken>,

  pub creator_set_visibility: Visibility,

  pub is_user_upload: i8,
  pub is_intermediate_system_file: i8,

  pub maybe_prompt_token: Option<PromptToken>,
  pub maybe_other_prompt_args: Option<String>,

  pub maybe_file_cover_image_public_bucket_hash: Option<String>,
  pub maybe_file_cover_image_public_bucket_prefix: Option<String>,
  pub maybe_file_cover_image_public_bucket_extension: Option<String>,

  pub public_bucket_directory_hash: String,
  pub maybe_public_bucket_prefix: Option<String>,
  pub maybe_public_bucket_extension: Option<String>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

pub async fn list_batch_generated_redux_media_files(
  batch_token: &BatchGenerationToken,
  can_see_deleted: bool,
  mysql_pool: &MySqlPool
) -> AnyhowResult<MediaFileBatch> {
  list_batch_generated_redux_media_files_with_transactor(
    batch_token,
    can_see_deleted,
    Transactor::for_pool(mysql_pool)
  ).await
}

pub async fn list_batch_generated_redux_media_files_with_connection(
  batch_token: &BatchGenerationToken,
  can_see_deleted: bool,
  mysql_connection: &mut PoolConnection<MySql>,
) -> AnyhowResult<MediaFileBatch> {
  list_batch_generated_redux_media_files_with_transactor(
    batch_token,
    can_see_deleted,
    Transactor::for_connection(mysql_connection)
  ).await
}

pub async fn list_batch_generated_redux_media_files_with_transactor(
  batch_token: &BatchGenerationToken,
  can_see_deleted: bool,
  transactor: Transactor<'_, '_>,
) -> AnyhowResult<MediaFileBatch> {

  let records = if can_see_deleted {
    select_including_deleted(batch_token, transactor).await?
  } else {
    select_without_deleted(batch_token, transactor).await?
  };

  let records = records
      .into_iter()
      .map(|record| {
        MediaFile {
          token: record.token,
          media_type: record.media_type,
          media_class: record.media_class,
          maybe_mime_type: record.maybe_mime_type,
          maybe_batch_token: record.maybe_batch_token,
          maybe_title: record.maybe_title,
          maybe_text_transcript: record.maybe_text_transcript,
          maybe_origin_filename: record.maybe_origin_filename,
          maybe_duration_millis: record.maybe_duration_millis.map(|d| d as u64),
          maybe_creator_user_token: record.maybe_creator_user_token,
          maybe_creator_username: record.maybe_creator_username,
          maybe_creator_display_name: record.maybe_creator_display_name,
          maybe_creator_gravatar_hash: record.maybe_creator_gravatar_hash,
          maybe_creator_anonymous_visitor_token: record.maybe_creator_anonymous_visitor_token,
          creator_set_visibility: record.creator_set_visibility,
          is_user_upload: i8_to_bool(record.is_user_upload),
          is_intermediate_system_file: i8_to_bool(record.is_intermediate_system_file),
          maybe_prompt_token: record.maybe_prompt_token,
          maybe_prompt_args: record.maybe_other_prompt_args
              .as_deref()
              .map(|args| PromptInnerPayload::from_json(args))
              .transpose()
              .ok() // NB: Fail open
              .flatten(),
          maybe_file_cover_image_public_bucket_hash: record.maybe_file_cover_image_public_bucket_hash,
          maybe_file_cover_image_public_bucket_prefix: record.maybe_file_cover_image_public_bucket_prefix,
          maybe_file_cover_image_public_bucket_extension: record.maybe_file_cover_image_public_bucket_extension,
          public_bucket_directory_hash: record.public_bucket_directory_hash,
          maybe_public_bucket_prefix: record.maybe_public_bucket_prefix,
          maybe_public_bucket_extension: record.maybe_public_bucket_extension,
          created_at: record.created_at,
          updated_at: record.updated_at,
        }
      })
      .collect();

  Ok(MediaFileBatch {
    media_files: records,
  })
}

async fn select_including_deleted(
  batch_token: &BatchGenerationToken,
  transactor: Transactor<'_, '_>,
) -> Result<Vec<MediaFileRaw>, sqlx::Error> {
  let query = sqlx::query_as!(
      MediaFileRaw,
        r#"
SELECT
    m.token as `token: tokens::tokens::media_files::MediaFileToken`,

    m.media_class as `media_class: enums_db::by_table::media_files::media_file_class::MediaFileClass`,
    m.media_type as `media_type: enums_db::by_table::media_files::media_file_type::MediaFileType`,

    m.maybe_mime_type,

    users.token as `maybe_creator_user_token: tokens::tokens::users::UserToken`,
    users.username as maybe_creator_username,
    users.display_name as maybe_creator_display_name,
    users.email_gravatar_hash as maybe_creator_gravatar_hash,

    m.maybe_creator_anonymous_visitor_token as `maybe_creator_anonymous_visitor_token: tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken`,

    m.maybe_batch_token as `maybe_batch_token: tokens::tokens::batch_generations::BatchGenerationToken`,

    m.maybe_title,
    m.maybe_text_transcript,

    m.maybe_origin_filename,

    m.maybe_duration_millis,

    m.maybe_prompt_token as `maybe_prompt_token: tokens::tokens::prompts::PromptToken`,
    prompts.maybe_other_args as maybe_other_prompt_args,

    media_file_cover_image.public_bucket_directory_hash as maybe_file_cover_image_public_bucket_hash,
    media_file_cover_image.maybe_public_bucket_prefix as maybe_file_cover_image_public_bucket_prefix,
    media_file_cover_image.maybe_public_bucket_extension as maybe_file_cover_image_public_bucket_extension,

    m.creator_set_visibility as `creator_set_visibility: enums::common::visibility::Visibility`,

    m.is_user_upload,
    m.is_intermediate_system_file,

    m.public_bucket_directory_hash,
    m.maybe_public_bucket_prefix,
    m.maybe_public_bucket_extension,

    m.created_at,
    m.updated_at

FROM media_files AS m
LEFT OUTER JOIN users
    ON m.maybe_creator_user_token = users.token
LEFT OUTER JOIN media_files as media_file_cover_image
    ON media_file_cover_image.token = m.maybe_cover_image_media_file_token
LEFT OUTER JOIN prompts
    ON prompts.token = m.maybe_prompt_token
WHERE
    m.maybe_batch_token = ?
        "#,
      batch_token
    );

  let maybe_results = match transactor {
    Transactor::Pool { pool } => {
      query.fetch_all(pool).await
    },
    Transactor::Connection { connection } => {
      query.fetch_all(connection).await
    },
    Transactor::Transaction { transaction } => {
      query.fetch_all(&mut **transaction).await
    },
  };

  match maybe_results {
    Err(err) => {
      match err {
        sqlx::Error::RowNotFound => {
          Ok(Vec::new())
        },
        _ => {
          warn!("list ip bans db error: {:?}", err);
          Err(err)
        }
      }
    },
    Ok(results) => Ok(results),
  }
}

async fn select_without_deleted(
  batch_token: &BatchGenerationToken,
  transactor: Transactor<'_, '_>,
) -> Result<Vec<MediaFileRaw>, sqlx::Error> {
  let query = sqlx::query_as!(
      MediaFileRaw,
        r#"
SELECT
    m.token as `token: tokens::tokens::media_files::MediaFileToken`,

    m.media_class as `media_class: enums_db::by_table::media_files::media_file_class::MediaFileClass`,
    m.media_type as `media_type: enums_db::by_table::media_files::media_file_type::MediaFileType`,

    m.maybe_mime_type,

    users.token as `maybe_creator_user_token: tokens::tokens::users::UserToken`,
    users.username as maybe_creator_username,
    users.display_name as maybe_creator_display_name,
    users.email_gravatar_hash as maybe_creator_gravatar_hash,

    m.maybe_creator_anonymous_visitor_token as `maybe_creator_anonymous_visitor_token: tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken`,

    m.maybe_batch_token as `maybe_batch_token: tokens::tokens::batch_generations::BatchGenerationToken`,

    m.maybe_title,
    m.maybe_text_transcript,

    m.maybe_origin_filename,

    m.maybe_duration_millis,

    m.maybe_prompt_token as `maybe_prompt_token: tokens::tokens::prompts::PromptToken`,
    prompts.maybe_other_args as maybe_other_prompt_args,

    media_file_cover_image.public_bucket_directory_hash as maybe_file_cover_image_public_bucket_hash,
    media_file_cover_image.maybe_public_bucket_prefix as maybe_file_cover_image_public_bucket_prefix,
    media_file_cover_image.maybe_public_bucket_extension as maybe_file_cover_image_public_bucket_extension,

    m.creator_set_visibility as `creator_set_visibility: enums::common::visibility::Visibility`,

    m.is_user_upload,
    m.is_intermediate_system_file,

    m.public_bucket_directory_hash,
    m.maybe_public_bucket_prefix,
    m.maybe_public_bucket_extension,

    m.created_at,
    m.updated_at

FROM media_files AS m
LEFT OUTER JOIN users
    ON m.maybe_creator_user_token = users.token
LEFT OUTER JOIN media_files as media_file_cover_image
    ON media_file_cover_image.token = m.maybe_cover_image_media_file_token
LEFT OUTER JOIN prompts
    ON prompts.token = m.maybe_prompt_token
WHERE
    m.maybe_batch_token = ?
    AND m.user_deleted_at IS NULL
    AND m.mod_deleted_at IS NULL
        "#,
      batch_token
    );

  let maybe_results = match transactor {
    Transactor::Pool { pool } => {
      query.fetch_all(pool).await
    },
    Transactor::Connection { connection } => {
      query.fetch_all(connection).await
    },
    Transactor::Transaction { transaction } => {
      query.fetch_all(&mut **transaction).await
    },
  };

  match maybe_results {
    Err(err) => {
      match err {
        sqlx::Error::RowNotFound => {
          Ok(Vec::new())
        },
        _ => {
          warn!("list ip bans db error: {:?}", err);
          Err(err)
        }
      }
    },
    Ok(results) => Ok(results),
  }
}
