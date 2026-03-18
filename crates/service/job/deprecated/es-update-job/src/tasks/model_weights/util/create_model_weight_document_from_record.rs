use anyhow::anyhow;
use elasticsearch::{BulkOperation, BulkParts, Elasticsearch};
use log::{error, info};
use serde_json::Value;

use elasticsearch_schema::documents::model_weight_document::{MODEL_WEIGHT_INDEX, ModelWeightDocument};
use elasticsearch_schema::traits::document::Document;
use enums::by_table::model_weights::weights_category::WeightsCategory;
use errors::AnyhowResult;
use mysql_queries::queries::model_weights::batch_get::batch_get_model_weights_for_elastic_search_backfill::ModelWeightForElasticsearchRecord;
use primitives::numerics::u64_to_i32_saturating::u64_to_i32_saturating;

pub async fn create_model_weight_document_from_record(
  elasticsearch: &Elasticsearch,
  record: ModelWeightForElasticsearchRecord
) -> AnyhowResult<()> {

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

    title: record.title.to_string(),
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

    error!("Errors during indexing. Failures: {}", failed.len());

    return Err(anyhow!("Errors during indexing. Failures: {}", failed.len()));
  }

  Ok(())
}
