use std::sync::{Arc, RwLock};

use anyhow::anyhow;

use errors::AnyhowResult;

use crate::caching::cache_miss_strategizer::{CacheMissStrategizer, CacheMissStrategy};

/// Keep track of multiple caches, each with different time penalties.
/// (This isn't strictly necessary)
pub struct MultiCacheMissStrategizer {
  in_memory_log: CacheMissStrategizer<String>,
  on_disk_log: CacheMissStrategizer<String>,
  // ... future caches ?
}

/// And the Sync/Send threadsafe + interior mutability version.
#[derive(Clone)]
pub struct SyncMultiCacheMissStrategizer {
  multi_cache_log: Arc<RwLock<MultiCacheMissStrategizer>>,
}

impl SyncMultiCacheMissStrategizer {
  pub fn new(
    in_memory_log: CacheMissStrategizer<String>,
    on_disk_log: CacheMissStrategizer<String>,
  ) -> Self {
    let multi_cache_log = MultiCacheMissStrategizer::new(
      in_memory_log,
      on_disk_log,
    );
    Self {
      multi_cache_log: Arc::new(RwLock::new(multi_cache_log)),
    }
  }

  #[must_use]
  pub fn memory_cache_miss(&self, token: &str) -> AnyhowResult<CacheMissStrategy> {
    let result = self.multi_cache_log
        .write()
        .map(|mut cache_logs| cache_logs.memory_cache_miss(token))
        .map_err(|err| anyhow!("mutex error: {:?}", err))?;
    Ok(result)
  }

  #[must_use]
  pub fn disk_cache_miss(&self, token: &str) -> AnyhowResult<CacheMissStrategy> {
    let result = self.multi_cache_log
        .write()
        .map(|mut cache_logs| cache_logs.disk_cache_miss(token))
        .map_err(|err| anyhow!("mutex error: {:?}", err))?;
    Ok(result)
  }
}

impl MultiCacheMissStrategizer {
  pub fn new(
    in_memory_log: CacheMissStrategizer<String>,
    on_disk_log: CacheMissStrategizer<String>,
  ) -> Self {
    Self {
      in_memory_log,
      on_disk_log,
    }
  }

  #[must_use]
  pub fn memory_cache_miss(&mut self, token: &str) -> CacheMissStrategy {
    self.in_memory_log.cache_miss(token.to_string())
  }

  #[must_use]
  pub fn disk_cache_miss(&mut self, token: &str) -> CacheMissStrategy {
    self.on_disk_log.cache_miss(token.to_string())
  }
}
