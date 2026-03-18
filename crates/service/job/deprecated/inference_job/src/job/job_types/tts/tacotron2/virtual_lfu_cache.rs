use std::collections::HashSet;
use std::sync::{Arc, RwLock};

use anyhow::anyhow;
use lfu::LFUCache;

use errors::AnyhowResult;

/// This stands in front of the python HTTP sidecar and controls which
/// models get to remain in memory. The Python sidecar keeps multiple
/// models around, and Rust dictates which ones to keep and which to
/// purge.
pub struct VirtualLfuCache {
  cache: LFUCache<String, ()>,
}

/// And the Sync/Send threadsafe + interior mutability version.
#[derive(Clone)]
pub struct SyncVirtualLfuCache {
  cache: Arc::<RwLock<VirtualLfuCache>>
}

impl VirtualLfuCache {

  pub fn new(capacity: usize) -> AnyhowResult<Self> {
    let cache = LFUCache::with_capacity(capacity)
        .map_err(|e| anyhow!("Error creating cache (probably capacity): {:?}", e))?;
    Ok(Self {
      cache,
    })
  }

  pub fn in_cache(&self, model: &String) -> bool {
    self.cache.contains(model)
  }

  /// Returns the evicted entry.
  pub fn insert_returning_replaced(&mut self, path: &str) -> Option<String> {
    let initial_keys = self.get_keyset();

    self.cache.set(path.to_string(), ());

    let after_keys = self.get_keyset();

    let difference = initial_keys.difference(&after_keys);

    difference.last()
        .map(|item| item.to_string())
  }

  pub fn size(&self) -> usize {
    self.cache.len()
  }

  fn get_keyset(&self) -> HashSet<String> {
    // NB: This only makes sense for our use while we're using small caches.
    let mut key_set = HashSet::with_capacity(self.size());
    for (k, _) in self.cache.iter() {
      key_set.insert(k.to_string());
    }
    key_set
  }
}

impl SyncVirtualLfuCache {

  pub fn new(capacity: usize) -> AnyhowResult<Self> {
    let cache = VirtualLfuCache::new(capacity)?;
    Ok(Self {
      cache: Arc::new(RwLock::new(cache)),
    })
  }

  pub fn in_cache(&self, model: &String) -> AnyhowResult<bool> {
    let exists = self.cache
        .read()
        .map(|cache| cache.in_cache(model))
        .map_err(|err| anyhow!("mutex error: {:?}", err))?;
    Ok(exists)
  }

  /// Returns the evicted entry.
  pub fn insert_returning_replaced(&self, path: &str) -> AnyhowResult<Option<String>> {
    let maybe_replaced = self.cache
        .write()
        .map(|mut cache| cache.insert_returning_replaced(path))
        .map_err(|err| anyhow!("mutex error: {:?}", err))?;
    Ok(maybe_replaced)
  }

  pub fn size(&self) -> AnyhowResult<usize> {
    let size = self.cache
        .read()
        .map(|cache| cache.size())
        .map_err(|err| anyhow!("mutex error: {:?}", err))?;
    Ok(size)
  }

  fn get_keyset(&self) -> AnyhowResult<HashSet<String>> {
    let key_set = self.cache
        .read()
        .map(|cache| cache.get_keyset())
        .map_err(|err| anyhow!("mutex error: {:?}", err))?;
    Ok(key_set)
  }
}

#[cfg(test)]
pub mod tests {
  use crate::job::job_types::tts::tacotron2::virtual_lfu_cache::VirtualLfuCache;

  #[test]
  fn large_capacity_does_not_shed() {
    let mut cache = VirtualLfuCache::new(10).unwrap();
    cache.insert_returning_replaced("1");
    cache.insert_returning_replaced("2");
    cache.insert_returning_replaced("3");
    cache.insert_returning_replaced("4");
    cache.insert_returning_replaced("5");
    cache.insert_returning_replaced("6");
    cache.insert_returning_replaced("7");
    cache.insert_returning_replaced("8");
    cache.insert_returning_replaced("9");
    assert!(cache.insert_returning_replaced("10").is_none()); // Does not remove
    assert!(cache.insert_returning_replaced("11").is_some()); // Removes
    assert_eq!(cache.size(), 10);
  }

  #[test]
  fn insert_beyond_capacity() {
    let mut cache = VirtualLfuCache::new(3).unwrap();
    assert_eq!(cache.size(), 0);
    cache.insert_returning_replaced("foo");
    assert_eq!(cache.size(), 1);
    cache.insert_returning_replaced("bar");
    assert_eq!(cache.size(), 2);
    cache.insert_returning_replaced("baz");
    assert_eq!(cache.size(), 3);
    cache.insert_returning_replaced("bin");
    assert_eq!(cache.size(), 3);
    cache.insert_returning_replaced("bin");
    assert_eq!(cache.size(), 3);
    cache.insert_returning_replaced("111111111111111111");
    assert_eq!(cache.size(), 3);
  }

  fn repeated_insert_single_key() {
    let mut cache = VirtualLfuCache::new(3).unwrap();
    assert_eq!(cache.size(), 0);
    for _ in 0..10 {
      cache.insert_returning_replaced("foo");
    }
    assert_eq!(cache.size(), 1);
  }

  #[test]
  fn returns_first_for_eviction_when_all_used_once() {
    let mut cache = VirtualLfuCache::new(3).unwrap();
    cache.insert_returning_replaced("foo");
    cache.insert_returning_replaced("bar");
    cache.insert_returning_replaced("baz");
    let discarded = cache.insert_returning_replaced("bin");
    assert_eq!(discarded, Some("foo".to_string()));

    assert_eq!(false, cache.in_cache(&"foo".to_string()));
    assert_eq!(true, cache.in_cache(&"bar".to_string()));
    assert_eq!(true, cache.in_cache(&"baz".to_string()));
    assert_eq!(true, cache.in_cache(&"bin".to_string()));
  }

  #[test]
  fn retains_frequent_value() {
    let mut cache = VirtualLfuCache::new(3).unwrap();
    for _ in 0..10 {
      cache.insert_returning_replaced("foo");
    }
    cache.insert_returning_replaced("bar");
    cache.insert_returning_replaced("baz");
    let discarded = cache.insert_returning_replaced("bin");
    assert_eq!(discarded, Some("bar".to_string()));

    assert_eq!(true, cache.in_cache(&"foo".to_string()));
    assert_eq!(false, cache.in_cache(&"bar".to_string()));
    assert_eq!(true, cache.in_cache(&"baz".to_string()));
    assert_eq!(true, cache.in_cache(&"bin".to_string()));
  }

  #[test]
  fn retains_second_frequent_value() {
    let mut cache = VirtualLfuCache::new(3).unwrap();
    for _ in 0..10 {
      cache.insert_returning_replaced("foo");
    }
    for _ in 0..2 {
      cache.insert_returning_replaced("bar");
    }
    cache.insert_returning_replaced("baz");
    let discarded = cache.insert_returning_replaced("bin");
    assert_eq!(discarded, Some("baz".to_string()));

    assert_eq!(true, cache.in_cache(&"foo".to_string()));
    assert_eq!(true, cache.in_cache(&"bar".to_string()));
    assert_eq!(false, cache.in_cache(&"baz".to_string()));
    assert_eq!(true, cache.in_cache(&"bin".to_string()));
  }
}
