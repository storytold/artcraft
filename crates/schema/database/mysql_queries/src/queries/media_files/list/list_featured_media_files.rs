use std::collections::HashSet;

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
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::users::UserToken;

use crate::helpers::boolean_converters::i8_to_bool;
use crate::payloads::prompt_args::prompt_inner_payload::PromptInnerPayload;

// NB: Clone is for caches.
#[derive(Clone)]
pub struct FeaturedMediaFileListPage {
  pub records: Vec<FeaturedMediaFileListItem>,

  pub sort_ascending: bool,

  /// ID of the first record in the result set.
  pub first_id: Option<i64>,

  /// ID of the last record in the result set.
  pub last_id: Option<i64>,
}

#[derive(Clone)]
pub struct FeaturedMediaFileListItem {
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
  pub maybe_creator_gravatar_hash: Option<String>,

  pub maybe_title: Option<String>,
  pub maybe_text_transcript: Option<String>,
  pub maybe_prompt_args: Option<PromptInnerPayload>,

  pub maybe_duration_millis: Option<u64>,

  pub creator_set_visibility: Visibility,

  pub is_user_upload: bool,
  pub is_intermediate_system_file: bool,

  pub maybe_file_cover_image_public_bucket_hash: Option<String>,
  pub maybe_file_cover_image_public_bucket_prefix: Option<String>,
  pub maybe_file_cover_image_public_bucket_extension: Option<String>,

  #[deprecated(note = "more expensive to query")]
  pub comment_count: u64,

  #[deprecated(note = "more expensive to query")]
  pub favorite_count: u64,

  pub maybe_ratings_positive_count: Option<u32>,
  pub maybe_ratings_negative_count: Option<u32>,
  pub maybe_bookmark_count: Option<u32>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

pub struct ListFeaturedMediaFilesArgs<'a> {
  pub limit: usize,
  pub maybe_filter_media_types: Option<&'a HashSet<MediaFileType>>,
  pub maybe_filter_media_classes: Option<&'a HashSet<MediaFileClass>>,
  pub maybe_filter_engine_categories: Option<&'a HashSet<MediaFileEngineCategory>>,
  pub maybe_filter_product_categories: Option<&'a HashSet<MediaFileOriginProductCategory>>,
  pub maybe_offset: Option<usize>,
  pub cursor_is_reversed: bool,
  pub sort_ascending: bool,
  pub view_as: ViewAs,
  pub mysql_pool: &'a MySqlPool,
}

pub async fn list_featured_media_files(args: ListFeaturedMediaFilesArgs<'_>) -> AnyhowResult<FeaturedMediaFileListPage> {

  let mut query = query_builder(
    args.maybe_filter_media_types,
    args.maybe_filter_media_classes,
    args.maybe_filter_engine_categories,
    args.maybe_filter_product_categories,
    args.limit,
    args.maybe_offset,
    args.cursor_is_reversed,
    args.sort_ascending,
    args.view_as,
  );

  let query = query.build_query_as::<MediaFileListItemInternal>();

  let results = query.fetch_all(args.mysql_pool).await?;

  let first_id = results.first()
      .map(|raw_result| raw_result.id);

  let last_id = results.last()
      .map(|raw_result| raw_result.id);

  let results = results.into_iter()
      .map(|record| {
        FeaturedMediaFileListItem {
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
          maybe_creator_user_token: record.maybe_creator_user_token,
          maybe_creator_username: record.maybe_creator_username,
          maybe_creator_display_name: record.maybe_creator_display_name,
          maybe_creator_gravatar_hash: record.maybe_creator_gravatar_hash,
          maybe_title: record.maybe_title,
          maybe_text_transcript: record.maybe_text_transcript,
          maybe_prompt_args: record.maybe_other_prompt_args
              .as_deref()
              .map(|args| PromptInnerPayload::from_json(args))
              .transpose()
              .ok() // NB: Fail open
              .flatten(),
          maybe_duration_millis: record.maybe_duration_millis.map(|d| d as u64),
          creator_set_visibility: record.creator_set_visibility,
          is_user_upload: i8_to_bool(record.is_user_upload),
          is_intermediate_system_file: i8_to_bool(record.is_intermediate_system_file),
          maybe_file_cover_image_public_bucket_hash: record.maybe_file_cover_image_public_bucket_hash,
          maybe_file_cover_image_public_bucket_prefix: record.maybe_file_cover_image_public_bucket_prefix,
          maybe_file_cover_image_public_bucket_extension: record.maybe_file_cover_image_public_bucket_extension,
          comment_count: record.comment_count as u64,
          favorite_count: record.favorite_count as u64,
          maybe_ratings_positive_count: record.maybe_ratings_positive_count,
          maybe_ratings_negative_count: record.maybe_ratings_negative_count,
          maybe_bookmark_count: record.maybe_bookmark_count,
          created_at: record.created_at,
          updated_at: record.updated_at,
        }
      })
      .collect::<Vec<_>>();

  Ok(FeaturedMediaFileListPage {
    records: results,
    sort_ascending: !args.cursor_is_reversed,
    first_id,
    last_id,
  })
}

fn query_builder<'a>(
  maybe_filter_media_types: Option<&HashSet<MediaFileType>>,
  maybe_filter_media_classes: Option<&HashSet<MediaFileClass>>,
  maybe_filter_engine_categories: Option<&HashSet<MediaFileEngineCategory>>,
  maybe_filter_product_categories: Option<&HashSet<MediaFileOriginProductCategory>>,
  limit: usize,
  maybe_offset: Option<usize>,
  cursor_is_reversed: bool,
  sort_ascending: bool,
  view_as: ViewAs,
) -> QueryBuilder<'a, MySql> {

  let mut sort_ascending = sort_ascending;
  // NB: Query cannot be statically checked by sqlx
  let mut query_builder: QueryBuilder<MySql> = QueryBuilder::new(
    r#"
SELECT
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
  prompts.maybe_other_args as maybe_other_prompt_args,

  m.public_bucket_directory_hash,
  m.maybe_public_bucket_prefix,
  m.maybe_public_bucket_extension,

  m.maybe_creator_user_token,
  u.username as maybe_creator_username,
  u.display_name as maybe_creator_display_name,
  u.email_gravatar_hash as maybe_creator_gravatar_hash,

  entity_stats.ratings_positive_count as maybe_ratings_positive_count,
  entity_stats.ratings_negative_count as maybe_ratings_negative_count,
  entity_stats.bookmark_count as maybe_bookmark_count,

  m.creator_set_visibility,

  m.is_user_upload,
  m.is_intermediate_system_file,

  media_file_cover_image.public_bucket_directory_hash as maybe_file_cover_image_public_bucket_hash,
  media_file_cover_image.maybe_public_bucket_prefix as maybe_file_cover_image_public_bucket_prefix,
  media_file_cover_image.maybe_public_bucket_extension as maybe_file_cover_image_public_bucket_extension,

  m.maybe_title,
  m.maybe_text_transcript,
  m.maybe_duration_millis,

  m.created_at,
  m.updated_at,

  COUNT(f.id) as favorite_count,
  COUNT(c.id) as comment_count

FROM media_files AS m

JOIN featured_items
    ON featured_items.entity_type = "media_file"
    AND featured_items.deleted_at IS NULL
    AND featured_items.entity_token = m.token

LEFT OUTER JOIN users AS u
    ON m.maybe_creator_user_token = u.token
LEFT OUTER JOIN media_files as media_file_cover_image
    ON media_file_cover_image.token = m.maybe_cover_image_media_file_token
LEFT OUTER JOIN model_weights as w
     ON m.maybe_origin_model_token = w.token
LEFT OUTER JOIN favorites as f
    ON f.entity_type = 'media_file' AND f.entity_token = m.token
LEFT OUTER JOIN comments as c
    ON c.entity_type = 'media_file' AND c.entity_token  = c.token
LEFT OUTER JOIN entity_stats
    ON entity_stats.entity_type = "media_file"
    AND entity_stats.entity_token = m.token
LEFT OUTER JOIN prompts
    ON prompts.token = m.maybe_prompt_token
    "#
  );

  let mut first_predicate_added = false;

  if let Some(media_types) = maybe_filter_media_types {
    // NB: `WHERE IN` comma separated syntax will be wrong if list has zero length
    // We'll skip the predicate if the list isn't empty.
    if !media_types.is_empty() {
      if !first_predicate_added {
        query_builder.push(" WHERE ");
        first_predicate_added = true;
      } else {
        query_builder.push(" AND ");
      }
      query_builder.push(" m.media_type IN ( ");

      let mut separated = query_builder.separated(", ");

      for media_type in media_types.iter() {
        separated.push_bind(media_type.to_str());
      }

      separated.push_unseparated(") ");
    }
  }

  if let Some(media_classes) = maybe_filter_media_classes {
    // NB: `WHERE IN` comma separated syntax will be wrong if list has zero length
    // We'll skip the predicate if the list isn't empty.
    if !media_classes.is_empty() {
      if !first_predicate_added {
        query_builder.push(" WHERE ");
        first_predicate_added = true;
      } else {
        query_builder.push(" AND ");
      }
      query_builder.push(" m.media_class IN ( ");

      let mut separated = query_builder.separated(", ");

      for media_class in media_classes.iter() {
        separated.push_bind(media_class.to_str());
      }

      separated.push_unseparated(") ");
    }
  }

  if let Some(engine_categories) = maybe_filter_engine_categories {
    // NB: `WHERE IN` comma separated syntax will be wrong if list has zero length
    // We'll skip the predicate if the list isn't empty.
    if !engine_categories.is_empty() {
      if !first_predicate_added {
        query_builder.push(" WHERE ");
        first_predicate_added = true;
      } else {
        query_builder.push(" AND ");
      }
      query_builder.push(" m.maybe_engine_category IN ( ");

      let mut separated = query_builder.separated(", ");

      for engine_category in engine_categories.iter() {
        separated.push_bind(engine_category.to_str());
      }

      separated.push_unseparated(") ");
    }
  }

  if let Some(product_categories) = maybe_filter_product_categories {
    // NB: `WHERE IN` comma separated syntax will be wrong if list has zero length
    // We'll skip the predicate if the list isn't empty.
    if !product_categories.is_empty() {
      if !first_predicate_added {
        query_builder.push(" WHERE ");
        first_predicate_added = true;
      } else {
        query_builder.push(" AND ");
      }
      query_builder.push(" m.origin_product_category IN ( ");

      let mut separated = query_builder.separated(", ");

      for product_category in product_categories.iter() {
        separated.push_bind(product_category.to_str());
      }

      separated.push_unseparated(") ");
    }
  }

  // TODO: Argument to control `is_intermediate_system_file`
  {
    if !first_predicate_added {
      query_builder.push(" WHERE ");
      first_predicate_added = true;
    } else {
      query_builder.push(" AND ");
    }
    query_builder.push(" NOT m.is_intermediate_system_file ");
  }

  match view_as {
    ViewAs::Moderator | ViewAs::Author => {
      if !first_predicate_added {
        query_builder.push(" WHERE ");
        first_predicate_added = true;
      } else {
        query_builder.push(" AND ");
      }
      // NB(bt): Actually, mods don't want to see deleted files. We'll improve the moderator UI later.
      query_builder.push(" m.user_deleted_at IS NULL AND m.mod_deleted_at IS NULL ");
    }
    ViewAs::AnotherUser => {
      if !first_predicate_added {
        query_builder.push(" WHERE ");
        first_predicate_added = true;
      } else {
        query_builder.push(" AND ");
      }
      query_builder.push(" m.user_deleted_at IS NULL AND m.mod_deleted_at IS NULL ");
      // FIXME: Binding shouldn't require to_str().
      //  Otherwise, it's calling the Display trait on the raw type which is resulting in an
      //  incorrect binding and runtime error.
      query_builder.push(" AND m.creator_set_visibility = ");
      query_builder.push_bind(Visibility::Public.to_str());
    }
  }

  if let Some(offset) = maybe_offset {
    if !first_predicate_added {
      query_builder.push(" WHERE ");
      first_predicate_added = true;
    } else {
      query_builder.push(" AND ");
    }

    if sort_ascending {
      if cursor_is_reversed {
        // NB: We're searching backwards.
        query_builder.push(" m.id < ");
        sort_ascending = !sort_ascending;
      } else {
        query_builder.push(" m.id > ");
      }
    } else {
      if cursor_is_reversed {
        // NB: We're searching backwards.
        query_builder.push(" m.id > ");
        sort_ascending = !sort_ascending;
      } else {
        query_builder.push(" m.id < ");
      }
    }
    query_builder.push_bind(offset as i64);
  }

  query_builder.push(" GROUP BY m.id ");

  if sort_ascending {
    query_builder.push(" ORDER BY m.id ASC ");
  } else {
    query_builder.push(" ORDER BY m.id DESC ");
  }

  query_builder.push(format!(" LIMIT {limit} "));

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
  maybe_origin_model_title: Option<String>,

  public_bucket_directory_hash: String,
  maybe_public_bucket_prefix: Option<String>,
  maybe_public_bucket_extension: Option<String>,

  maybe_creator_user_token: Option<UserToken>,
  maybe_creator_username: Option<String>,
  maybe_creator_display_name: Option<String>,
  maybe_creator_gravatar_hash: Option<String>,

  creator_set_visibility: Visibility,

  is_user_upload: i8,
  is_intermediate_system_file: i8,

  maybe_file_cover_image_public_bucket_hash: Option<String>,
  maybe_file_cover_image_public_bucket_prefix: Option<String>,
  maybe_file_cover_image_public_bucket_extension: Option<String>,

  comment_count: i64,
  favorite_count: i64,

  maybe_ratings_positive_count: Option<u32>,
  maybe_ratings_negative_count: Option<u32>,
  maybe_bookmark_count: Option<u32>,

  maybe_title: Option<String>,
  maybe_text_transcript: Option<String>,
  maybe_other_prompt_args: Option<String>,
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
    let maybe_creator_user_token : Option<String> = row.try_get("maybe_creator_user_token")?;
    let maybe_creator_user_token = maybe_creator_user_token.map(|user_token| UserToken::new(user_token));

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
      maybe_creator_user_token,
      maybe_creator_username: row.try_get("maybe_creator_username")?,
      maybe_creator_display_name: row.try_get("maybe_creator_display_name")?,
      maybe_creator_gravatar_hash: row.try_get("maybe_creator_gravatar_hash")?,
      creator_set_visibility: Visibility::try_from_mysql_row(row, "creator_set_visibility")?,
      is_user_upload: row.try_get("is_user_upload")?,
      is_intermediate_system_file: row.try_get("is_intermediate_system_file")?,
      maybe_file_cover_image_public_bucket_hash: row.try_get("maybe_file_cover_image_public_bucket_hash")?,
      maybe_file_cover_image_public_bucket_prefix: row.try_get("maybe_file_cover_image_public_bucket_prefix")?,
      maybe_file_cover_image_public_bucket_extension: row.try_get("maybe_file_cover_image_public_bucket_extension")?,
      maybe_title: row.try_get("maybe_title")?,
      maybe_text_transcript: row.try_get("maybe_text_transcript")?,
      maybe_other_prompt_args: row.try_get("maybe_other_prompt_args")?,
      maybe_duration_millis: row.try_get("maybe_duration_millis")?,
      created_at: row.try_get("created_at")?,
      updated_at: row.try_get("updated_at")?,
      comment_count: row.try_get("comment_count")?,
      favorite_count: row.try_get("favorite_count")?,
      maybe_ratings_positive_count: row.try_get("maybe_ratings_positive_count")?,
      maybe_ratings_negative_count: row.try_get("maybe_ratings_negative_count")?,
      maybe_bookmark_count: row.try_get("maybe_bookmark_count")?,
    })
  }
}
