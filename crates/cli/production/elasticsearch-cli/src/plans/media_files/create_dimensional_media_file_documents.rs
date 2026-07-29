use std::collections::HashSet;
use std::fs::read_to_string;
use std::iter::FromIterator;

use elasticsearch::{BulkOperation, BulkParts, Elasticsearch};
use log::{error, info, warn};
use serde_json::Value;
use sqlx::{MySql, Pool};

use elasticsearch_schema::documents::media_file_document::{MEDIA_FILE_INDEX, MediaFileDocument};
use elasticsearch_schema::traits::document::Document;
use elasticsearch_schema::utils::create_index_if_not_exists::{create_index_if_not_exists, CreateIndexArgs};
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_engine_category::MediaFileEngineCategory;
use enums::by_table::media_files::media_file_type::MediaFileType;
use errors::AnyhowResult;
use mysql_queries::queries::media_files::list::list_media_files_for_elastic_search_backfill_using_cursor::{list_media_files_for_elastic_search_backfill_using_cursor, ListArgs, MediaFileForElasticsearchRecord};
use mysql_queries::queries::model_weights::list::list_model_weights_for_elastic_search_backfill_using_cursor::{list_model_weights_for_elastic_search_backfill_using_cursor, ModelWeightForElasticsearchRecord};
use storyteller_root::get_storyteller_rust_root;

pub async fn create_dimensional_media_file_documents(
  mysql: &Pool<MySql>,
  elasticsearch: &Elasticsearch
) -> AnyhowResult<()> {

  info!("Create dimensional media file documents.");

  // TODO(bt, 2024-01-10): expose this as a CLI flag
  const DELETE_EXISTING_INDEX : bool = true;
  const PAGE_SIZE : usize = 1000;

  create_media_file_index(&elasticsearch, DELETE_EXISTING_INDEX).await?;

  let mut cursor = 0;

  loop {
    info!("Cursor: {cursor}");

    let results = list_media_files_for_elastic_search_backfill_using_cursor(ListArgs {
      mysql_pool: mysql,
      page_size: PAGE_SIZE,
      cursor,
      maybe_filter_engine_categories: Some(&HashSet::from_iter(vec![
        MediaFileEngineCategory::Animation,
        MediaFileEngineCategory::Character,
        MediaFileEngineCategory::Creature,
        MediaFileEngineCategory::Expression,
        MediaFileEngineCategory::ImagePlane,
        MediaFileEngineCategory::Location,
        MediaFileEngineCategory::Object,
        MediaFileEngineCategory::Scene,
        MediaFileEngineCategory::SetDressing,
        MediaFileEngineCategory::Skybox,
        MediaFileEngineCategory::VideoPlane,
      ])),
      maybe_filter_media_types: Some(&HashSet::from_iter(vec![
        // Engine types
        MediaFileType::Csv,
        MediaFileType::Fbx,
        MediaFileType::Glb,
        MediaFileType::SceneJson,
        // Image types
        MediaFileType::Gif,
        MediaFileType::Jpg,
        MediaFileType::Png,
      ])),
      maybe_filter_media_classes: Some(&HashSet::from_iter(vec![
        MediaFileClass::Image,
        MediaFileClass::Dimensional,
      ])),
    }).await?;

    info!("Results length: {}", results.len());

    if results.is_empty() {
      info!("No more results at cursor {cursor}");
      break;
    }

    let maybe_last_id = results.last().map(|result| result.id);

    match maybe_last_id {
      Some(last_id) => cursor = last_id as usize,
      None => {
        warn!("No final ID at cursor {cursor}");
        break;
      }
    }

    for result in results {
      create_document_from_record(elasticsearch, result).await?;
    }
  }

  Ok(())
}

async fn create_document_from_record(elasticsearch: &Elasticsearch, record: MediaFileForElasticsearchRecord) -> AnyhowResult<()> {
  info!("Create record for {:?}", record.token);

  let is_deleted = record.user_deleted_at.is_some() || record.mod_deleted_at.is_some();

  let document = MediaFileDocument {
    token: record.token,

    media_class: record.media_class,
    media_type: record.media_type,
    maybe_engine_category: record.maybe_engine_category,
    maybe_animation_type: record.maybe_animation_type,

    maybe_mime_type: record.maybe_mime_type,
    public_bucket_directory_hash: record.public_bucket_directory_hash,
    maybe_public_bucket_prefix: record.maybe_public_bucket_prefix,
    maybe_public_bucket_extension: record.maybe_public_bucket_extension,
    creator_set_visibility: record.creator_set_visibility,

    maybe_title: record.maybe_title.clone(),
    maybe_title_as_keyword: record.maybe_title,

    maybe_cover_image_media_file_token: record.maybe_cover_image_media_file_token,
    maybe_cover_image_public_bucket_hash: record.maybe_cover_image_public_bucket_hash,
    maybe_cover_image_public_bucket_prefix: record.maybe_cover_image_public_bucket_prefix,
    maybe_cover_image_public_bucket_extension: record.maybe_cover_image_public_bucket_extension,

    maybe_creator_user_token: record.maybe_creator_user_token,
    maybe_creator_username: record.maybe_creator_username,
    maybe_creator_display_name: record.maybe_creator_display_name,
    maybe_creator_gravatar_hash: record.maybe_creator_gravatar_hash,

    is_featured: record.is_featured,

    is_user_upload: Some(record.is_user_upload),
    is_intermediate_system_file: Some(record.is_intermediate_system_file),

    created_at: record.created_at,
    updated_at: record.updated_at,
    user_deleted_at: record.user_deleted_at,
    mod_deleted_at: record.mod_deleted_at,

    database_read_time: record.database_read_time,

    is_deleted,
  };

  let op : BulkOperation<_> = BulkOperation::index(&document)
      .id(document.get_document_id())
      .into();

  let response = elasticsearch
      .bulk(BulkParts::Index(MEDIA_FILE_INDEX))
      .body(vec![op])
      .send()
      .await?;

  let json: Value = response.json().await?;

  let had_errors = json["errors"].as_bool().unwrap_or(false);

  if had_errors {
    let failed: Vec<&Value> = json["items"]
        .as_array()
        .unwrap()
        .iter()
        .filter(|v| !v["error"].is_null())
        .collect();

    // TODO: retry failures
    error!("Errors during indexing. Failures: {}", failed.len());
  }

  Ok(())
}

// NB: Adapted from elasticsearch crate examples source
async fn create_media_file_index(client: &Elasticsearch, delete_existing: bool) -> AnyhowResult<()> {

  info!("Creating model media file index...");

  let index_path = get_storyteller_rust_root()
      .join("_database/elasticsearch/index_definitions/media_files_v1.json");

  info!("Reading index file: {:?}", index_path);

  let index_definition = read_to_string(index_path)?;

  create_index_if_not_exists(CreateIndexArgs {
    client,
    index_name: MEDIA_FILE_INDEX,
    index_definition: &index_definition,
    delete_existing,
  }).await?;

  Ok(())
}
