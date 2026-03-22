use chrono::{DateTime, Utc};
use sqlx::{FromRow, MySql, MySqlPool, QueryBuilder, Row};
use sqlx::mysql::MySqlRow;

use enums::by_table::media_files::media_file_animation_type::MediaFileAnimationType;
use enums::traits::mysql_from_row::MySqlFromRow as _;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_engine_category::MediaFileEngineCategory;
use enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory;
use enums::by_table::media_files::media_file_origin_model_type::MediaFileOriginModelType;
use enums::by_table::media_files::media_file_origin_product_category::MediaFileOriginProductCategory;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::common::view_as::ViewAs;
use enums::common::visibility::Visibility;
use errors::AnyhowResult;
use tokens::tokens::batch_generations::BatchGenerationToken;
use tokens::tokens::media_files::MediaFileToken;

use crate::helpers::boolean_converters::i8_to_bool;
use crate::payloads::prompt_args::prompt_inner_payload::PromptInnerPayload;

pub struct MediaFileListPage {
  pub records: Vec<MediaFileListItem>,

  pub sort_ascending: bool,

  pub current_page: usize,
  pub total_page_count: usize,
}

pub struct MediaFileListItem {
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

  pub creator_set_visibility: Visibility,

  pub is_user_upload: bool,
  pub is_intermediate_system_file: bool,

  pub maybe_title: Option<String>,

  /// Text transcripts for TTS, etc.
  pub maybe_text_transcript: Option<String>,
  pub maybe_prompt_args: Option<PromptInnerPayload>,

  pub maybe_duration_millis: Option<u64>,

  pub maybe_ratings_positive_count: Option<u32>,
  pub maybe_ratings_negative_count: Option<u32>,
  pub maybe_bookmark_count: Option<u32>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

pub struct ListMediaFileByBatchArgs<'a> {
  pub batch_token: &'a BatchGenerationToken,
  pub page_size: usize,
  pub page_index: usize,
  pub sort_ascending: bool,
  pub view_as: ViewAs,
  pub mysql_pool: &'a MySqlPool,
}

pub async fn list_media_files_by_batch_token(args: ListMediaFileByBatchArgs<'_>) -> AnyhowResult<MediaFileListPage> {
  /// Let's figure out how many results we could have returned total
  let count_fields = select_total_count_field();
  let mut count_query_builder = query_builder(
    args.batch_token,
    false,
    0,
    0,
    args.sort_ascending,
    args.view_as,
    count_fields.as_str(),
  );

  let row_count_query = count_query_builder.build_query_scalar::<i64>();
  let row_count_result = row_count_query.fetch_one(args.mysql_pool).await?;

  /// Now fetch the actual results with all the fields
  let result_fields = select_result_fields();
  let mut query = query_builder(
    args.batch_token,
    true,
    args.page_index,
    args.page_size,
    args.sort_ascending,
    args.view_as,
    result_fields.as_str(),
  );

  let query = query.build_query_as::<MediaFileListItemInternal>();
  let results = query.fetch_all(args.mysql_pool).await?;

  let number_of_pages = (row_count_result / args.page_size as i64) as usize;
  let results = results.into_iter()
      .map(|record| {
        MediaFileListItem {
          token: record.token,
          media_class: record.media_class,
          media_type: record.media_type,
          maybe_engine_category: record.maybe_engine_category,
          maybe_animation_type: record.maybe_animation_type,
          origin_category: record.origin_category,
          origin_product_category: record.origin_product_category,
          maybe_origin_model_type: record.maybe_origin_model_type,
          maybe_origin_model_token: record.maybe_origin_model_token,
          maybe_origin_model_title: record.maybe_origin_model_title,
          public_bucket_directory_hash: record.public_bucket_directory_hash,
          maybe_public_bucket_prefix: record.maybe_public_bucket_prefix,
          maybe_public_bucket_extension: record.maybe_public_bucket_extension,
          creator_set_visibility: record.creator_set_visibility,
          is_user_upload: i8_to_bool(record.is_user_upload),
          is_intermediate_system_file: i8_to_bool(record.is_intermediate_system_file),
          maybe_title: record.maybe_title,
          maybe_text_transcript: record.maybe_text_transcript,
          maybe_prompt_args: record.maybe_other_prompt_args
              .as_deref()
              .map(|args| PromptInnerPayload::from_json(args))
              .transpose()
              .ok() // NB: Fail open
              .flatten(),
          maybe_duration_millis: record.maybe_duration_millis.map(|d| d as u64),
          maybe_ratings_positive_count: record.maybe_ratings_positive_count,
          maybe_ratings_negative_count: record.maybe_ratings_negative_count,
          maybe_bookmark_count: record.maybe_bookmark_count,
          created_at: record.created_at,
          updated_at: record.updated_at,
        }
      })
      .collect::<Vec<_>>();

  Ok(MediaFileListPage {
    records: results,
    sort_ascending: args.sort_ascending,
    current_page: args.page_index,
    total_page_count: number_of_pages,
  })
}

fn select_result_fields() -> String {
  r#"
    m.id,
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

    m.public_bucket_directory_hash,
    m.maybe_public_bucket_prefix,
    m.maybe_public_bucket_extension,

    m.creator_set_visibility,

    m.is_user_upload,
    m.is_intermediate_system_file,

    m.maybe_title,
    m.maybe_text_transcript,
    prompts.maybe_other_args as maybe_other_prompt_args,
    m.maybe_duration_millis,

    entity_stats.ratings_positive_count as maybe_ratings_positive_count,
    entity_stats.ratings_negative_count as maybe_ratings_negative_count,
    entity_stats.bookmark_count as maybe_bookmark_count,

    m.created_at,
    m.updated_at
  "#
  .to_string()
}

fn select_total_count_field() -> String {
  r#"
    COUNT(m.id) AS total_count
  "#
  .to_string()
}

fn query_builder<'a>(
  batch_token: &'a BatchGenerationToken,
  enforce_limits: bool,
  page_index: usize,
  page_size: usize,
  sort_ascending: bool,
  view_as: ViewAs,
  select_fields: &'a str,
) -> QueryBuilder<'a, MySql> {

  // NB: Query cannot be statically checked by sqlx
  let mut query_builder: QueryBuilder<MySql> = QueryBuilder::new(
    format!(r#"
SELECT
     {select_fields}
FROM media_files AS m
LEFT OUTER JOIN users AS u
    ON m.maybe_creator_user_token = u.token
LEFT OUTER JOIN model_weights as w
     ON m.maybe_origin_model_token = w.token
LEFT OUTER JOIN entity_stats
    ON entity_stats.entity_type = "media_file"
    AND entity_stats.entity_token = m.token
LEFT OUTER JOIN prompts
    ON prompts.token = m.maybe_prompt_token
    "#
  ));

  query_builder.push(" WHERE m.maybe_batch_token IS NOT NULL AND m.maybe_batch_token = ");
  query_builder.push_bind(batch_token);

  match view_as {
    ViewAs::Author | ViewAs::Moderator => {
      // NB(bt): Actually, mods don't want to see deleted files. We'll improve the moderator UI later.
      query_builder.push(" AND m.user_deleted_at IS NULL AND m.mod_deleted_at IS NULL ");
    }
    ViewAs::AnotherUser => {
      query_builder.push(" AND m.user_deleted_at IS NULL AND m.mod_deleted_at IS NULL ");
      // FIXME: Binding shouldn't require to_str().
      //  Otherwise, it's calling the Display trait on the raw type which is resulting in an
      //  incorrect binding and runtime error.
      query_builder.push(" AND m.creator_set_visibility = ");
      query_builder.push_bind(Visibility::Public.to_str());
    }
  }

  if sort_ascending {
    query_builder.push(" ORDER BY m.created_at ASC ");
  } else {
    query_builder.push(" ORDER BY m.created_at DESC ");
  }

  if enforce_limits {
    let offset = page_index * page_size;
    query_builder.push(format!(" LIMIT {page_size} OFFSET {offset} "));
  }

  query_builder
}

struct MediaFileListItemInternal {
  id: i64,
  token: MediaFileToken,

  media_class: MediaFileClass,
  media_type: MediaFileType,

  maybe_engine_category: Option<MediaFileEngineCategory>,
  maybe_animation_type: Option<MediaFileAnimationType>,

  origin_category: MediaFileOriginCategory,
  origin_product_category: MediaFileOriginProductCategory,
  
  maybe_origin_model_type: Option<MediaFileOriginModelType>,
  maybe_origin_model_token: Option<String>,
  
  // NB: The title won't be populated for `tts_models` records or non-`model_weights` records.
  maybe_origin_model_title: Option<String>,

  public_bucket_directory_hash: String,
  maybe_public_bucket_prefix: Option<String>,
  maybe_public_bucket_extension: Option<String>,

  creator_set_visibility: Visibility,

  is_user_upload: i8,
  is_intermediate_system_file: i8,

  maybe_title: Option<String>,

  /// Text transcripts for TTS, etc.
  maybe_text_transcript: Option<String>,
  maybe_other_prompt_args: Option<String>,

  maybe_ratings_positive_count: Option<u32>,
  maybe_ratings_negative_count: Option<u32>,
  maybe_bookmark_count: Option<u32>,
  maybe_duration_millis: Option<i32>,

  created_at: DateTime<Utc>,
  updated_at: DateTime<Utc>,
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
impl FromRow<'_, MySqlRow> for MediaFileListItemInternal {
  fn from_row(row: &MySqlRow) -> Result<Self, sqlx::Error> {
    Ok(Self {
      id: row.try_get("id")?,
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
      public_bucket_directory_hash: row.try_get("public_bucket_directory_hash")?,
      maybe_public_bucket_prefix: row.try_get("maybe_public_bucket_prefix")?,
      maybe_public_bucket_extension: row.try_get("maybe_public_bucket_extension")?,
      creator_set_visibility: Visibility::try_from_mysql_row(row, "creator_set_visibility")?,
      is_user_upload: row.try_get("is_user_upload")?,
      is_intermediate_system_file: row.try_get("is_intermediate_system_file")?,
      maybe_title: row.try_get("maybe_title")?,
      maybe_text_transcript: row.try_get("maybe_text_transcript")?,
      maybe_other_prompt_args: row.try_get("maybe_other_prompt_args")?,
      maybe_duration_millis: row.try_get("maybe_duration_millis")?,
      maybe_ratings_positive_count: row.try_get("maybe_ratings_positive_count")?,
      maybe_ratings_negative_count: row.try_get("maybe_ratings_negative_count")?,
      maybe_bookmark_count: row.try_get("maybe_bookmark_count")?,
      created_at: row.try_get("created_at")?,
      updated_at: row.try_get("updated_at")?,
    })
  }
}
