use candle_core::Tensor;
use memory_caching::arc_sieve::ArcSieve;

pub struct PromptCache {
  cache: ArcSieve<String, Tensor>,
}

impl PromptCache {
  pub fn with_capacity(capacity: usize) -> anyhow::Result<Self> {
    Ok(Self {
      cache: ArcSieve::with_capacity(capacity)?,
    })
  }
  
  pub fn get_copy(&self, key: &String) -> anyhow::Result<Option<Tensor>> {
    self.cache.get_copy(key)
  }
  
  pub fn store_copy(&self, key: &String, value: &Tensor) -> anyhow::Result<()> {
    self.cache.store_copy(key, value)
  }
}
