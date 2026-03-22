use anyhow::anyhow;
use chrono::{DateTime, NaiveDateTime, Utc};
use log::warn;
use sqlx::{Executor, FromRow, MySql, QueryBuilder, Row};
use sqlx::mysql::MySqlRow;

use enums::by_table::model_weights::weights_category::WeightsCategory;
use enums::traits::mysql_from_row::MySqlFromRow as _;
use enums::by_table::model_weights::weights_types::WeightsType;
use enums::common::visibility::Visibility;
use errors::AnyhowResult;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::users::UserToken;
use crate::helpers::boolean_converters::i64_to_bool;

/// This is meant to be the entire table
#[derive(Debug)]
pub struct ModelWeightForElasticsearchRecord {
  pub id: i64,
  pub token: ModelWeightToken,

  pub creator_set_visibility: Visibility,

  pub weights_type: WeightsType,
  pub weights_category: WeightsCategory,

  pub title: String,

  // NB: These language tags are built into the `model_weights` table.
  pub maybe_ietf_language_tag: Option<String>,
  pub maybe_ietf_primary_language_subtag: Option<String>,

  // Cover images
  pub maybe_cover_image_media_file_token: Option<MediaFileToken>,
  pub maybe_cover_image_public_bucket_hash: Option<String>,
  pub maybe_cover_image_public_bucket_prefix: Option<String>,
  pub maybe_cover_image_public_bucket_extension: Option<String>,

  // Creator
  pub creator_user_token: UserToken,
  pub creator_username: String,
  pub creator_display_name: String,
  pub creator_gravatar_hash: String,

  // Featured state
  pub is_featured: bool,

  // Statistics
  pub maybe_ratings_positive_count: Option<u32>,
  pub maybe_ratings_negative_count: Option<u32>,
  pub maybe_bookmark_count: Option<u32>,
  pub cached_usage_count: u64,

  // TTS extensions
  #[deprecated(note="use the fields built into the model_weights table rather than in the join table")]
  pub maybe_tts_ietf_language_tag: Option<String>,
  #[deprecated(note="use the fields built into the model_weights table rather than in the join table")]
  pub maybe_tts_ietf_primary_language_subtag: Option<String>,

  // VC extensions
  #[deprecated(note="use the fields built into the model_weights table rather than in the join table")]
  pub maybe_voice_conversion_ietf_language_tag: Option<String>,
  #[deprecated(note="use the fields built into the model_weights table rather than in the join table")]
  pub maybe_voice_conversion_ietf_primary_language_subtag: Option<String>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,

  pub user_deleted_at: Option<DateTime<Utc>>,
  pub mod_deleted_at: Option<DateTime<Utc>>,

  pub database_read_time: DateTime<Utc>,
}

pub async fn batch_get_model_weights_for_elastic_search_backfill<'e, 'c, E>(
  mysql_executor: E,
  tokens: &Vec<ModelWeightToken>,
) -> AnyhowResult<Vec<ModelWeightForElasticsearchRecord>>
  where E: 'e + Executor<'c, Database=MySql>
{
  if tokens.is_empty() {
    // NB: We should always eagerly return, but if we don't, the query builder will build an
    // invalid query.
    return Ok(Vec::new());
  }

  let maybe_models
      = list_model_weights(mysql_executor, tokens)
      .await;

  let models : Vec<RawRecord> = match maybe_models {
    Ok(models) => models,
    Err(sqlx::error::Error::RowNotFound) => return Ok(Vec::new()),
    Err(err) => {
      warn!("model weight list query error: {:?}", err);
      return Err(anyhow!("model weight list query error"));
    }
  };

  Ok(models.into_iter()
      .map(|model| {
        ModelWeightForElasticsearchRecord {
          id: model.id,
          token: model.token,
          title: model.title,
          weights_type: model.weights_type,
          weights_category: model.weights_category,
          maybe_ietf_language_tag: model.maybe_ietf_language_tag,
          maybe_ietf_primary_language_subtag: model.maybe_ietf_primary_language_subtag,
          maybe_cover_image_media_file_token: model.maybe_cover_image_media_file_token,
          maybe_cover_image_public_bucket_hash: model.maybe_cover_image_public_bucket_hash,
          maybe_cover_image_public_bucket_prefix: model.maybe_cover_image_public_bucket_prefix,
          maybe_cover_image_public_bucket_extension: model.maybe_cover_image_public_bucket_extension,
          creator_user_token: model.creator_user_token,
          creator_username: model.creator_username,
          creator_display_name: model.creator_display_name,
          creator_gravatar_hash: model.creator_gravatar_hash,
          is_featured: i64_to_bool(model.is_featured),
          maybe_tts_ietf_language_tag: model.maybe_tts_ietf_language_tag,
          maybe_tts_ietf_primary_language_subtag: model.maybe_tts_ietf_primary_language_subtag,
          maybe_voice_conversion_ietf_language_tag: model.maybe_vc_ietf_language_tag,
          maybe_voice_conversion_ietf_primary_language_subtag: model.maybe_vc_ietf_primary_language_subtag,
          maybe_ratings_positive_count: model.maybe_ratings_positive_count,
          maybe_ratings_negative_count: model.maybe_ratings_negative_count,
          maybe_bookmark_count: model.maybe_bookmark_count,
          cached_usage_count: model.cached_usage_count,
          creator_set_visibility: model.creator_set_visibility,
          created_at: model.created_at,
          updated_at: model.updated_at,
          user_deleted_at: model.user_deleted_at,
          mod_deleted_at: model.mod_deleted_at,
          database_read_time: model.database_read_time.and_utc(),
        }
      })
      .collect::<Vec<ModelWeightForElasticsearchRecord>>())
}

async fn list_model_weights<'e, 'c, E>(
  mysql_executor: E,
  tokens: &Vec<ModelWeightToken>,
) -> Result<Vec<RawRecord>, sqlx::Error>
  where E: 'e + Executor<'c, Database=MySql>
{
  if tokens.len() == 0 {
    return Ok(Vec::new());
  }

  let mut query_builder: QueryBuilder<MySql> = QueryBuilder::new(
        r#"
SELECT
    w.id,
    w.token,

    w.creator_set_visibility,

    w.weights_type,
    w.weights_category,

    w.title,

    w.maybe_ietf_language_tag,
    w.maybe_ietf_primary_language_subtag,

    cover_image.token as maybe_cover_image_media_file_token,
    cover_image.public_bucket_directory_hash as maybe_cover_image_public_bucket_hash,
    cover_image.maybe_public_bucket_prefix as maybe_cover_image_public_bucket_prefix,
    cover_image.maybe_public_bucket_extension as maybe_cover_image_public_bucket_extension,

    w.creator_user_token,
    users.username as creator_username,
    users.display_name as creator_display_name,
    users.email_gravatar_hash as creator_gravatar_hash,

    featured_items.entity_token IS NOT NULL AS is_featured,

    entity_stats.ratings_positive_count as maybe_ratings_positive_count,
    entity_stats.ratings_negative_count as maybe_ratings_negative_count,
    entity_stats.bookmark_count as maybe_bookmark_count,

    w.cached_usage_count,

    extension_tts.ietf_language_tag as maybe_tts_ietf_language_tag,
    extension_tts.ietf_primary_language_subtag as maybe_tts_ietf_primary_language_subtag,

    extension_vc.ietf_language_tag as maybe_vc_ietf_language_tag,
    extension_vc.ietf_primary_language_subtag as maybe_vc_ietf_primary_language_subtag,

    w.created_at,
    w.updated_at,
    w.user_deleted_at,
    w.mod_deleted_at,

    NOW() as database_read_time

FROM model_weights as w

JOIN users
    ON users.token = w.creator_user_token

LEFT OUTER JOIN model_weights_extension_tts_details as extension_tts
    ON extension_tts.model_weights_token = w.token
LEFT OUTER JOIN model_weights_extension_voice_conversion_details as extension_vc
    ON extension_vc.model_weights_token = w.token
LEFT OUTER JOIN entity_stats
    ON entity_stats.entity_type = "model_weight"
    AND entity_stats.entity_token = w.token
LEFT OUTER JOIN media_files as cover_image
    ON cover_image.token = w.maybe_cover_image_media_file_token
LEFT OUTER JOIN featured_items
    ON featured_items.entity_type = "model_weight"
    AND featured_items.entity_token = w.token
    AND featured_items.deleted_at IS NULL

WHERE w.token IN (
        "#);

  // NB: Syntax will be wrong if list has zero length
  let mut separated = query_builder.separated(", ");

  for token in tokens.iter() {
    separated.push_bind(token.as_str());
  }

  separated.push_unseparated(") ");

  // NB: We should return the most recent update timestamp last (for cursoring)
  query_builder.push(" ORDER BY w.updated_at ASC, w.id ASC ");

  let query = query_builder.build_query_as::<RawRecord>();

  let maybe_results = query.fetch_all(mysql_executor).await?;

  Ok(maybe_results)
}

struct RawRecord {
  pub id: i64,
  pub token: ModelWeightToken,

  pub creator_set_visibility: Visibility,

  pub weights_type: WeightsType,
  pub weights_category: WeightsCategory,

  pub title: String,

  // NB: These language tags are built into the `model_weights` table.
  pub maybe_ietf_language_tag: Option<String>,
  pub maybe_ietf_primary_language_subtag: Option<String>,

  // Cover images
  pub maybe_cover_image_media_file_token: Option<MediaFileToken>,
  pub maybe_cover_image_public_bucket_hash: Option<String>,
  pub maybe_cover_image_public_bucket_prefix: Option<String>,
  pub maybe_cover_image_public_bucket_extension: Option<String>,

  // Creator
  pub creator_user_token: UserToken,
  pub creator_username: String,
  pub creator_display_name: String,
  pub creator_gravatar_hash: String,

  // Featured state
  pub is_featured: i64,

  // Statistics
  pub maybe_ratings_positive_count: Option<u32>,
  pub maybe_ratings_negative_count: Option<u32>,
  pub maybe_bookmark_count: Option<u32>,
  pub cached_usage_count: u64,

  // TTS extensions
  #[deprecated(note="use the fields built into the model_weights table rather than in the join table")]
  pub maybe_tts_ietf_language_tag: Option<String>,
  #[deprecated(note="use the fields built into the model_weights table rather than in the join table")]
  pub maybe_tts_ietf_primary_language_subtag: Option<String>,

  // Voice conversion extensions
  #[deprecated(note="use the fields built into the model_weights table rather than in the join table")]
  pub maybe_vc_ietf_language_tag: Option<String>,
  #[deprecated(note="use the fields built into the model_weights table rather than in the join table")]
  pub maybe_vc_ietf_primary_language_subtag: Option<String>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,

  pub user_deleted_at: Option<DateTime<Utc>>,
  pub mod_deleted_at: Option<DateTime<Utc>>,

  pub database_read_time: NaiveDateTime,
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
impl FromRow<'_, MySqlRow> for RawRecord {
  fn from_row(row: &MySqlRow) -> Result<Self, sqlx::Error> {
    // NB(bt): Not sure why IDE is complaining about inlining this with the call to map() below.
    let maybe_cover_image_media_file_token: Option<String> = row.try_get("maybe_cover_image_media_file_token")?;

    Ok(Self {
      id: row.try_get("id")?,
      token: ModelWeightToken::new(row.try_get("token")?),

      creator_set_visibility: Visibility::try_from_mysql_row(row, "creator_set_visibility")?,

      weights_type: WeightsType::try_from_mysql_row(row, "weights_type")?,
      weights_category: WeightsCategory::try_from_mysql_row(row, "weights_category")?,

      title: row.try_get("title")?,

      maybe_ietf_language_tag: row.try_get("maybe_ietf_language_tag")?,
      maybe_ietf_primary_language_subtag: row.try_get("maybe_ietf_primary_language_subtag")?,

      maybe_cover_image_media_file_token: maybe_cover_image_media_file_token.map(|token| MediaFileToken::new(token)),
      maybe_cover_image_public_bucket_hash: row.try_get("maybe_cover_image_public_bucket_hash")?,
      maybe_cover_image_public_bucket_prefix: row.try_get("maybe_cover_image_public_bucket_prefix")?,
      maybe_cover_image_public_bucket_extension: row.try_get("maybe_cover_image_public_bucket_extension")?,

      creator_user_token: UserToken::new(row.try_get("creator_user_token")?),
      creator_username: row.try_get("creator_username")?,
      creator_display_name: row.try_get("creator_display_name")?,
      creator_gravatar_hash: row.try_get("creator_gravatar_hash")?,

      is_featured: row.try_get("is_featured")?,

      maybe_ratings_positive_count: row.try_get("maybe_ratings_positive_count")?,
      maybe_ratings_negative_count: row.try_get("maybe_ratings_negative_count")?,
      maybe_bookmark_count: row.try_get("maybe_bookmark_count")?,

      cached_usage_count: row.try_get("cached_usage_count")?,

      maybe_tts_ietf_language_tag: row.try_get("maybe_tts_ietf_language_tag")?,
      maybe_tts_ietf_primary_language_subtag: row.try_get("maybe_tts_ietf_primary_language_subtag")?,

      maybe_vc_ietf_language_tag: row.try_get("maybe_vc_ietf_language_tag")?,
      maybe_vc_ietf_primary_language_subtag: row.try_get("maybe_vc_ietf_primary_language_subtag")?,

      created_at: row.try_get("created_at")?,
      updated_at: row.try_get("updated_at")?,
      user_deleted_at: row.try_get("user_deleted_at")?,
      mod_deleted_at: row.try_get("mod_deleted_at")?,
      database_read_time: row.try_get("database_read_time")?,
    })
  }
}
