use chrono::{DateTime, Utc};
use sqlx::mysql::MySqlRow;
use sqlx::{Acquire, FromRow, MySql, MySqlPool, QueryBuilder, Row};
use sqlx::pool::PoolConnection;
use enums::by_table::media_files::media_file_animation_type::MediaFileAnimationType;
use enums::traits::mysql_from_row::MySqlFromRow as _;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_engine_category::MediaFileEngineCategory;
use enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory;
use enums::by_table::media_files::media_file_origin_model_type::MediaFileOriginModelType;
use enums::by_table::media_files::media_file_origin_product_category::MediaFileOriginProductCategory;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::common::visibility::Visibility;
use errors::AnyhowResult;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::users::UserToken;

use crate::helpers::boolean_converters::i8_to_bool;
use crate::payloads::prompt_args::prompt_inner_payload::PromptInnerPayload;
use crate::utils::transactor::Transactor;

#[derive(Serialize, Clone)]
pub struct MediaFilesByTokensRecord {
  pub token: MediaFileToken,

  pub media_class: MediaFileClass,
  pub media_type: MediaFileType,

  pub maybe_engine_category: Option<MediaFileEngineCategory>,
  pub maybe_animation_type: Option<MediaFileAnimationType>,

  pub origin_category: MediaFileOriginCategory,
  pub origin_product_category: MediaFileOriginProductCategory,

  pub maybe_origin_model_type: Option<MediaFileOriginModelType>,
  pub maybe_origin_model_token: Option<String>,

  // NB: The title won't be populated for `tts_models` records or non-`model_weights` records.
  pub maybe_origin_model_title: Option<String>,

  pub public_bucket_directory_hash: String,
  pub maybe_public_bucket_prefix: Option<String>,
  pub maybe_public_bucket_extension: Option<String>,

  pub maybe_creator_user_token: Option<UserToken>,
  pub maybe_creator_username: Option<String>,
  pub maybe_creator_display_name: Option<String>,
  pub maybe_creator_email_gravatar_hash: Option<String>,

  pub maybe_ratings_positive_count: Option<u32>,
  pub maybe_ratings_negative_count: Option<u32>,
  pub maybe_bookmark_count: Option<u32>,

  pub is_user_upload: bool,
  pub is_intermediate_system_file: bool,

  pub maybe_title: Option<String>,

  /// Text transcripts for TTS, etc.
  pub maybe_text_transcript: Option<String>,
  pub maybe_prompt_args: Option<PromptInnerPayload>,

  pub maybe_duration_millis: Option<u64>,

  pub maybe_file_cover_image_public_bucket_hash: Option<String>,
  pub maybe_file_cover_image_public_bucket_prefix: Option<String>,
  pub maybe_file_cover_image_public_bucket_extension: Option<String>,
  
  pub creator_set_visibility: Visibility,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

pub async fn batch_get_media_files_by_tokens(
  mysql_pool: &MySqlPool,
  media_file_tokens: &[MediaFileToken],
  can_see_deleted: bool
) -> AnyhowResult<Vec<MediaFilesByTokensRecord>> {
  batch_get_media_files_by_tokens_with_transactor(
    Transactor::Pool { pool: mysql_pool },
    media_file_tokens,
    can_see_deleted
  ).await
}

pub async fn batch_get_media_files_by_tokens_with_connection(
  mysql_connection: &mut PoolConnection<MySql>,
  media_file_tokens: &[MediaFileToken],
  can_see_deleted: bool
) -> AnyhowResult<Vec<MediaFilesByTokensRecord>> {
  batch_get_media_files_by_tokens_with_transactor(
    Transactor::Connection{ connection: mysql_connection },
    media_file_tokens,
    can_see_deleted
  ).await
}

pub async fn batch_get_media_files_by_tokens_with_transactor(
  transactor: Transactor<'_, '_>,
  media_file_tokens: &[MediaFileToken],
  can_see_deleted: bool
) -> AnyhowResult<Vec<MediaFilesByTokensRecord>> {
  if media_file_tokens.is_empty() {
    // NB: We should always eagerly return, but if we don't, the query builder will build an
    // invalid query.
    return Ok(vec![]);
  }

  let raw_media_files: Vec<RawMediaFileJoinUser> = get_raw_media_files_by_tokens(transactor, media_file_tokens, can_see_deleted).await?;

  Ok(map_to_media_files(raw_media_files))
}

async fn get_raw_media_files_by_tokens(
  mut transactor: Transactor<'_, '_>,
  media_file_tokens: &[MediaFileToken],
  can_see_deleted: bool
) -> AnyhowResult<Vec<RawMediaFileJoinUser>> {

  let mut query_builder : QueryBuilder<MySql> = if can_see_deleted {
    QueryBuilder::new(r#"
      SELECT
          m.token,

          m.media_class,
          m.media_type,

          m.maybe_engine_category,
          m.maybe_animation_type,

          m.origin_category,
          m.origin_product_category,

          m.maybe_origin_model_type,
          m.maybe_origin_model_token,

          w.title as maybe_origin_model_title,

          users.token as maybe_creator_user_token,
          users.username as maybe_creator_username,
          users.display_name as maybe_creator_display_name,
          users.email_gravatar_hash as maybe_creator_email_gravatar_hash,

          m.public_bucket_directory_hash,
          m.maybe_public_bucket_prefix,
          m.maybe_public_bucket_extension,

          m.is_user_upload,
          m.is_intermediate_system_file,

          m.maybe_title,
          m.maybe_text_transcript,
          prompts.maybe_other_args as maybe_other_prompt_args,
          m.maybe_duration_millis,

          entity_stats.ratings_positive_count as maybe_ratings_positive_count,
          entity_stats.ratings_negative_count as maybe_ratings_negative_count,
          entity_stats.bookmark_count as maybe_bookmark_count,

          media_file_cover_image.public_bucket_directory_hash as maybe_file_cover_image_public_bucket_hash,
          media_file_cover_image.maybe_public_bucket_prefix as maybe_file_cover_image_public_bucket_prefix,
          media_file_cover_image.maybe_public_bucket_extension as maybe_file_cover_image_public_bucket_extension,
          
          m.creator_set_visibility,

          m.created_at,
          m.updated_at

      FROM media_files as m
      LEFT OUTER JOIN users
          ON users.token = m.maybe_creator_user_token
      LEFT OUTER JOIN model_weights as w
           ON m.maybe_origin_model_token = w.token
      LEFT OUTER JOIN entity_stats
          ON entity_stats.entity_type = "media_file"
          AND entity_stats.entity_token = m.token
      LEFT OUTER JOIN media_files as media_file_cover_image
          ON media_file_cover_image.token = m.maybe_cover_image_media_file_token
      LEFT OUTER JOIN prompts
          ON prompts.token = m.maybe_prompt_token
      WHERE
          m.token IN (
      "#,
    )

  } else {
    QueryBuilder::new(r#"
      SELECT
          m.token,

          m.media_class,
          m.media_type,

          m.maybe_engine_category,
          m.maybe_animation_type,

          m.origin_category,
          m.origin_product_category,

          m.maybe_origin_model_type,
          m.maybe_origin_model_token,

          w.title as maybe_origin_model_title,

          users.token as maybe_creator_user_token,
          users.username as maybe_creator_username,
          users.display_name as maybe_creator_display_name,
          users.email_gravatar_hash as maybe_creator_email_gravatar_hash,

          m.public_bucket_directory_hash,
          m.maybe_public_bucket_prefix,
          m.maybe_public_bucket_extension,

          m.is_user_upload,
          m.is_intermediate_system_file,

          m.maybe_title,
          m.maybe_text_transcript,
          prompts.maybe_other_args as maybe_other_prompt_args,
          m.maybe_duration_millis,

          entity_stats.ratings_positive_count as maybe_ratings_positive_count,
          entity_stats.ratings_negative_count as maybe_ratings_negative_count,
          entity_stats.bookmark_count as maybe_bookmark_count,

          media_file_cover_image.public_bucket_directory_hash as maybe_file_cover_image_public_bucket_hash,
          media_file_cover_image.maybe_public_bucket_prefix as maybe_file_cover_image_public_bucket_prefix,
          media_file_cover_image.maybe_public_bucket_extension as maybe_file_cover_image_public_bucket_extension,

          m.creator_set_visibility,

          m.created_at,
          m.updated_at

      FROM media_files as m
      LEFT OUTER JOIN users
          ON users.token = m.maybe_creator_user_token
      LEFT OUTER JOIN model_weights as w
           ON m.maybe_origin_model_token = w.token
      LEFT OUTER JOIN entity_stats
          ON entity_stats.entity_type = "media_file"
          AND entity_stats.entity_token = m.token
      LEFT OUTER JOIN media_files as media_file_cover_image
          ON media_file_cover_image.token = m.maybe_cover_image_media_file_token
      LEFT OUTER JOIN prompts
          ON prompts.token = m.maybe_prompt_token
      WHERE
          m.user_deleted_at IS NULL
          AND m.mod_deleted_at IS NULL
          AND m.token IN (
      "#
    )
  };

  query_builder.push(token_predicate(media_file_tokens));

  query_builder.push(")");

  let query = query_builder.build_query_as::<RawMediaFileJoinUser>();

  let results = match transactor {
    Transactor::Pool { pool } => {
      query.fetch_all(pool).await?
    },
    Transactor::Connection { connection } => {
      query.fetch_all(connection).await?
    },
    Transactor::Transaction { transaction } => {
      query.fetch_all(&mut **transaction).await?
    },
  };

  Ok(results)
}

/// Return a comma-separated predicate, since SQLx does not yet support WHERE IN(?) for Vec<T>, etc.
/// Issue: https://github.com/launchbadge/sqlx/issues/875
fn token_predicate(tokens: &[MediaFileToken]) -> String {
  tokens.iter()
      .map(|ty| ty.as_str())
      .map(|ty| format!("\"{}\"", ty))
      .collect::<Vec<String>>()
      .join(", ")
}

fn map_to_media_files(dataset:Vec<RawMediaFileJoinUser>) -> Vec<MediaFilesByTokensRecord> {
  let media_files: Vec<MediaFilesByTokensRecord> = dataset
      .into_iter()
      .map(|media_file: RawMediaFileJoinUser| {
        MediaFilesByTokensRecord {
          token: media_file.token,

          media_class: media_file.media_class,
          media_type: media_file.media_type,

          maybe_animation_type: media_file.maybe_animation_type,
          maybe_engine_category: media_file.maybe_engine_category,

          origin_category: media_file.origin_category,
          origin_product_category: media_file.origin_product_category,
          maybe_origin_model_type: media_file.maybe_origin_model_type,
          maybe_origin_model_token: media_file.maybe_origin_model_token,
          maybe_origin_model_title: media_file.maybe_origin_model_title,

          maybe_creator_user_token: media_file.maybe_creator_user_token,
          maybe_creator_username: media_file.maybe_creator_username,
          maybe_creator_display_name: media_file.maybe_creator_display_name,
          maybe_creator_email_gravatar_hash: media_file.maybe_creator_email_gravatar_hash,

          maybe_ratings_positive_count: media_file.maybe_ratings_positive_count,
          maybe_ratings_negative_count: media_file.maybe_ratings_negative_count,
          maybe_bookmark_count: media_file.maybe_bookmark_count,

          public_bucket_directory_hash: media_file.public_bucket_directory_hash,
          maybe_public_bucket_prefix: media_file.maybe_public_bucket_prefix,
          maybe_public_bucket_extension: media_file.maybe_public_bucket_extension,

          is_user_upload: i8_to_bool(media_file.is_user_upload),
          is_intermediate_system_file: i8_to_bool(media_file.is_intermediate_system_file),

          maybe_title: media_file.maybe_title,
          maybe_text_transcript: media_file.maybe_text_transcript,

          maybe_prompt_args: media_file.maybe_other_prompt_args
              .as_deref()
              .map(|args| PromptInnerPayload::from_json(args))
              .transpose()
              .ok() // NB: Fail open
              .flatten(),

          maybe_duration_millis: media_file.maybe_duration_millis.map(|d| d as u64),

          maybe_file_cover_image_public_bucket_hash: media_file.maybe_file_cover_image_public_bucket_hash,
          maybe_file_cover_image_public_bucket_prefix: media_file.maybe_file_cover_image_public_bucket_prefix,
          maybe_file_cover_image_public_bucket_extension: media_file.maybe_file_cover_image_public_bucket_extension,

          creator_set_visibility: media_file.creator_set_visibility,
          
          created_at: media_file.created_at,
          updated_at: media_file.updated_at,
        }
      }).collect();

  media_files
}

  #[derive(Serialize)]
  pub struct RawMediaFileJoinUser {
    pub token: MediaFileToken,

    pub media_class: MediaFileClass,
    pub media_type: MediaFileType,

    pub maybe_engine_category: Option<MediaFileEngineCategory>,
    pub maybe_animation_type: Option<MediaFileAnimationType>,

    pub origin_category: MediaFileOriginCategory,
    pub origin_product_category: MediaFileOriginProductCategory,

    pub maybe_origin_model_type: Option<MediaFileOriginModelType>,
    pub maybe_origin_model_token: Option<String>,

    pub maybe_origin_model_title: Option<String>,

    pub maybe_creator_user_token: Option<UserToken>,
    pub maybe_creator_username: Option<String>,
    pub maybe_creator_display_name: Option<String>,
    pub maybe_creator_email_gravatar_hash: Option<String>,

    pub public_bucket_directory_hash: String,
    pub maybe_public_bucket_prefix: Option<String>,
    pub maybe_public_bucket_extension: Option<String>,

    pub maybe_ratings_positive_count: Option<u32>,
    pub maybe_ratings_negative_count: Option<u32>,
    pub maybe_bookmark_count: Option<u32>,

    pub is_user_upload: i8,
    pub is_intermediate_system_file: i8,

    pub maybe_title: Option<String>,
    pub maybe_text_transcript: Option<String>,
    pub maybe_other_prompt_args: Option<String>,
    pub maybe_duration_millis: Option<i32>,

    pub maybe_file_cover_image_public_bucket_hash: Option<String>,
    pub maybe_file_cover_image_public_bucket_prefix: Option<String>,
    pub maybe_file_cover_image_public_bucket_extension: Option<String>,
    
    pub creator_set_visibility: Visibility,

    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// NB(bt,2023-12-05): There's an issue with type hinting in the `as` clauses with QueryBuilder (or
// raw query strings) and sqlx::FromRow, regardless of whether it is derived of manually
// implemented. Perhaps this will improve in the future, but for now manually constructed queries
// cannot have type hints, eg. the following:
//
//    m.token as `token: tokens::tokens::media_files::MediaFileToken`,
//    m.origin_category as `origin_category: enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory`,
//    m.creator_set_visibility as `creator_set_visibility: enums::common::visibility::Visibility`,
//
// This results in the automatic mapping not being able to be found by name (for macro derive), and
// in the manual case `row.try_get()` etc. won't have the correct column name (since the name is the
// full "as" clause).
impl FromRow<'_, MySqlRow> for RawMediaFileJoinUser {
  fn from_row(row: &MySqlRow) -> Result<Self, sqlx::Error> {
    Ok(Self {
      token: MediaFileToken::new(row.try_get("token")?),
      media_class: MediaFileClass::try_from_mysql_row(row, "media_class")?,
      media_type: MediaFileType::try_from_mysql_row(row, "media_type")?,
      maybe_engine_category: MediaFileEngineCategory::try_from_mysql_row_nullable(row, "maybe_engine_category")?,
      maybe_animation_type: MediaFileAnimationType::try_from_mysql_row_nullable(row, "maybe_animation_type")?,
      origin_category: MediaFileOriginCategory::try_from_mysql_row(row, "origin_category")?,
      origin_product_category: MediaFileOriginProductCategory::try_from_mysql_row(row, "origin_product_category")?,
      maybe_origin_model_type: MediaFileOriginModelType::try_from_mysql_row_nullable(row, "maybe_origin_model_type")?,
      maybe_origin_model_token: row.try_get("maybe_origin_model_token")?,
      maybe_origin_model_title: row.try_get("maybe_origin_model_title")?,
      maybe_creator_user_token: row.try_get::<Option<String>, _>("maybe_creator_user_token")?
          .and_then(|token| Some(UserToken::new_from_str(&token))),
      maybe_creator_username: row.try_get("maybe_creator_username")?,
      maybe_creator_display_name: row.try_get("maybe_creator_display_name")?,
      maybe_creator_email_gravatar_hash: row.try_get("maybe_creator_email_gravatar_hash")?,
      public_bucket_directory_hash: row.try_get("public_bucket_directory_hash")?,
      maybe_public_bucket_prefix: row.try_get("maybe_public_bucket_prefix")?,
      maybe_public_bucket_extension: row.try_get("maybe_public_bucket_extension")?,
      maybe_ratings_positive_count: row.try_get("maybe_ratings_positive_count")?,
      maybe_ratings_negative_count: row.try_get("maybe_ratings_negative_count")?,
      maybe_bookmark_count: row.try_get("maybe_bookmark_count")?,
      is_user_upload: row.try_get("is_user_upload")?,
      is_intermediate_system_file: row.try_get("is_intermediate_system_file")?,
      maybe_title: row.try_get("maybe_title")?,
      maybe_text_transcript: row.try_get("maybe_text_transcript")?,
      maybe_other_prompt_args: row.try_get("maybe_other_prompt_args")?,
      maybe_duration_millis: row.try_get("maybe_duration_millis")?,
      maybe_file_cover_image_public_bucket_hash: row.try_get("maybe_file_cover_image_public_bucket_hash")?,
      maybe_file_cover_image_public_bucket_prefix: row.try_get("maybe_file_cover_image_public_bucket_prefix")?,
      maybe_file_cover_image_public_bucket_extension: row.try_get("maybe_file_cover_image_public_bucket_extension")?,
      creator_set_visibility: Visibility::try_from_mysql_row(row, "creator_set_visibility")?,
      created_at: row.try_get("created_at")?,
      updated_at: row.try_get("updated_at")?,
    })
  }
}
