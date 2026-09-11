use anyhow::anyhow;
use errors::AnyhowResult;
use std::sync::{Arc, RwLock};

/// Store a threadsafe value that can be passed around and cloned.
/// The object is interior mutable so it can be changed without mut/&mut references.
/// This is useful for storing a value that may or may not be set between threads.
/// 
/// Unlike `CloneCell`, this holds an optional object.
#[derive(Clone)]
pub struct CloneSlot<T: Clone> {
  pub store: Arc<RwLock<Option<T>>>,
}

impl <T: Clone> CloneSlot<T> {
  pub fn empty() -> Self {
    Self {
      store: Arc::new(RwLock::new(None)),
    }
  }
  
  pub fn with_clone(object: &T) -> Self {
    Self {
      store: Arc::new(RwLock::new(Some(object.clone()))),
    }
  }

  pub fn get_clone(&self) -> AnyhowResult<Option<T>> {
    match self.store.read() {
      Err(err) => Err(anyhow!("Failed to acquire read lock: {:?}", err)),
      Ok(store) => Ok(store.clone()),
    }
  }

  pub fn get_clone_required(&self) -> AnyhowResult<T> {
    match self.store.read() {
      Err(err) => Err(anyhow!("Failed to acquire read lock: {:?}", err)),
      Ok(store) => match &*store {
        None => Err(anyhow!("Required stored item is not set")),
        Some(inner) => Ok(inner.clone()),
      }
    }
  }

  pub fn set_clone(&self, value: &T) -> AnyhowResult<()> {
    match self.store.write() {
      Err(err) => Err(anyhow!("Failed to acquire write lock: {:?}", err)),
      Ok(mut store) => {
        *store = Some(value.clone());
        Ok(())
      }
    }
  }

  pub fn clear(&self) -> AnyhowResult<()> {
    match self.store.write() {
      Err(err) => Err(anyhow!("Failed to acquire write lock: {:?}", err)),
      Ok(mut store) => {
        *store = None; 
        Ok(())
      }
    }
  }

  pub fn take(&self) -> AnyhowResult<Option<T>> {
    match self.store.write() {
      Err(err) => Err(anyhow!("Failed to acquire write lock: {:?}", err)),
      Ok(mut store) => {
        Ok(store.take())
      }
    }
  }

  pub fn is_some(&self) -> AnyhowResult<bool> {
    match self.store.read() {
      Err(err) => Err(anyhow!("Failed to acquire read lock: {:?}", err)),
      Ok(store) => Ok(store.is_some()),
    }
  }
  
  pub fn is_none(&self) -> AnyhowResult<bool> {
    match self.store.read() {
      Err(err) => Err(anyhow!("Failed to acquire read lock: {:?}", err)),
      Ok(store) => Ok(store.is_none()),
    }
  }
}
