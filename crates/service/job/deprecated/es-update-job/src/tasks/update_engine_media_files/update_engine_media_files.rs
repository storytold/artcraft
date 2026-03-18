use std::collections::HashSet;
use std::iter::FromIterator;
use std::sync::Arc;
use std::time::Duration;

use anyhow::anyhow;
use elasticsearch::{BulkOperation, BulkParts, Elasticsearch};
use log::{error, info};
use serde_json::Value;

use elasticsearch_schema::documents::media_file_document::{MEDIA_FILE_INDEX, MediaFileDocument};
use elasticsearch_schema::traits::document::Document;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_engine_category::MediaFileEngineCategory;
use enums::by_table::media_files::media_file_type::MediaFileType;
use errors::AnyhowResult;
use mysql_queries::queries::media_files::list::list_media_files_for_elastic_search_backfill_using_cursor::{list_media_files_for_elastic_search_backfill_using_cursor, ListArgs, MediaFileForElasticsearchRecord};

use crate::job_state::JobState;

const PAGE_SIZE : usize = 1000;

pub async fn update_engine_media_files(job_state: Arc<JobState>) {
  // TODO(bt,2024-02-05): Write this cursor to Redis so job can resume without reindexing everything.
  let mut cursor = 0;

  loop {
    info!("Main loop; cursor @ {:?}", &cursor);

    // TODO(bt,2024-07-07): We don't have any recoverability if the update feed gets stuck. We'll stay in
    //  this loop and cease making progress. Furthermore, we have no observability for when this happens. :(
    let result = with_database_main_loop(&mut cursor, &job_state).await;

    if let Err(err) = result {
      error!("Error in main loop: {:?}", err);
      std::thread::sleep(Duration::from_millis(job_state.sleep_config.between_error_wait_millis));
    }

    // NB: Function should never return in success case, but we'll sleep just in case.
  }
}

pub async fn with_database_main_loop(cursor: &mut usize, job_state: &JobState) -> AnyhowResult<()> {
  loop {
    info!("Querying tokens updated since: {:?}", &cursor);

    // TODO(bt,2024-07-07): media_files doesn't have an index on updated_at, so we can't simply scan for updates.
    //  We have to do a full table walk, which is unfortunate. It should work at our current scale, but in the future
    //  we'll need to remedy this.
    let mut results = list_media_files_for_elastic_search_backfill_using_cursor(ListArgs {
      mysql_pool: &job_state.mysql_pool,
      page_size: PAGE_SIZE,
      cursor: *cursor,
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

    if results.is_empty() {
      info!("No records after cursor: {:?}. Resetting to 0.", &cursor);
      *cursor = 0;

      std::thread::sleep(Duration::from_millis(job_state.sleep_config.between_no_updates_wait_millis));
      continue;
    }

    info!("Found {} updated records", results.len());

    while !results.is_empty() {
      let last = 50.min(results.len());
      let drained_results= results.drain(0..last)
          .into_iter()
          .collect::<Vec<_>>();

      for record in drained_results {
        let id = record.id;

        create_document_from_record(&job_state.elasticsearch, record).await?;

        *cursor = id as usize;

        std::thread::sleep(Duration::from_millis(job_state.sleep_config.between_es_writes_wait_millis));
      }

      std::thread::sleep(Duration::from_millis(job_state.sleep_config.between_job_batch_wait_millis));
    }

    info!("Up to date at cursor = {:?}", &cursor);

    std::thread::sleep(Duration::from_millis(job_state.sleep_config.between_query_wait_millis));
  }
}

async fn create_document_from_record(elasticsearch: &Elasticsearch, record: MediaFileForElasticsearchRecord) -> AnyhowResult<()> {
  info!("Create record for {:?} - {:?}", record.token, record.maybe_title);

  let is_deleted = record.user_deleted_at.is_some() || record.mod_deleted_at.is_some();

  let document = MediaFileDocument {
    token: record.token,

    media_class: record.media_class,
    media_type: record.media_type,
    maybe_media_subtype: record.maybe_media_subtype,
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

    error!("Errors during indexing. Failures: {}", failed.len());

    return Err(anyhow!("Errors during indexing. Failures: {}", failed.len()));
  }

  Ok(())
}
