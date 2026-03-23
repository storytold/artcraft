use std::collections::HashMap;
use std::sync::{Arc, RwLock};

use anyhow::anyhow;

use enums_db::by_table::generic_inference_jobs::inference_category::InferenceCategory;
use enums_db::by_table::generic_inference_jobs::inference_model_type::InferenceModelType;
use errors::AnyhowResult;

/// Associate model tokens with these to know immediately what metadata to populate an inference job with.
/// This will prevent having to look up the model record directly upon enqueue.
#[derive(Clone, Debug)]
pub struct ModelInfoForInferenceJob {
  /// Which inference category the model token falls under.
  pub job_inference_category: InferenceCategory,
  /// Which model type the model token falls under.
  pub job_model_type: InferenceModelType,
}

/// Model token to type will never change, so we can cache them indefinitely.
/// This is for generic inference jobs only.
#[derive(Clone)]
pub struct ModelTokenToInfoCache {
  database: Arc<RwLock<HashMap<String, ModelInfoForInferenceJob>>>,
}

impl ModelTokenToInfoCache {
  pub fn new() -> Self {
    Self {
      database: Arc::new(RwLock::new(HashMap::new())),
    }
  }

  pub fn insert_one(&self, token: &str, info: &ModelInfoForInferenceJob) -> AnyhowResult<()> {
    match self.database.write() {
      Err(err) => return Err(anyhow!("lock err: {:?}", err)),
      Ok(mut lock) => {
        lock.insert(token.to_string(), info.clone());
      }
    }
    Ok(())
  }

  pub fn insert_many(&self, records: Vec<(String, ModelInfoForInferenceJob)>) -> AnyhowResult<()> {
    match self.database.write() {
      Err(err) => return Err(anyhow!("lock err: {:?}", err)),
      Ok(mut lock) => {
        for (token, info) in records.into_iter() {
          lock.insert(token, info);
        }
      }
    }
    Ok(())
  }

  pub fn get_info(&self, token: &str) -> AnyhowResult<Option<ModelInfoForInferenceJob>> {
    match self.database.read() {
      Err(err) => Err(anyhow!("lock err: {:?}", err)),
      Ok(lock) => {
        Ok(lock.get(token).map(|item| item.clone()))
      }
    }
  }
}
