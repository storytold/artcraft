use std::fs::read_to_string;

use elasticsearch::{BulkOperation, BulkParts, Elasticsearch};
use log::{error, info, warn};
use serde_json::Value;
use sqlx::{MySql, Pool};

use elasticsearch_schema::documents::model_weight_document::{MODEL_WEIGHT_INDEX, ModelWeightDocument};
use elasticsearch_schema::traits::document::Document;
use elasticsearch_schema::utils::create_index_if_not_exists::{create_index_if_not_exists, CreateIndexArgs};
use enums_db::by_table::model_weights::weights_category::WeightsCategory;
use errors::AnyhowResult;
use mysql_queries::queries::model_weights::list::list_model_weights_for_elastic_search_backfill_using_cursor::{list_model_weights_for_elastic_search_backfill_using_cursor, ModelWeightForElasticsearchRecord};
use primitives::numerics::u64_to_i32_saturating::u64_to_i32_saturating;
use storyteller_root::get_storyteller_rust_root;

pub async fn create_all_model_weight_documents(
  mysql: &Pool<MySql>,
  elasticsearch: &Elasticsearch
) -> AnyhowResult<()> {

  info!("Create all model weight documents.");

  // TODO(bt, 2024-01-10): expose this as a CLI flag
  const DELETE_EXISTING_INDEX : bool = true;
  const PAGE_SIZE : u64 = 1000;

  create_model_weight_model_index(&elasticsearch, DELETE_EXISTING_INDEX).await?;

  let mut cursor = 0;

  loop {
    let results = list_model_weights_for_elastic_search_backfill_using_cursor(mysql, PAGE_SIZE, cursor).await?;

    if results.is_empty() {
      info!("No more results at cursor {cursor}");
      break;
    }

    let maybe_last_id = results.last().map(|result| result.id);

    match maybe_last_id {
      Some(last_id) => cursor = last_id as u64,
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

async fn create_document_from_record(elasticsearch: &Elasticsearch, record: ModelWeightForElasticsearchRecord) -> AnyhowResult<()> {
  info!("Create record for {:?} - {:?}", record.token, record.title);

  let is_deleted = record.user_deleted_at.is_some() || record.mod_deleted_at.is_some();

  let maybe_ietf_language_tag = record.maybe_ietf_language_tag
      .as_deref()
      .or_else(|| match record.weights_category {
        WeightsCategory::TextToSpeech => record.maybe_tts_ietf_language_tag.as_deref(),
        WeightsCategory::VoiceConversion => record.maybe_voice_conversion_ietf_language_tag.as_deref(),
        _ => None,
      })
      .map(|t| t.to_string());

  let maybe_ietf_primary_language_subtag = record.maybe_ietf_primary_language_subtag
      .as_deref()
      .or_else(|| match &record.weights_category {
        WeightsCategory::TextToSpeech => record.maybe_tts_ietf_primary_language_subtag.as_deref(),
        WeightsCategory::VoiceConversion => record.maybe_voice_conversion_ietf_primary_language_subtag.as_deref(),
        _ => None,
      })
      .map(|t| t.to_string());

  let document = ModelWeightDocument {
    token: record.token,

    creator_set_visibility: record.creator_set_visibility,

    weights_type: record.weights_type,
    weights_category: record.weights_category,

    title: record.title.clone(),
    title_as_keyword: record.title,

    maybe_cover_image_media_file_token: record.maybe_cover_image_media_file_token,
    maybe_cover_image_public_bucket_hash: record.maybe_cover_image_public_bucket_hash,
    maybe_cover_image_public_bucket_prefix: record.maybe_cover_image_public_bucket_prefix,
    maybe_cover_image_public_bucket_extension: record.maybe_cover_image_public_bucket_extension,

    creator_user_token: record.creator_user_token,
    creator_username: record.creator_username,
    creator_display_name: record.creator_display_name,
    creator_gravatar_hash: record.creator_gravatar_hash,

    is_featured: Some(record.is_featured),

    ratings_positive_count: record.maybe_ratings_positive_count.unwrap_or(0),
    ratings_negative_count: record.maybe_ratings_negative_count.unwrap_or(0),
    bookmark_count: record.maybe_bookmark_count.unwrap_or(0),

    cached_usage_count: Some(u64_to_i32_saturating(record.cached_usage_count)),

    maybe_ietf_language_tag,
    maybe_ietf_primary_language_subtag,

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
      .bulk(BulkParts::Index(MODEL_WEIGHT_INDEX))
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
async fn create_model_weight_model_index(client: &Elasticsearch, delete_existing: bool) -> AnyhowResult<()> {

  info!("Creating model weight model index...");

  let index_path = get_storyteller_rust_root()
      .join("_database/elasticsearch/index_definitions/model_weights_v1.json");

  info!("Reading index file: {:?}", index_path);

  let index_definition = read_to_string(index_path)?;

  create_index_if_not_exists(CreateIndexArgs {
    client,
    index_name: MODEL_WEIGHT_INDEX,
    index_definition: &index_definition,
    delete_existing,
  }).await?;

  Ok(())
}
