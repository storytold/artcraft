use std::collections::HashSet;
use chrono::{DateTime, Utc};
use sqlx::{FromRow, MySql, MySqlPool, QueryBuilder, Row};
use sqlx::mysql::MySqlRow;

use enums::by_table::model_weights::{
  weights_category::WeightsCategory,
  weights_types::WeightsType,
};
use enums::common::view_as::ViewAs;
use enums::traits::mysql_from_row::MySqlFromRow as _;
use enums::common::visibility::Visibility;
use errors::AnyhowResult;
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::users::UserToken;

pub struct FeaturedWeightsPage {
  pub records: Vec<FeaturedWeight>,

  pub sort_ascending: bool,

  /// ID of the first record in the result set.
  pub first_id: Option<i64>,

  /// ID of the last record in the result set.
  pub last_id: Option<i64>,
}

#[derive(Serialize)]
pub struct FeaturedWeight {
  pub token: ModelWeightToken,

  pub weights_type: WeightsType,
  pub weights_category: WeightsCategory,

  pub title: String,

  // TODO(bt,2023-12-24): These aren't really appropriate for a list endpoint.
  //  Hopefully we don't break the frontend by omitting these.
  //pub maybe_description_markdown: String,
  //pub maybe_description_rendered_html: String,

  pub maybe_ietf_language_tag: Option<String>,
  pub maybe_ietf_primary_language_subtag: Option<String>,

  pub maybe_creator_user_token: Option<UserToken>,
  pub maybe_creator_username: Option<String>,
  pub maybe_creator_display_name: Option<String>,
  pub maybe_creator_email_gravatar_hash: Option<String>,

  pub creator_ip_address: String,
  pub creator_set_visibility: Visibility,

  pub maybe_last_update_user_token: Option<UserToken>,

  pub original_download_url: Option<String>,
  pub original_filename: Option<String>,

  pub file_size_bytes: i32,
  pub file_checksum_sha2: String,

  pub public_bucket_hash: String,
  pub maybe_public_bucket_prefix: Option<String>,
  pub maybe_public_bucket_extension: Option<String>,

  pub maybe_cover_image_public_bucket_hash: Option<String>,
  pub maybe_cover_image_public_bucket_prefix: Option<String>,
  pub maybe_cover_image_public_bucket_extension: Option<String>,

  pub maybe_ratings_positive_count: Option<u32>,
  pub maybe_ratings_negative_count: Option<u32>,
  pub maybe_bookmark_count: Option<u32>,
  pub cached_usage_count: u64,

  pub version: i32,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,

  pub user_deleted_at: Option<DateTime<Utc>>,
  pub mod_deleted_at: Option<DateTime<Utc>>,
}

pub struct ListFeaturedWeightsArgs<'a> {
  pub limit: usize,
  pub maybe_offset: Option<usize>,

  pub cursor_is_reversed: bool,
  pub sort_ascending: bool,

  pub view_as: ViewAs,

  pub maybe_scoped_weight_types: Option<&'a HashSet<WeightsType>>,
  pub maybe_scoped_weight_categories: Option<&'a HashSet<WeightsCategory>>,

  pub mysql_pool: &'a MySqlPool,
}

pub async fn list_featured_weights(args: ListFeaturedWeightsArgs<'_>) -> AnyhowResult<FeaturedWeightsPage> {
  // TODO(bt,2024-05-05): Why were we doing this, again?
  // let count_fields = select_total_count_field();
  // let mut count_query_builder = query_builder(
  //   args.limit,
  //   args.maybe_offset,
  //   args.cursor_is_reversed,
  //   args.sort_ascending,
  //   count_fields.as_str(),
  //   args.view_as,
  //   args.maybe_scoped_weight_type,
  //   args.maybe_scoped_weight_category,
  // );
  // let row_count_query = count_query_builder.build_query_scalar::<i64>();
  // let row_count_result = row_count_query.fetch_one(args.mysql_pool).await?;

  /// Now fetch the actual results with all the fields
  let result_fields = select_result_fields();
  let mut query = query_builder(
      args.limit,
      args.maybe_offset,
      args.cursor_is_reversed,
      args.sort_ascending,
      result_fields.as_str(),
      args.view_as,
      args.maybe_scoped_weight_types,
      args.maybe_scoped_weight_categories,
  );

  let query = query.build_query_as::<RawWeightJoinUser>();
  let results = query.fetch_all(args.mysql_pool).await?;

  let first_id = results.first()
      .map(|raw_result| raw_result.id);

  let last_id = results.last()
      .map(|raw_result| raw_result.id);

  let weights_records: Vec<FeaturedWeight> = map_to_weights(results).await;

  Ok(FeaturedWeightsPage {
      records: weights_records,
      sort_ascending: args.sort_ascending,
      first_id,
      last_id,
  })
}

fn select_total_count_field() -> String {
  r#"
    COUNT(mw.id) AS total_count
  "#
        .to_string()
}

fn select_result_fields() -> String {
  r#"
    mw.id,
    mw.token,
    mw.title,
    mw.weights_type,
    mw.weights_category,
    mw.maybe_ietf_language_tag,
    mw.maybe_ietf_primary_language_subtag,
    u.token as maybe_creator_user_token,
    u.username as maybe_creator_username,
    u.display_name as maybe_creator_display_name,
    u.email_gravatar_hash as maybe_creator_email_gravatar_hash,
    mw.creator_ip_address,
    mw.creator_set_visibility,
    mw.maybe_last_update_user_token,
    mw.original_download_url,
    mw.original_filename,
    mw.file_size_bytes,
    mw.file_checksum_sha2,

    mw.public_bucket_hash,
    mw.maybe_public_bucket_prefix,
    mw.maybe_public_bucket_extension,

    cover_image.public_bucket_directory_hash as maybe_cover_image_public_bucket_hash,
    cover_image.maybe_public_bucket_prefix as maybe_cover_image_public_bucket_prefix,
    cover_image.maybe_public_bucket_extension as maybe_cover_image_public_bucket_extension,

    entity_stats.ratings_positive_count as maybe_ratings_positive_count,
    entity_stats.ratings_negative_count as maybe_ratings_negative_count,
    entity_stats.bookmark_count as maybe_bookmark_count,
    mw.cached_usage_count,

    mw.version,
    mw.created_at,
    mw.updated_at,
    mw.user_deleted_at,
    mw.mod_deleted_at
  "#.to_string()
}

fn query_builder<'a>(
  _limit: usize, // TODO(bt,2024-05-16): This seems wrong. Why is this unused?
  maybe_offset: Option<usize>,
  cursor_is_reversed: bool,
  sort_ascending: bool,
  select_fields: &'a str,
  view_as: ViewAs,
  maybe_scoped_weight_types: Option<&'a HashSet<WeightsType>>,
  maybe_scoped_weight_categories: Option<&'a HashSet<WeightsCategory>>,
) -> QueryBuilder<'a, MySql> {

  // NB: Query cannot be statically checked by sqlx
  let mut query_builder: QueryBuilder<MySql> = QueryBuilder::new(
      format!(r#"
SELECT
     {select_fields}
FROM model_weights as mw

JOIN featured_items
    ON featured_items.entity_type = "model_weight"
    AND featured_items.deleted_at IS NULL
    AND featured_items.entity_token = mw.token

LEFT OUTER JOIN users as u
    ON u.token = mw.creator_user_token
LEFT OUTER JOIN media_files as cover_image
    ON cover_image.token = mw.maybe_cover_image_media_file_token
LEFT OUTER JOIN entity_stats
    ON entity_stats.entity_type = "model_weights"
    AND entity_stats.entity_token = mw.token
    "#
  ));

  let mut first_predicate_added = false;

  match view_as {
    ViewAs::Author | ViewAs::Moderator => {
      if !first_predicate_added {
        query_builder.push(" WHERE ");
        first_predicate_added = true;
      } else {
        query_builder.push(" AND ");
      }
      // NB(bt): Actually, mods don't want to see deleted models. We'll improve the moderator UI later.
      query_builder.push(" mw.user_deleted_at IS NULL AND mw.mod_deleted_at IS NULL ");
    }
    ViewAs::AnotherUser => {
      if !first_predicate_added {
        query_builder.push(" WHERE ");
        first_predicate_added = true;
      } else {
        query_builder.push(" AND ");
      }
      query_builder.push(" mw.user_deleted_at IS NULL AND mw.mod_deleted_at IS NULL ");
      query_builder.push(" AND mw.creator_set_visibility = ");
      query_builder.push_bind(Visibility::Public.to_str());
    }
  }

  if let Some(weight_types) = maybe_scoped_weight_types {
    // NB: `WHERE IN` comma separated syntax will be wrong if list has zero length
    // We'll skip the predicate if the list isn't empty.
    if !weight_types.is_empty() {
      if !first_predicate_added {
        query_builder.push(" WHERE ");
        first_predicate_added = true;
      } else {
        query_builder.push(" AND ");
      }
      query_builder.push(" mw.weights_type IN ( ");
      let mut separated = query_builder.separated(", ");
      for weight_type in weight_types.iter() {
        separated.push_bind(weight_type.to_str());
      }
      separated.push_unseparated(") ");
    }
  }

  if let Some(weight_categories) = maybe_scoped_weight_categories {
    // NB: `WHERE IN` comma separated syntax will be wrong if list has zero length
    // We'll skip the predicate if the list isn't empty.
    if !weight_categories.is_empty() {
      if !first_predicate_added {
        query_builder.push(" WHERE ");
        first_predicate_added = true;
      } else {
        query_builder.push(" AND ");
      }
      query_builder.push(" mw.weights_category IN ( ");
      let mut separated = query_builder.separated(", ");
      for weights_category in weight_categories.iter() {
        separated.push_bind(weights_category.to_str());
      }
      separated.push_unseparated(") ");
    }
  }

  if let Some(offset) = maybe_offset {
    if !first_predicate_added {
      query_builder.push(" WHERE ");
      first_predicate_added = true;
    } else {
      query_builder.push(" AND ");
    }

    let mut sort_ascending = sort_ascending;

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

  query_builder
}

async fn map_to_weights(dataset:Vec<RawWeightJoinUser>) -> Vec<FeaturedWeight> {
  let weights: Vec<FeaturedWeight> = dataset
      .into_iter()
      .map(|weight: RawWeightJoinUser| {
        FeaturedWeight {
          token: weight.token,
          title: weight.title,
          weights_type: weight.weights_type,
          weights_category: weight.weights_category,

          maybe_ietf_language_tag: weight.maybe_ietf_language_tag,
          maybe_ietf_primary_language_subtag: weight.maybe_ietf_primary_language_subtag,

          maybe_creator_user_token: weight.maybe_creator_user_token,
          maybe_creator_username: weight.maybe_creator_username,
          maybe_creator_display_name: weight.maybe_creator_display_name,
          maybe_creator_email_gravatar_hash: weight.maybe_creator_email_gravatar_hash,

          creator_ip_address: weight.creator_ip_address,
          creator_set_visibility: weight.creator_set_visibility,

          maybe_last_update_user_token: weight.maybe_last_update_user_token,
          original_download_url: weight.original_download_url,
          original_filename: weight.original_filename,
          file_size_bytes: weight.file_size_bytes,
          file_checksum_sha2: weight.file_checksum_sha2,
          public_bucket_hash: weight.public_bucket_hash,
          maybe_public_bucket_prefix: weight.maybe_public_bucket_prefix,
          maybe_public_bucket_extension: weight.maybe_public_bucket_extension,

          maybe_cover_image_public_bucket_hash: weight.maybe_cover_image_public_bucket_hash,
          maybe_cover_image_public_bucket_prefix: weight.maybe_cover_image_public_bucket_prefix,
          maybe_cover_image_public_bucket_extension: weight.maybe_cover_image_public_bucket_extension,

          maybe_ratings_positive_count: weight.maybe_ratings_positive_count,
          maybe_ratings_negative_count: weight.maybe_ratings_negative_count,
          maybe_bookmark_count: weight.maybe_bookmark_count,
          cached_usage_count: weight.cached_usage_count,

          version: weight.version,
          created_at: weight.created_at,
          updated_at: weight.updated_at,
          user_deleted_at: weight.user_deleted_at,
          mod_deleted_at: weight.mod_deleted_at,
        }
      }).collect();
  weights
}

struct RawWeightJoinUser {
  id: i64,
  token: ModelWeightToken,

  weights_type: WeightsType,
  weights_category: WeightsCategory,

  title: String,

  maybe_ietf_language_tag: Option<String>,
  maybe_ietf_primary_language_subtag: Option<String>,

  // TODO(bt,2023-12-24): These aren't really appropriate for a list endpoint.
  //  Hopefully we don't break the frontend by omitting these.
  //pub description_markdown: String,
  //pub description_rendered_html: String,

  maybe_creator_user_token: Option<UserToken>,
  maybe_creator_username: Option<String>,
  maybe_creator_display_name: Option<String>,
  maybe_creator_email_gravatar_hash: Option<String>,

  creator_ip_address: String,
  creator_set_visibility: Visibility,

  maybe_last_update_user_token: Option<UserToken>,

  original_download_url: Option<String>,
  original_filename: Option<String>,

  file_size_bytes: i32,
  file_checksum_sha2: String,

  public_bucket_hash: String,
  maybe_public_bucket_prefix: Option<String>,
  maybe_public_bucket_extension: Option<String>,
  cached_usage_count: u64,

  maybe_cover_image_public_bucket_hash: Option<String>,
  maybe_cover_image_public_bucket_prefix: Option<String>,
  maybe_cover_image_public_bucket_extension: Option<String>,

  maybe_ratings_positive_count: Option<u32>,
  maybe_ratings_negative_count: Option<u32>,
  maybe_bookmark_count: Option<u32>,

  version: i32,

  created_at: DateTime<Utc>,
  updated_at: DateTime<Utc>,

  user_deleted_at: Option<DateTime<Utc>>,
  mod_deleted_at: Option<DateTime<Utc>>,
}

impl FromRow<'_, MySqlRow> for RawWeightJoinUser {
    fn from_row(row: &MySqlRow) -> Result<Self, sqlx::Error> {
        Ok(Self {
            id: row.try_get("id")?,
            token: row.try_get("token")?,
            weights_type: row.try_get("weights_type")?,
            weights_category: row.try_get("weights_category")?,
            title: row.try_get("title")?,
            maybe_ietf_language_tag: row.try_get("maybe_ietf_language_tag")?,
            maybe_ietf_primary_language_subtag: row.try_get("maybe_ietf_primary_language_subtag")?,
            // TODO(bt,2023-12-24): These aren't really appropriate for a list endpoint.
            //  Hopefully we don't break the frontend by omitting these.
            //maybe_description_markdown: row.try_get("maybe_description_markdown")?,
            //maybe_description_rendered_html: row.try_get("maybe_description_rendered_html")?,
            maybe_creator_user_token: row.try_get("maybe_creator_user_token")?,
            maybe_creator_username: row.try_get("maybe_creator_username")?,
            maybe_creator_display_name: row.try_get("maybe_creator_display_name")?,
            maybe_creator_email_gravatar_hash: row.try_get("maybe_creator_email_gravatar_hash")?,
            creator_ip_address: row.try_get("creator_ip_address")?,
            creator_set_visibility: Visibility::try_from_mysql_row(row, "creator_set_visibility")?,
            maybe_last_update_user_token: row.try_get("maybe_last_update_user_token")?,
            original_download_url: row.try_get("original_download_url")?,
            original_filename: row.try_get("original_filename")?,
            file_size_bytes: row.try_get("file_size_bytes")?,
            file_checksum_sha2: row.try_get("file_checksum_sha2")?,
            public_bucket_hash: row.try_get("public_bucket_hash")?,
            maybe_public_bucket_prefix: row.try_get("maybe_public_bucket_prefix")?,
            maybe_public_bucket_extension: row.try_get("maybe_public_bucket_extension")?,
            cached_usage_count: row.try_get("cached_usage_count")?,
            maybe_cover_image_public_bucket_hash: row.try_get("maybe_cover_image_public_bucket_hash")?,
            maybe_cover_image_public_bucket_prefix: row.try_get("maybe_cover_image_public_bucket_prefix")?,
            maybe_cover_image_public_bucket_extension: row.try_get("maybe_cover_image_public_bucket_extension")?,
            maybe_ratings_positive_count: row.try_get("maybe_ratings_positive_count")?,
            maybe_ratings_negative_count: row.try_get("maybe_ratings_negative_count")?,
            maybe_bookmark_count: row.try_get("maybe_bookmark_count")?,
            version: row.try_get("version")?,
            created_at: row.try_get("created_at")?,
            updated_at: row.try_get("updated_at")?,
            user_deleted_at: row.try_get("user_deleted_at")?,
            mod_deleted_at: row.try_get("mod_deleted_at")?,
        })
    }
}