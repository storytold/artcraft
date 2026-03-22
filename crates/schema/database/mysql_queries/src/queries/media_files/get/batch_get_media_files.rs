// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use anyhow::anyhow;
use chrono::{DateTime, Utc};
use sqlx::{FromRow, MySql, MySqlPool, QueryBuilder, Row};
use sqlx::mysql::MySqlRow;

use enums::by_table::media_files::media_file_animation_type::MediaFileAnimationType;
use enums::traits::mysql_from_row::MySqlFromRow as _;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_engine_category::MediaFileEngineCategory;
use enums::by_table::media_files::media_file_subtype::MediaFileSubtype;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::by_table::model_weights::weights_category::WeightsCategory;
use enums::by_table::model_weights::weights_types::WeightsType;
use enums::common::visibility::Visibility;
use errors::AnyhowResult;
use tokens::tokens::batch_generations::BatchGenerationToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::prompts::PromptToken;
use tokens::tokens::users::UserToken;
use tokens::traits::mysql_token_from_row::MySqlTokenFromRow;
use crate::helpers::boolean_converters::i8_to_bool;
use crate::payloads::media_file_extra_info::media_file_extra_info::MediaFileExtraInfo;
use crate::payloads::prompt_args::prompt_inner_payload::PromptInnerPayload;

#[derive(Serialize, Debug)]
pub struct MediaFile {
  pub token: MediaFileToken,

  pub media_class: MediaFileClass,
  pub media_type: MediaFileType,

  pub maybe_engine_category: Option<MediaFileEngineCategory>,
  pub maybe_animation_type: Option<MediaFileAnimationType>,

  pub maybe_media_subtype: Option<MediaFileSubtype>,

  // TODO: Bucket hash bits.

  // TODO: Other media details (file size, mime type, dimensions, duration, etc.)
  // TODO: Provenance data (product, upload vs inference, model details and foreign keys)

  pub maybe_batch_token: Option<BatchGenerationToken>,

  pub maybe_title: Option<String>,
  pub maybe_text_transcript: Option<String>,

  pub maybe_origin_filename: Option<String>,

  pub maybe_duration_millis : Option<u64>,

  pub maybe_creator_user_token: Option<UserToken>,
  pub maybe_creator_username: Option<String>,
  pub maybe_creator_display_name: Option<String>,
  pub maybe_creator_gravatar_hash: Option<String>,

  pub creator_set_visibility: Visibility,

  pub is_user_upload: bool,
  pub is_intermediate_system_file: bool,

  pub maybe_prompt_token: Option<PromptToken>,
  pub maybe_prompt_args: Option<PromptInnerPayload>,

  pub maybe_file_cover_image_public_bucket_hash: Option<String>,
  pub maybe_file_cover_image_public_bucket_prefix: Option<String>,
  pub maybe_file_cover_image_public_bucket_extension: Option<String>,

  pub maybe_model_weights_token: Option<ModelWeightToken>,
  pub maybe_model_weights_title: Option<String>,
  pub maybe_model_weights_type: Option<WeightsType>,
  pub maybe_model_weights_category: Option<WeightsCategory>,

  pub maybe_model_cover_image_public_bucket_hash: Option<String>,
  pub maybe_model_cover_image_public_bucket_prefix: Option<String>,
  pub maybe_model_cover_image_public_bucket_extension: Option<String>,

  pub maybe_model_weight_creator_user_token: Option<UserToken>,
  pub maybe_model_weight_creator_username: Option<String>,
  pub maybe_model_weight_creator_display_name: Option<String>,
  pub maybe_model_weight_creator_gravatar_hash: Option<String>,

  /// Not all files have extra info.
  /// This is a polymorphic JSON blob that gets hydrated into structs.
  pub extra_media_file_info: Option<MediaFileExtraInfo>,

  pub public_bucket_directory_hash: String,
  pub maybe_public_bucket_prefix: Option<String>,
  pub maybe_public_bucket_extension: Option<String>,

  pub maybe_ratings_positive_count: Option<u32>,
  pub maybe_ratings_negative_count: Option<u32>,
  pub maybe_bookmark_count: Option<u32>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,

  // pub maybe_moderator_fields: Option<MediaFileModeratorFields>,
}

// /// "Moderator-only fields" that we wouldn't want to expose to ordinary users.
// /// It's the web endpoint controller's responsibility to clear these for non-mods.
// #[derive(Serialize)]
// pub struct MediaFileModeratorFields {
//   pub model_creator_is_banned: bool,
//   pub result_creator_is_banned_if_user: bool,
//   pub result_creator_ip_address: String,
//   pub result_creator_deleted_at: Option<DateTime<Utc>>,
//   pub mod_deleted_at: Option<DateTime<Utc>>,
//   pub maybe_mod_user_token: Option<String>,
// }

#[derive(Serialize)]
pub struct MediaFileRaw {
  pub token: MediaFileToken,

  pub media_class: MediaFileClass,
  pub media_type: MediaFileType,

  pub maybe_engine_category: Option<MediaFileEngineCategory>,
  pub maybe_animation_type: Option<MediaFileAnimationType>,

  pub maybe_media_subtype: Option<MediaFileSubtype>,

  // TODO: Bucket hash bits.

  pub maybe_batch_token: Option<BatchGenerationToken>,

  pub maybe_title: Option<String>,
  pub maybe_text_transcript: Option<String>,

  pub maybe_origin_filename: Option<String>,

  pub maybe_duration_millis : Option<i32>,

  pub maybe_creator_user_token: Option<UserToken>,
  pub maybe_creator_username: Option<String>,
  pub maybe_creator_display_name: Option<String>,
  pub maybe_creator_gravatar_hash: Option<String>,

  pub creator_set_visibility: Visibility,

  pub is_user_upload: i8,
  pub is_intermediate_system_file: i8,

  pub maybe_prompt_token: Option<PromptToken>,
  pub maybe_other_prompt_args: Option<String>,

  pub maybe_file_cover_image_public_bucket_hash: Option<String>,
  pub maybe_file_cover_image_public_bucket_prefix: Option<String>,
  pub maybe_file_cover_image_public_bucket_extension: Option<String>,

  pub maybe_model_weights_token: Option<ModelWeightToken>,
  pub maybe_model_weights_title: Option<String>,
  pub maybe_model_weights_type: Option<WeightsType>,
  pub maybe_model_weights_category: Option<WeightsCategory>,

  pub maybe_model_cover_image_public_bucket_hash: Option<String>,
  pub maybe_model_cover_image_public_bucket_prefix: Option<String>,
  pub maybe_model_cover_image_public_bucket_extension: Option<String>,

  pub maybe_model_weight_creator_user_token: Option<UserToken>,
  pub maybe_model_weight_creator_username: Option<String>,
  pub maybe_model_weight_creator_display_name: Option<String>,
  pub maybe_model_weight_creator_gravatar_hash: Option<String>,

  pub extra_file_modification_info: Option<String>,

  pub public_bucket_directory_hash: String,
  pub maybe_public_bucket_prefix: Option<String>,
  pub maybe_public_bucket_extension: Option<String>,

  //pub model_is_mod_approved: bool, // converted
  //pub maybe_mod_user_token: Option<String>,

  pub maybe_ratings_positive_count: Option<u32>,
  pub maybe_ratings_negative_count: Option<u32>,
  pub maybe_bookmark_count: Option<u32>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

pub async fn batch_get_media_files(
  media_file_tokens: &[MediaFileToken],
  can_see_deleted: bool,
  mysql_pool: &MySqlPool
) -> AnyhowResult<Vec<MediaFile>> {

  if media_file_tokens.is_empty() {
    // NB: We should always eagerly return, but if we don't, the query builder will build an
    // invalid query.
    return Ok(Vec::new());
  }

  let mut query_builder : QueryBuilder<MySql> = make_query_builder();

  query_builder.push(" WHERE m.token IN ( ");

  let mut separated = query_builder.separated(", ");

  for media_token in media_file_tokens {
    separated.push_bind(media_token.to_string());
  }

  separated.push_unseparated(") ");

  if !can_see_deleted {
    query_builder.push(" AND m.mod_deleted_at IS NULL ");
    query_builder.push(" AND m.user_deleted_at IS NULL ");
  }

  let query = query_builder.build_query_as::<MediaFileRaw>();

  let query_results = query.fetch_all(mysql_pool).await;

  let records = match query_results {
    Ok(records) => records,
    Err(ref err) => return match err {
      sqlx::Error::RowNotFound => Ok(Vec::new()),
      _ => Err(anyhow!("database error: {:?}", err)),
    }
  };

  Ok(records.into_iter()
      .map(|record| MediaFile {
        token: record.token,
        media_class: record.media_class,
        media_type: record.media_type,
        maybe_engine_category: record.maybe_engine_category,
        maybe_animation_type: record.maybe_animation_type,
        maybe_media_subtype: record.maybe_media_subtype,
        maybe_batch_token: record.maybe_batch_token,
        maybe_title: record.maybe_title,
        maybe_text_transcript: record.maybe_text_transcript,
        maybe_origin_filename: record.maybe_origin_filename,
        maybe_duration_millis: record.maybe_duration_millis.map(|d| d as u64),
        maybe_creator_user_token: record.maybe_creator_user_token,
        maybe_creator_username: record.maybe_creator_username,
        maybe_creator_display_name: record.maybe_creator_display_name,
        maybe_creator_gravatar_hash: record.maybe_creator_gravatar_hash,
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
        maybe_model_weights_token: record.maybe_model_weights_token,
        maybe_model_weights_title: record.maybe_model_weights_title,
        maybe_model_weights_type: record.maybe_model_weights_type,
        maybe_model_weights_category: record.maybe_model_weights_category,
        maybe_model_cover_image_public_bucket_hash: record.maybe_model_cover_image_public_bucket_hash,
        maybe_model_cover_image_public_bucket_prefix: record.maybe_model_cover_image_public_bucket_prefix,
        maybe_model_cover_image_public_bucket_extension: record.maybe_model_cover_image_public_bucket_extension,
        maybe_model_weight_creator_user_token: record.maybe_model_weight_creator_user_token,
        maybe_model_weight_creator_username: record.maybe_model_weight_creator_username,
        maybe_model_weight_creator_display_name: record.maybe_model_weight_creator_display_name,
        maybe_model_weight_creator_gravatar_hash: record.maybe_model_weight_creator_gravatar_hash,
        extra_media_file_info: record.extra_file_modification_info
            .map(|info| MediaFileExtraInfo::from_json_str(&info).ok())
            .flatten(), // NB: Fail open. Do not fail the query if we can't hydrate the JSON.
        public_bucket_directory_hash: record.public_bucket_directory_hash,
        maybe_public_bucket_prefix: record.maybe_public_bucket_prefix,
        maybe_public_bucket_extension: record.maybe_public_bucket_extension,
        maybe_ratings_positive_count: record.maybe_ratings_positive_count,
        maybe_ratings_negative_count: record.maybe_ratings_negative_count,
        maybe_bookmark_count: record.maybe_bookmark_count,
        created_at: record.created_at,
        updated_at: record.updated_at,
      })
      .collect::<Vec<_>>())
}

fn make_query_builder() -> QueryBuilder<'static, MySql> {
  QueryBuilder::new(r#"
SELECT
    m.token,

    m.media_class,
    m.media_type,

    m.maybe_engine_category,
    m.maybe_animation_type,

    m.maybe_media_subtype,

    users.token as maybe_creator_user_token,
    users.username as maybe_creator_username,
    users.display_name as maybe_creator_display_name,
    users.email_gravatar_hash as maybe_creator_gravatar_hash,

    m.maybe_batch_token,

    m.maybe_title,
    m.maybe_text_transcript,

    m.maybe_origin_filename,

    m.maybe_duration_millis,

    m.maybe_prompt_token,

    media_file_cover_image.public_bucket_directory_hash as maybe_file_cover_image_public_bucket_hash,
    media_file_cover_image.maybe_public_bucket_prefix as maybe_file_cover_image_public_bucket_prefix,
    media_file_cover_image.maybe_public_bucket_extension as maybe_file_cover_image_public_bucket_extension,

    m.creator_set_visibility,

    m.is_user_upload,
    m.is_intermediate_system_file,

    model_weights.token as maybe_model_weights_token,
    model_weights.title as maybe_model_weights_title,
    model_weights.weights_type as maybe_model_weights_type,
    model_weights.weights_category as maybe_model_weights_category,

    model_weight_cover_image.public_bucket_directory_hash as maybe_model_cover_image_public_bucket_hash,
    model_weight_cover_image.maybe_public_bucket_prefix as maybe_model_cover_image_public_bucket_prefix,
    model_weight_cover_image.maybe_public_bucket_extension as maybe_model_cover_image_public_bucket_extension,

    model_weight_creator.token as maybe_model_weight_creator_user_token,
    model_weight_creator.username as maybe_model_weight_creator_username,
    model_weight_creator.display_name as maybe_model_weight_creator_display_name,
    model_weight_creator.email_gravatar_hash as maybe_model_weight_creator_gravatar_hash,

    m.extra_file_modification_info,

    m.public_bucket_directory_hash,
    m.maybe_public_bucket_prefix,
    m.maybe_public_bucket_extension,

    entity_stats.ratings_positive_count as maybe_ratings_positive_count,
    entity_stats.ratings_negative_count as maybe_ratings_negative_count,
    entity_stats.bookmark_count as maybe_bookmark_count,

    m.created_at,
    m.updated_at

FROM media_files AS m
LEFT OUTER JOIN users
    ON m.maybe_creator_user_token = users.token
LEFT OUTER JOIN model_weights
    ON m.maybe_origin_model_token = model_weights.token
LEFT OUTER JOIN media_files as media_file_cover_image
    ON media_file_cover_image.token = m.maybe_cover_image_media_file_token
LEFT OUTER JOIN media_files as model_weight_cover_image
    ON model_weight_cover_image.token = model_weights.maybe_cover_image_media_file_token
LEFT OUTER JOIN users as model_weight_creator
    ON model_weight_creator.token = model_weights.creator_user_token
LEFT OUTER JOIN entity_stats
    ON entity_stats.entity_type = "media_file"
    AND entity_stats.entity_token = m.token
LEFT OUTER JOIN prompts
    ON prompts.token = m.maybe_prompt_token
    "#)
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
impl FromRow<'_, MySqlRow> for MediaFileRaw {
  fn from_row(row: &MySqlRow) -> Result<Self, sqlx::Error> {
    Ok(Self {
      token: MediaFileToken::new(row.try_get("token")?),
      media_class: MediaFileClass::try_from_mysql_row(row, "media_class")?,
      media_type: MediaFileType::try_from_mysql_row(row, "media_type")?,

      maybe_engine_category: MediaFileEngineCategory::try_from_mysql_row_nullable(row, "maybe_engine_category")?,
      maybe_animation_type: MediaFileAnimationType::try_from_mysql_row_nullable(row, "maybe_animation_type")?,

      maybe_media_subtype: MediaFileSubtype::try_from_mysql_row_nullable(row, "maybe_media_subtype")?,

      maybe_batch_token: BatchGenerationToken::try_from_mysql_row_nullable(row, "maybe_batch_token")?,

      maybe_title: row.try_get("maybe_title")?,
      maybe_text_transcript: row.try_get("maybe_text_transcript")?,
      maybe_origin_filename: row.try_get("maybe_origin_filename")?,
      maybe_duration_millis: row.try_get("maybe_duration_millis")?,
      maybe_creator_user_token: UserToken::try_from_mysql_row_nullable(row, "maybe_creator_user_token")?,
      maybe_creator_username: row.try_get("maybe_creator_username")?,
      maybe_creator_display_name: row.try_get("maybe_creator_display_name")?,
      maybe_creator_gravatar_hash: row.try_get("maybe_creator_gravatar_hash")?,
      creator_set_visibility: Visibility::try_from_mysql_row(row, "creator_set_visibility")?,

      is_user_upload: row.try_get("is_user_upload")?,
      is_intermediate_system_file: row.try_get("is_intermediate_system_file")?,

      maybe_prompt_token: PromptToken::try_from_mysql_row_nullable(row, "maybe_prompt_token")?,
      maybe_other_prompt_args: row.try_get("maybe_other_prompt_args")?,

      maybe_file_cover_image_public_bucket_hash: row.try_get("maybe_file_cover_image_public_bucket_hash")?,
      maybe_file_cover_image_public_bucket_prefix: row.try_get("maybe_file_cover_image_public_bucket_prefix")?,
      maybe_file_cover_image_public_bucket_extension: row.try_get("maybe_file_cover_image_public_bucket_extension")?,

      maybe_model_weights_token: ModelWeightToken::try_from_mysql_row_nullable(row, "maybe_model_weights_token")?,
      maybe_model_weights_title: row.try_get("maybe_model_weights_title")?,
      maybe_model_weights_type: WeightsType::try_from_mysql_row_nullable(row, "maybe_model_weights_type")?,
      maybe_model_weights_category: WeightsCategory::try_from_mysql_row_nullable(row, "maybe_model_weights_category")?,

      maybe_model_cover_image_public_bucket_hash: row.try_get("maybe_model_cover_image_public_bucket_hash")?,
      maybe_model_cover_image_public_bucket_prefix: row.try_get("maybe_model_cover_image_public_bucket_prefix")?,
      maybe_model_cover_image_public_bucket_extension: row.try_get("maybe_model_cover_image_public_bucket_extension")?,

      maybe_model_weight_creator_user_token: UserToken::try_from_mysql_row_nullable(row, "maybe_model_weight_creator_user_token")?,
      maybe_model_weight_creator_username: row.try_get("maybe_model_weight_creator_username")?,
      maybe_model_weight_creator_display_name: row.try_get("maybe_model_weight_creator_display_name")?,
      maybe_model_weight_creator_gravatar_hash: row.try_get("maybe_model_weight_creator_gravatar_hash")?,

      extra_file_modification_info: row.try_get("extra_file_modification_info")?,

      public_bucket_directory_hash: row.try_get("public_bucket_directory_hash")?,
      maybe_public_bucket_prefix: row.try_get("maybe_public_bucket_prefix")?,
      maybe_public_bucket_extension: row.try_get("maybe_public_bucket_extension")?,
      maybe_ratings_positive_count: row.try_get("maybe_ratings_positive_count")?,
      maybe_ratings_negative_count: row.try_get("maybe_ratings_negative_count")?,
      maybe_bookmark_count: row.try_get("maybe_bookmark_count")?,
      created_at: row.try_get("created_at")?,
      updated_at: row.try_get("updated_at")?,
    })
  }
}
