use std::collections::HashSet;

use anyhow::anyhow;
use chrono::{DateTime, NaiveDateTime, Utc};
use log::{info, warn};
use sqlx::{Execute, FromRow, MySql, MySqlPool, QueryBuilder, Row};
use sqlx::mysql::MySqlRow;
use sqlx::pool::PoolConnection;

use enums::by_table::media_files::media_file_animation_type::MediaFileAnimationType;
use enums::traits::mysql_from_row::MySqlFromRow as _;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_engine_category::MediaFileEngineCategory;
use enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory;
use enums::by_table::media_files::media_file_origin_model_type::MediaFileOriginModelType;
use enums::by_table::media_files::media_file_origin_product_category::MediaFileOriginProductCategory;
use enums::by_table::media_files::media_file_subtype::MediaFileSubtype;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::common::visibility::Visibility;
use errors::AnyhowResult;
use tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken;
use tokens::tokens::batch_generations::BatchGenerationToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::prompts::PromptToken;
use tokens::tokens::users::UserToken;
use tokens::traits::mysql_token_from_row::MySqlTokenFromRow;

use crate::helpers::boolean_converters::i8_to_bool;

/// This is meant to be the entire table
#[derive(Debug)]
pub struct MediaFileForElasticsearchRecord {
  pub id: i64,
  pub token: MediaFileToken,

  pub origin_category: MediaFileOriginCategory,
  pub origin_product_category: MediaFileOriginProductCategory,

  pub maybe_origin_model_type: Option<MediaFileOriginModelType>,
  pub maybe_origin_model_token: Option<String>,

  pub maybe_origin_filename: Option<String>,

  pub is_batch_generated: bool,
  pub maybe_batch_token: Option<BatchGenerationToken>,

  pub is_user_upload: bool,
  pub is_intermediate_system_file: bool,

  pub maybe_title: Option<String>,

  // Cover images
  pub maybe_cover_image_media_file_token: Option<MediaFileToken>,
  pub maybe_cover_image_public_bucket_hash: Option<String>,
  pub maybe_cover_image_public_bucket_prefix: Option<String>,
  pub maybe_cover_image_public_bucket_extension: Option<String>,

  pub maybe_style_transfer_source_media_file_token: Option<MediaFileToken>,
  pub maybe_scene_source_media_file_token: Option<MediaFileToken>,

  pub nsfw_status: String,

  pub media_type: MediaFileType,
  pub media_class: MediaFileClass,
  pub maybe_media_subtype: Option<MediaFileSubtype>,

  pub maybe_mime_type: Option<String>,
  pub file_size_bytes: u64,
  pub maybe_duration_millis: Option<u64>,

  pub maybe_audio_encoding: Option<String>,
  pub maybe_video_encoding: Option<String>,

  //pub maybe_frame_width: Option<u64>,
  //pub maybe_frame_height: Option<u64>,

  pub maybe_engine_category: Option<MediaFileEngineCategory>,
  pub maybe_animation_type: Option<MediaFileAnimationType>,

  pub maybe_text_transcript: Option<String>,

  pub maybe_prompt_token: Option<PromptToken>,

  pub checksum_sha2: String,

  pub public_bucket_directory_hash: String,
  pub maybe_public_bucket_prefix: Option<String>,
  pub maybe_public_bucket_extension: Option<String>,

  pub extra_file_modification_info: Option<String>,

  // Creator
  pub maybe_creator_user_token: Option<UserToken>,
  pub maybe_creator_username: Option<String>,
  pub maybe_creator_display_name: Option<String>,
  pub maybe_creator_gravatar_hash: Option<String>,

  pub maybe_creator_anonymous_visitor_token: Option<AnonymousVisitorTrackingToken>,

  pub creator_ip_address: String,

  pub creator_set_visibility: Visibility,

  // NB: is_featured is derived
  pub is_featured: bool,

  // TODO: Other fields really don't matter.

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,

  pub user_deleted_at: Option<DateTime<Utc>>,
  pub mod_deleted_at: Option<DateTime<Utc>>,

  pub database_read_time: DateTime<Utc>,
}

pub struct ListArgs<'a> {
  // Filters
  pub maybe_filter_media_types: Option<&'a HashSet<MediaFileType>>,
  pub maybe_filter_media_classes: Option<&'a HashSet<MediaFileClass>>,
  pub maybe_filter_engine_categories: Option<&'a HashSet<MediaFileEngineCategory>>,

  // Cursors
  pub page_size: usize,
  pub cursor: usize,

  // Connection
  pub mysql_pool: &'a MySqlPool,
}

pub async fn list_media_files_for_elastic_search_backfill_using_cursor(
  args: ListArgs<'_>
) -> AnyhowResult<Vec<MediaFileForElasticsearchRecord>> {

  let mut query = query_builder(&args);

  let query = query.build_query_as::<RawRecord>();

  let maybe_media_files = query.fetch_all(args.mysql_pool).await;

  let media_files : Vec<RawRecord> = match maybe_media_files {
    Ok(media_files) => media_files,
    Err(sqlx::error::Error::RowNotFound) => return Ok(Vec::new()),
    Err(err) => {
      warn!("media file list query error: {:?}", err);
      return Err(anyhow!("media file list query error"));
    }
  };

  Ok(media_files.into_iter()
      .map(|record| {
        MediaFileForElasticsearchRecord {
          id: record.id,
          token: record.token,
          origin_category: record.origin_category,
          origin_product_category: record.origin_product_category,
          maybe_origin_model_type: record.maybe_origin_model_type,
          maybe_origin_model_token: record.maybe_origin_model_token,
          maybe_origin_filename: record.maybe_origin_filename,
          is_batch_generated: i8_to_bool(record.is_batch_generated),
          maybe_batch_token: record.maybe_batch_token,
          is_user_upload: i8_to_bool(record.is_user_upload),
          is_intermediate_system_file: i8_to_bool(record.is_intermediate_system_file),
          maybe_title: record.maybe_title,
          maybe_cover_image_media_file_token: record.maybe_cover_image_media_file_token,
          maybe_cover_image_public_bucket_hash: record.maybe_cover_image_public_bucket_hash,
          maybe_cover_image_public_bucket_prefix: record.maybe_cover_image_public_bucket_prefix,
          maybe_cover_image_public_bucket_extension: record.maybe_cover_image_public_bucket_extension,
          maybe_style_transfer_source_media_file_token: record.maybe_style_transfer_source_media_file_token,
          maybe_scene_source_media_file_token: record.maybe_scene_source_media_file_token,
          nsfw_status: record.nsfw_status,
          media_type: record.media_type,
          media_class: record.media_class,
          maybe_media_subtype: record.maybe_media_subtype,
          maybe_mime_type: record.maybe_mime_type,
          file_size_bytes: record.file_size_bytes as u64,
          maybe_duration_millis: record.maybe_duration_millis.map(|d| d as u64),
          maybe_audio_encoding: record.maybe_audio_encoding,
          maybe_video_encoding: record.maybe_video_encoding,
          maybe_engine_category: record.maybe_engine_category,
          maybe_animation_type: record.maybe_animation_type,
          maybe_text_transcript: record.maybe_text_transcript,
          maybe_prompt_token: record.maybe_prompt_token,
          checksum_sha2: record.checksum_sha2,
          public_bucket_directory_hash: record.public_bucket_directory_hash,
          maybe_public_bucket_prefix: record.maybe_public_bucket_prefix,
          maybe_public_bucket_extension: record.maybe_public_bucket_extension,
          extra_file_modification_info: record.extra_file_modification_info,
          maybe_creator_user_token: record.maybe_creator_user_token,
          maybe_creator_username: record.maybe_creator_username,
          maybe_creator_display_name: record.maybe_creator_display_name,
          maybe_creator_gravatar_hash: record.maybe_creator_gravatar_hash,
          maybe_creator_anonymous_visitor_token: record.maybe_creator_anonymous_visitor_token,
          creator_ip_address: record.creator_ip_address,
          creator_set_visibility: record.creator_set_visibility,
          is_featured: i8_to_bool(record.is_featured),
          created_at: record.created_at,
          updated_at: record.updated_at,
          user_deleted_at: record.user_deleted_at,
          mod_deleted_at: record.mod_deleted_at,
          database_read_time: record.database_read_time.and_utc(),
        }
      })
      .collect::<Vec<MediaFileForElasticsearchRecord>>())
}

fn query_builder<'a>(
  args: &ListArgs<'a>
) -> QueryBuilder<'a, MySql> {
  // NB: Query cannot be statically checked by sqlx
  let mut query_builder: QueryBuilder<MySql> = QueryBuilder::new(r#"
SELECT
    m.id,
    m.token,

    m.origin_category,
    m.origin_product_category,

    m.maybe_origin_model_type,
    m.maybe_origin_model_token,
    m.maybe_origin_filename,

    m.is_batch_generated,
    m.maybe_batch_token,

    m.is_user_upload,
    m.is_intermediate_system_file,

    m.maybe_title,

    cover_image.token as maybe_cover_image_media_file_token,
    cover_image.public_bucket_directory_hash as maybe_cover_image_public_bucket_hash,
    cover_image.maybe_public_bucket_prefix as maybe_cover_image_public_bucket_prefix,
    cover_image.maybe_public_bucket_extension as maybe_cover_image_public_bucket_extension,

    m.maybe_style_transfer_source_media_file_token,
    m.maybe_scene_source_media_file_token,

    m.nsfw_status,

    m.media_type,
    m.media_class,
    m.maybe_media_subtype,

    m.maybe_mime_type,
    m.file_size_bytes,
    m.maybe_duration_millis,

    m.maybe_audio_encoding,
    m.maybe_video_encoding,

    m.maybe_engine_category,
    m.maybe_animation_type,

    m.maybe_text_transcript,

    m.maybe_prompt_token,

    m.checksum_sha2,

    m.public_bucket_directory_hash,
    m.maybe_public_bucket_prefix,
    m.maybe_public_bucket_extension,

    m.extra_file_modification_info,

    users.token as maybe_creator_user_token,
    users.username as maybe_creator_username,
    users.display_name as maybe_creator_display_name,
    users.email_gravatar_hash as maybe_creator_gravatar_hash,

    m.maybe_creator_anonymous_visitor_token,

    m.creator_ip_address,

    m.creator_set_visibility,

    featured_items.id IS NOT NULL as is_featured,

    m.created_at,
    m.updated_at,
    m.user_deleted_at,
    m.mod_deleted_at,

    NOW() as database_read_time

FROM media_files as m

LEFT OUTER JOIN users
    ON users.token = m.maybe_creator_user_token

LEFT OUTER JOIN media_files as cover_image
    ON cover_image.token = m.maybe_cover_image_media_file_token

LEFT OUTER JOIN featured_items
    ON featured_items.entity_type = "media_file"
    AND featured_items.deleted_at IS NULL
    AND featured_items.entity_token = m.token
    "#);

  query_builder.push(" WHERE m.id > ");
  query_builder.push_bind(format!("{}", args.cursor));

  query_builder.push(" AND NOT m.is_intermediate_system_file ");

  if let Some(media_types) = args.maybe_filter_media_types {
    // NB: `WHERE IN` comma separated syntax will be wrong if list has zero length
    // We'll skip the predicate if the list isn't empty.
    if !media_types.is_empty() {
      query_builder.push(" AND m.media_type IN ( ");

      let mut separated = query_builder.separated(", ");

      for media_type in media_types.iter() {
        separated.push_bind(media_type.to_str());
      }

      separated.push_unseparated(") ");
    }
  }

  if let Some(media_classes) = args.maybe_filter_media_classes {
    // NB: `WHERE IN` comma separated syntax will be wrong if list has zero length
    // We'll skip the predicate if the list isn't empty.
    if !media_classes.is_empty() {
      query_builder.push(" AND m.media_class IN ( ");

      let mut separated = query_builder.separated(", ");

      for media_class in media_classes.iter() {
        separated.push_bind(media_class.to_str());
      }

      separated.push_unseparated(") ");
    }
  }

  if let Some(engine_categories) = args.maybe_filter_engine_categories {
    // NB: `WHERE IN` comma separated syntax will be wrong if list has zero length
    // We'll skip the predicate if the list isn't empty.
    if !engine_categories.is_empty() {
      query_builder.push(" AND m.maybe_engine_category IN ( ");

      let mut separated = query_builder.separated(", ");

      for engine_category in engine_categories.iter() {
        separated.push_bind(engine_category.to_str());
      }

      separated.push_unseparated(") ");
    }
  }

  query_builder.push(" ORDER BY m.id ASC ");
  query_builder.push(" LIMIT ");
  query_builder.push_bind(format!("{}", args.page_size));

  query_builder
}

struct RawRecord {
  pub id: i64,
  pub token: MediaFileToken,

  pub origin_category: MediaFileOriginCategory,
  pub origin_product_category: MediaFileOriginProductCategory,

  pub maybe_origin_model_type: Option<MediaFileOriginModelType>,
  pub maybe_origin_model_token: Option<String>,

  pub maybe_origin_filename: Option<String>,

  pub is_batch_generated: i8,
  pub maybe_batch_token: Option<BatchGenerationToken>,

  pub is_user_upload: i8,
  pub is_intermediate_system_file: i8,

  pub maybe_title: Option<String>,

  // Cover images
  pub maybe_cover_image_media_file_token: Option<MediaFileToken>,
  pub maybe_cover_image_public_bucket_hash: Option<String>,
  pub maybe_cover_image_public_bucket_prefix: Option<String>,
  pub maybe_cover_image_public_bucket_extension: Option<String>,

  pub maybe_style_transfer_source_media_file_token: Option<MediaFileToken>,
  pub maybe_scene_source_media_file_token: Option<MediaFileToken>,

  pub nsfw_status: String,

  pub media_type: MediaFileType,
  pub media_class: MediaFileClass,
  pub maybe_media_subtype: Option<MediaFileSubtype>,

  pub maybe_mime_type: Option<String>,
  pub file_size_bytes: i32,
  pub maybe_duration_millis: Option<i32>,

  pub maybe_audio_encoding: Option<String>,
  pub maybe_video_encoding: Option<String>,

  //pub maybe_frame_width: Option<u64>,
  //pub maybe_frame_height: Option<u64>,

  pub maybe_engine_category: Option<MediaFileEngineCategory>,
  pub maybe_animation_type: Option<MediaFileAnimationType>,

  pub maybe_text_transcript: Option<String>,

  pub maybe_prompt_token: Option<PromptToken>,

  pub checksum_sha2: String,

  pub public_bucket_directory_hash: String,
  pub maybe_public_bucket_prefix: Option<String>,
  pub maybe_public_bucket_extension: Option<String>,

  pub extra_file_modification_info: Option<String>,

  // Creator
  pub maybe_creator_user_token: Option<UserToken>,
  pub maybe_creator_username: Option<String>,
  pub maybe_creator_display_name: Option<String>,
  pub maybe_creator_gravatar_hash: Option<String>,

  pub maybe_creator_anonymous_visitor_token: Option<AnonymousVisitorTrackingToken>,

  pub creator_ip_address: String,

  pub creator_set_visibility: Visibility,

  // NB: is_featured is derived
  pub is_featured: i8,

  // TODO: Other fields really don't matter.

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,

  pub user_deleted_at: Option<DateTime<Utc>>,
  pub mod_deleted_at: Option<DateTime<Utc>>,

  pub database_read_time: NaiveDateTime,
}

impl FromRow<'_, MySqlRow> for RawRecord {
  fn from_row(row: &MySqlRow) -> Result<Self, sqlx::Error> {
    Ok(Self {
      id: row.try_get("id")?,
      token: MediaFileToken::try_from_mysql_row(row, "token")?,

      origin_category: MediaFileOriginCategory::try_from_mysql_row(row, "origin_category")?,
      origin_product_category: MediaFileOriginProductCategory::try_from_mysql_row(row, "origin_product_category")?,

      maybe_origin_model_type: MediaFileOriginModelType::try_from_mysql_row_nullable(row, "maybe_origin_model_type")?,
      maybe_origin_model_token: row.try_get("maybe_origin_model_token")?,
      maybe_origin_filename: row.try_get("maybe_origin_filename")?,

      is_batch_generated: row.try_get("is_batch_generated")?,
      maybe_batch_token: BatchGenerationToken::try_from_mysql_row_nullable(row, "maybe_batch_token")?,

      is_user_upload: row.try_get("is_user_upload")?,
      is_intermediate_system_file: row.try_get("is_intermediate_system_file")?,

      maybe_title: row.try_get("maybe_title")?,

      maybe_cover_image_media_file_token: row.try_get("maybe_cover_image_media_file_token")?,
      maybe_cover_image_public_bucket_hash: row.try_get("maybe_cover_image_public_bucket_hash")?,
      maybe_cover_image_public_bucket_prefix: row.try_get("maybe_cover_image_public_bucket_prefix")?,
      maybe_cover_image_public_bucket_extension: row.try_get("maybe_cover_image_public_bucket_extension")?,

      maybe_style_transfer_source_media_file_token: row.try_get("maybe_style_transfer_source_media_file_token")?,
      maybe_scene_source_media_file_token: row.try_get("maybe_scene_source_media_file_token")?,

      nsfw_status: row.try_get("nsfw_status")?,

      media_type: MediaFileType::try_from_mysql_row(row, "media_type")?,
      media_class: MediaFileClass::try_from_mysql_row(row, "media_class")?,
      maybe_media_subtype: MediaFileSubtype::try_from_mysql_row_nullable(row, "maybe_media_subtype")?,

      maybe_mime_type: row.try_get("maybe_mime_type")?,
      file_size_bytes: row.try_get("file_size_bytes")?,
      maybe_duration_millis: row.try_get("maybe_duration_millis")?,

      maybe_audio_encoding: row.try_get("maybe_audio_encoding")?,
      maybe_video_encoding: row.try_get("maybe_video_encoding")?,

      maybe_engine_category: MediaFileEngineCategory::try_from_mysql_row_nullable(row, "maybe_engine_category")?,
      maybe_animation_type: MediaFileAnimationType::try_from_mysql_row_nullable(row, "maybe_animation_type")?,

      maybe_text_transcript: row.try_get("maybe_text_transcript")?,

      maybe_prompt_token: PromptToken::try_from_mysql_row_nullable(row, "maybe_prompt_token")?,

      checksum_sha2: row.try_get("checksum_sha2")?,

      public_bucket_directory_hash: row.try_get("public_bucket_directory_hash")?,
      maybe_public_bucket_prefix: row.try_get("maybe_public_bucket_prefix")?,
      maybe_public_bucket_extension: row.try_get("maybe_public_bucket_extension")?,

      extra_file_modification_info: row.try_get("extra_file_modification_info")?,

      maybe_creator_user_token: UserToken::try_from_mysql_row_nullable(row, "maybe_creator_user_token")?,
      maybe_creator_username: row.try_get("maybe_creator_username")?,
      maybe_creator_display_name: row.try_get("maybe_creator_display_name")?,
      maybe_creator_gravatar_hash: row.try_get("maybe_creator_gravatar_hash")?,

      maybe_creator_anonymous_visitor_token: AnonymousVisitorTrackingToken::try_from_mysql_row_nullable(row, "maybe_creator_anonymous_visitor_token")?,

      creator_ip_address: row.try_get("creator_ip_address")?,

      creator_set_visibility: Visibility::try_from_mysql_row(row, "creator_set_visibility")?,

      is_featured: row.try_get("is_featured")?,

      created_at: row.try_get("created_at")?,
      updated_at: row.try_get("updated_at")?,
      user_deleted_at: row.try_get("user_deleted_at")?,
      mod_deleted_at: row.try_get("mod_deleted_at")?,

      database_read_time: row.try_get("database_read_time")?,
    })
  }
}
