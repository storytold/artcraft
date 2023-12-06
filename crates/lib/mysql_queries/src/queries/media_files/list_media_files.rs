use chrono::{DateTime, Utc};
use sqlx::{FromRow, MySql, MySqlPool, QueryBuilder, Row};
use sqlx::mysql::MySqlRow;

use enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory;
use enums::by_table::media_files::media_file_origin_model_type::MediaFileOriginModelType;
use enums::by_table::media_files::media_file_origin_product_category::MediaFileOriginProductCategory;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::common::visibility::Visibility;
use enums::traits::mysql_from_row::MySqlFromRow;
use errors::AnyhowResult;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::users::UserToken;

pub struct MediaFileListPage {
  pub records: Vec<MediaFileListItem>,

  pub sort_ascending: bool,

  /// ID of the first record.
  pub first_id: Option<i64>,

  /// ID of the last record.
  pub last_id: Option<i64>,
}

pub struct MediaFileListItem {
  pub token: MediaFileToken,

  pub origin_category: MediaFileOriginCategory,
  pub origin_product_category: MediaFileOriginProductCategory,
  pub maybe_origin_model_type: Option<MediaFileOriginModelType>,
  pub maybe_origin_model_token: Option<String>,

  pub media_type: MediaFileType,
  pub public_bucket_directory_hash: String,
  pub maybe_public_bucket_prefix: Option<String>,
  pub maybe_public_bucket_extension: Option<String>,

  pub maybe_creator_user_token: Option<UserToken>,
  pub maybe_creator_username: Option<String>,
  pub maybe_creator_display_name: Option<String>,
  pub maybe_creator_gravatar_hash: Option<String>,

  pub creator_set_visibility: Visibility,

  pub comment_count: u64,
  pub favorite_count: u64,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

#[derive(Clone, Copy)]
pub enum ViewAs {
  Moderator,
  NonModerator,
}

pub struct ListMediaFilesArgs<'a> {
  pub limit: usize,
  pub maybe_filter_media_type: Option<MediaFileType>,
  pub maybe_offset: Option<usize>,
  pub cursor_is_reversed: bool,
  pub view_as: ViewAs,
  pub mysql_pool: &'a MySqlPool,
}

pub async fn list_media_files(args: ListMediaFilesArgs<'_>) -> AnyhowResult<MediaFileListPage> {

  let mut query = query_builder(
    args.maybe_filter_media_type,
    args.limit,
    args.maybe_offset,
    args.cursor_is_reversed,
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
        MediaFileListItem {
          token: record.token,
          origin_category: record.origin_category,
          origin_product_category: record.origin_product_category,
          maybe_origin_model_type: record.maybe_origin_model_type,
          maybe_origin_model_token: record.maybe_origin_model_token,
          media_type: record.media_type,
          public_bucket_directory_hash: record.public_bucket_directory_hash,
          maybe_public_bucket_prefix: record.maybe_public_bucket_prefix,
          maybe_public_bucket_extension: record.maybe_public_bucket_extension,
          maybe_creator_user_token: record.maybe_creator_user_token,
          maybe_creator_username: record.maybe_creator_username,
          maybe_creator_display_name: record.maybe_creator_display_name,
          maybe_creator_gravatar_hash: record.maybe_creator_gravatar_hash,
          creator_set_visibility: record.creator_set_visibility,
          comment_count: record.comment_count as u64,
          favorite_count: record.favorite_count as u64,
          created_at: record.created_at,
          updated_at: record.updated_at,
        }
      })
      .collect::<Vec<_>>();

  Ok(MediaFileListPage {
    records: results,
    sort_ascending: !args.cursor_is_reversed,
    first_id,
    last_id,
  })
}

fn query_builder<'a>(
  maybe_filter_media_type: Option<MediaFileType>,
  limit: usize,
  maybe_offset: Option<usize>,
  cursor_is_reversed: bool,
  view_as: ViewAs,
) -> QueryBuilder<'a, MySql> {

  // NB: Query cannot be statically checked by sqlx
  let mut query_builder: QueryBuilder<MySql> = QueryBuilder::new(
    r#"
SELECT
  m.id,
  m.token,

  m.origin_category,
  m.origin_product_category,

  m.maybe_origin_model_type,
  m.maybe_origin_model_token,

  m.media_type,

  m.public_bucket_directory_hash,
  m.maybe_public_bucket_prefix,
  m.maybe_public_bucket_extension,

  m.maybe_creator_user_token,
  u.username as maybe_creator_username,
  u.display_name as maybe_creator_display_name,
  u.email_gravatar_hash as maybe_creator_gravatar_hash,

  m.creator_set_visibility,
  m.created_at,
  m.updated_at,

  COUNT(f.id) as favorite_count,
  COUNT(c.id) as comment_count

FROM media_files AS m

LEFT OUTER JOIN users AS u
    ON m.maybe_creator_user_token = u.token
LEFT OUTER JOIN favorites as f
    ON f.entity_type = 'media_file' AND f.entity_token = m.token
LEFT OUTER JOIN comments as c
    ON c.entity_type = 'media_file' AND c.entity_token  = c.token
WHERE
    m.user_deleted_at IS NULL
    AND m.mod_deleted_at IS NULL
    "#
  );

  if let Some(media_type) = maybe_filter_media_type {
    // FIXME: Binding shouldn't require to_str().
    //  Otherwise, it's calling the Display trait on the raw type which is resulting in an
    //  incorrect binding and runtime error.
    query_builder.push(" AND m.media_file_type = ");
    query_builder.push_bind(media_type.to_str());
  }

  match view_as {
    ViewAs::Moderator => {}
    ViewAs::NonModerator=> {
      // FIXME: Binding shouldn't require to_str().
      //  Otherwise, it's calling the Display trait on the raw type which is resulting in an
      //  incorrect binding and runtime error.
      query_builder.push(" AND m.creator_set_visibility = ");
      query_builder.push_bind(Visibility::Public.to_str());
    }
  }

  if let Some(offset) = maybe_offset {
    if cursor_is_reversed {
      query_builder.push(format!(" AND m.id < {offset} "));
    } else {
      query_builder.push(format!(" AND m.id > {offset} "));
    }
  }


  query_builder.push(" GROUP BY m.id");

  if cursor_is_reversed {
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

  origin_category: MediaFileOriginCategory,
  origin_product_category: MediaFileOriginProductCategory,
  maybe_origin_model_type: Option<MediaFileOriginModelType>,
  maybe_origin_model_token: Option<String>,

  media_type: MediaFileType,
  public_bucket_directory_hash: String,
  maybe_public_bucket_prefix: Option<String>,
  maybe_public_bucket_extension: Option<String>,

  maybe_creator_user_token: Option<UserToken>,
  maybe_creator_username: Option<String>,
  maybe_creator_display_name: Option<String>,
  maybe_creator_gravatar_hash: Option<String>,

  creator_set_visibility: Visibility,

  comment_count: i64,
  favorite_count: i64,

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
      origin_category: MediaFileOriginCategory::try_from_mysql_row(row, "origin_category")?,
      origin_product_category: MediaFileOriginProductCategory::try_from_mysql_row(row, "origin_product_category")?,
      maybe_origin_model_type: MediaFileOriginModelType::try_from_mysql_row_nullable(row, "maybe_origin_model_type")?,
      maybe_origin_model_token: row.try_get("maybe_origin_model_token")?,
      media_type: MediaFileType::try_from_mysql_row(row, "media_type")?,
      public_bucket_directory_hash: row.try_get("public_bucket_directory_hash")?,
      maybe_public_bucket_prefix: row.try_get("maybe_public_bucket_prefix")?,
      maybe_public_bucket_extension: row.try_get("maybe_public_bucket_extension")?,
      maybe_creator_user_token,
      maybe_creator_username: row.try_get("maybe_creator_username")?,
      maybe_creator_display_name: row.try_get("maybe_creator_display_name")?,
      maybe_creator_gravatar_hash: row.try_get("maybe_creator_gravatar_hash")?,
      creator_set_visibility: Visibility::try_from_mysql_row(row, "creator_set_visibility")?,
      created_at: row.try_get("created_at")?,
      updated_at: row.try_get("updated_at")?,
      comment_count: row.try_get("comment_count")?,
      favorite_count: row.try_get("favorite_count")?,
    })
  }
}
