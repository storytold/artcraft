use chrono::{DateTime, Utc};
use enums::traits::mysql_from_row::MySqlFromRow as _;
use sqlx::{Acquire, FromRow, MySql, MySqlConnection, MySqlPool, QueryBuilder, Row};
use sqlx::mysql::MySqlRow;

use enums::by_table::model_weights::{
  weights_category::WeightsCategory,
  weights_types::WeightsType,
};
use errors::AnyhowResult;
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::users::UserToken;

#[derive(Serialize)]
pub struct WeightsByTokensRecord {
  pub token: ModelWeightToken,

  pub weights_type: WeightsType,
  pub weights_category: WeightsCategory,

  pub title: String,

  pub maybe_ietf_language_tag: Option<String>,
  pub maybe_ietf_primary_language_subtag: Option<String>,

  pub creator_user_token: UserToken,
  pub creator_username: String,
  pub creator_display_name: String,
  pub creator_email_gravatar_hash: String,

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

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
  pub user_deleted_at: Option<DateTime<Utc>>,
  pub mod_deleted_at: Option<DateTime<Utc>>,
}

pub async fn list_weights_by_tokens(
  mysql_pool: &MySqlPool,
  weight_tokens: &[ModelWeightToken],
  can_see_deleted: bool
) -> AnyhowResult<Vec<WeightsByTokensRecord>> {

  let mut connection = mysql_pool.acquire().await?;

  let raw_weights: Vec<RawWeightJoinUser> = get_raw_weights_by_tokens(&mut connection, weight_tokens, can_see_deleted).await?;

  Ok(map_to_weights(raw_weights))
}

async fn get_raw_weights_by_tokens(
  connection: &mut MySqlConnection,
  weight_tokens: &[ModelWeightToken],
  can_see_deleted: bool
) -> AnyhowResult<Vec<RawWeightJoinUser>> {

  let connection = connection.acquire().await?;

  let mut query_builder : QueryBuilder<MySql> = if can_see_deleted {
    QueryBuilder::new(r#"
      SELECT
          mw.token,
          mw.title,
          mw.weights_type,
          mw.weights_category,
          mw.maybe_ietf_language_tag,
          mw.maybe_ietf_primary_language_subtag,
          users.token as creator_user_token,
          users.username as creator_username,
          users.display_name as creator_display_name,
          users.email_gravatar_hash as creator_email_gravatar_hash,
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
          mw.created_at,
          mw.updated_at,
          mw.user_deleted_at,
          mw.mod_deleted_at
      FROM model_weights as mw
      JOIN users
          ON users.token = mw.creator_user_token
      LEFT OUTER JOIN media_files as cover_image
          ON cover_image.token = mw.maybe_cover_image_media_file_token
      LEFT OUTER JOIN entity_stats
          ON entity_stats.entity_type = "model_weights"
          AND entity_stats.entity_token = mw.token
      WHERE
          mw.creator_set_visibility = "public"
          AND mw.token IN (
      "#,
    )

  } else {
    QueryBuilder::new(r#"
      SELECT
          mw.token,
          mw.title,
          mw.weights_type,
          mw.weights_category,
          mw.maybe_ietf_language_tag,
          mw.maybe_ietf_primary_language_subtag,
          users.token as creator_user_token,
          users.username as creator_username,
          users.display_name as creator_display_name,
          users.email_gravatar_hash as creator_email_gravatar_hash,
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
          mw.created_at,
          mw.updated_at,
          mw.user_deleted_at,
          mw.mod_deleted_at
      FROM model_weights as mw
      JOIN users
          ON users.token = mw.creator_user_token
      LEFT OUTER JOIN media_files as cover_image
          ON cover_image.token = mw.maybe_cover_image_media_file_token
      LEFT OUTER JOIN entity_stats
          ON entity_stats.entity_type = "model_weights"
          AND entity_stats.entity_token = mw.token
      WHERE
          mw.creator_set_visibility = "public"
          AND mw.user_deleted_at IS NULL
          AND mw.mod_deleted_at IS NULL
          AND mw.token IN (
      "#
    )
  };

  query_builder.push(token_predicate(weight_tokens));

  query_builder.push(")");

  let query = query_builder.build_query_as::<RawWeightJoinUser>();

  let results = query.fetch_all(connection).await?;

  Ok(results)
}

/// Return a comma-separated predicate, since SQLx does not yet support WHERE IN(?) for Vec<T>, etc.
/// Issue: https://github.com/launchbadge/sqlx/issues/875
fn token_predicate(tokens: &[ModelWeightToken]) -> String {
  tokens.iter()
      .map(|ty| ty.as_str())
      .map(|ty| format!("\"{}\"", ty))
      .collect::<Vec<String>>()
      .join(", ")
}

fn map_to_weights(dataset:Vec<RawWeightJoinUser>) -> Vec<WeightsByTokensRecord> {
  let weights: Vec<WeightsByTokensRecord> = dataset
      .into_iter()
      .map(|weight| {
        WeightsByTokensRecord {
          token: weight.token,
          title: weight.title,
          weights_type: weight.weights_type,
          weights_category: weight.weights_category,

          maybe_ietf_language_tag: weight.maybe_ietf_language_tag,
          maybe_ietf_primary_language_subtag: weight.maybe_ietf_primary_language_subtag,

          creator_user_token: weight.creator_user_token,
          creator_username: weight.creator_username,
          creator_display_name: weight.creator_display_name,
          creator_email_gravatar_hash: weight.creator_email_gravatar_hash,

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

          created_at: weight.created_at,
          updated_at: weight.updated_at,
          user_deleted_at: weight.user_deleted_at,
          mod_deleted_at: weight.mod_deleted_at,
        }
      }).collect();

  weights
}

#[derive(Serialize)]
struct RawWeightJoinUser {
  token: ModelWeightToken,

  weights_type: WeightsType,
  weights_category: WeightsCategory,

  title: String,

  maybe_ietf_language_tag: Option<String>,
  maybe_ietf_primary_language_subtag: Option<String>,

  creator_user_token: UserToken,
  creator_username: String,
  creator_display_name: String,
  creator_email_gravatar_hash: String,

  public_bucket_hash: String,
  maybe_public_bucket_prefix: Option<String>,
  maybe_public_bucket_extension: Option<String>,

  maybe_cover_image_public_bucket_hash: Option<String>,
  maybe_cover_image_public_bucket_prefix: Option<String>,
  maybe_cover_image_public_bucket_extension: Option<String>,

  maybe_ratings_positive_count: Option<u32>,
  maybe_ratings_negative_count: Option<u32>,
  maybe_bookmark_count: Option<u32>,
  cached_usage_count: u64,

  created_at: DateTime<Utc>,
  updated_at: DateTime<Utc>,
  user_deleted_at: Option<DateTime<Utc>>,
  mod_deleted_at: Option<DateTime<Utc>>,
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
impl FromRow<'_, MySqlRow> for RawWeightJoinUser {
  fn from_row(row: &MySqlRow) -> Result<Self, sqlx::Error> {
    Ok(Self {
      token: ModelWeightToken::new(row.try_get("token")?),
      weights_type: WeightsType::try_from_mysql_row(row, "weights_type")?,
      weights_category: WeightsCategory::try_from_mysql_row(row, "weights_category")?,
      title: row.try_get("title")?,
      maybe_ietf_language_tag: row.try_get("maybe_ietf_language_tag")?,
      maybe_ietf_primary_language_subtag: row.try_get("maybe_ietf_primary_language_subtag")?,
      creator_user_token: UserToken::new_from_str(row.try_get("creator_user_token")?),
      creator_username: row.try_get("creator_username")?,
      creator_display_name: row.try_get("creator_display_name")?,
      creator_email_gravatar_hash: row.try_get("creator_email_gravatar_hash")?,
      public_bucket_hash: row.try_get("public_bucket_hash")?,
      maybe_public_bucket_prefix: row.try_get("maybe_public_bucket_prefix")?,
      maybe_public_bucket_extension: row.try_get("maybe_public_bucket_extension")?,
      maybe_cover_image_public_bucket_hash: row.try_get("maybe_cover_image_public_bucket_hash")?,
      maybe_cover_image_public_bucket_prefix: row.try_get("maybe_cover_image_public_bucket_prefix")?,
      maybe_cover_image_public_bucket_extension: row.try_get("maybe_cover_image_public_bucket_extension")?,
      maybe_ratings_positive_count: row.try_get("maybe_ratings_positive_count")?,
      maybe_ratings_negative_count: row.try_get("maybe_ratings_negative_count")?,
      maybe_bookmark_count: row.try_get("maybe_bookmark_count")?,
      cached_usage_count: row.try_get("cached_usage_count")?,
      created_at: row.try_get("created_at")?,
      updated_at: row.try_get("updated_at")?,
      user_deleted_at: row.try_get("user_deleted_at")?,
      mod_deleted_at: row.try_get("mod_deleted_at")?,
    })
  }
}
