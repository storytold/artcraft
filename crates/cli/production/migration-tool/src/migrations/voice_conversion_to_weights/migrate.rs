use std::thread;
use std::time::Duration;

use log::{info, warn};

use bucket_paths::legacy::typified_paths::public::weight_files::bucket_file_path::WeightFileBucketPath;
use enums_db::by_table::model_weights::weights_types::WeightsType;
use errors::AnyhowResult;
use mysql_queries::queries::model_weights::get::get_weight::get_weight_by_token;
use mysql_queries::queries::model_weights::migration::upsert_model_weight_from_voice_conversion_model::{CopiedFileData, upsert_model_weight_from_voice_conversion_model};
use mysql_queries::queries::voice_conversion::migration::list_whole_voice_conversion_models_using_cursor::{list_whole_voice_conversion_models_using_cursor, WholeVoiceConversionModelRecord};
use tokens::tokens::model_weights::ModelWeightToken;

use crate::deps::Deps;
use crate::migrations::voice_conversion_to_weights::copy_cloud_files::copy_cloud_files;

const PAGE_SIZE: u64 = 10;

pub async fn migrate_voice_conversion_to_weights(deps: &Deps) -> AnyhowResult<()> {

  let mut cursor = 0;

  loop {
    info!("Querying {PAGE_SIZE} models at cursor = {cursor}");

    let results
        = list_whole_voice_conversion_models_using_cursor(&deps.mysql_production, PAGE_SIZE, cursor).await?;

    if results.is_empty() {
      warn!("No more results found; exiting.");
      break;
    }

    for result in results.iter() {
      println!("\n\nmigrating over result {:?} : {:?} ...", result.token, result);
      copy_model_record_and_bucket_files(result, &deps).await?;
    }

    if let Some(last_id) = results.last().map(|result| result.id) {
      cursor = last_id as u64;
    }

    thread::sleep(Duration::from_secs(2));
  }

  Ok(())
}

async fn copy_model_record_and_bucket_files(record: &WholeVoiceConversionModelRecord, deps: &Deps) -> AnyhowResult<()> {
  let mut maybe_copied_data = None;

  match &record.maybe_migration_new_model_weights_token {
    None => {
      info!("Copying bucket files for record {:?} ...", record.token);
      let result = copy_cloud_files(record, &deps).await?;
      maybe_copied_data = Some(result);
    }
    Some(token) => {
      info!("Existing migrated record; skipping cloud bucket copy...");
      maybe_copied_data = lookup_bucket_details_from_record(token, &deps).await?;
    }
  }

  if let Some(copied_data) = &maybe_copied_data {
    info!("Upserting records...");
    upsert_model_weight_from_voice_conversion_model(record, &deps.mysql_production, copied_data).await?;
  }

  Ok(())
}

/// Look up the bucket storage details from a previously-migrated record
async fn lookup_bucket_details_from_record(model_weight_token: &ModelWeightToken, deps: &Deps) -> AnyhowResult<Option<CopiedFileData>> {
  let maybe_model_weight_record =
      get_weight_by_token(model_weight_token, true, &deps.mysql_production).await?;

  let model_weight_record = match maybe_model_weight_record {
    None => return Ok(None),
    Some(record) => record,
  };

  let bucket_path = match model_weight_record.weights_type {
    WeightsType::RvcV2 => WeightFileBucketPath::rvc_model_file_from_object_hash(&model_weight_record.public_bucket_hash),
    WeightsType::SoVitsSvc => WeightFileBucketPath::svc_model_file_from_object_hash(&model_weight_record.public_bucket_hash),
    _ => return Ok(None), // NB: Stable Diffusion, etc. aren't valid for migration
  };

  Ok(Some(CopiedFileData {
    bucket_path,
    file_sha_hash: model_weight_record.file_checksum_sha2,
  }))
}