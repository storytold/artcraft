use anyhow::anyhow;
use errors::AnyhowResult;
use std::sync::{Arc, RwLock};

/// Store a threadsafe value that can be passed around and cloned.
/// The object is interior mutable so it can be changed without mut/&mut references.
/// This is useful for storing a value that may or may not be set between threads.
/// 
/// Unlike `CloneSlot`, this always holds an object.
#[derive(Clone)]
pub struct CloneCell<T: Clone> {
  pub store: Arc<RwLock<T>>,
}

impl <T: Clone> CloneCell<T> {
  pub fn with_clone(object: &T) -> Self {
    Self {
      store: Arc::new(RwLock::new(object.clone())),
    }
  }

  pub fn with_owned(object: T) -> Self {
    Self {
      store: Arc::new(RwLock::new(object)),
    }
  }

  pub fn get_clone(&self) -> AnyhowResult<T> {
    match self.store.read() {
      Err(err) => Err(anyhow!("Failed to acquire read lock: {:?}", err)),
      Ok(store) => Ok(store.clone()),
    }
  }
  
  pub fn set_clone(&self, value: &T) -> AnyhowResult<()> {
    match self.store.write() {
      Err(err) => Err(anyhow!("Failed to acquire write lock: {:?}", err)),
      Ok(mut store) => {
        *store = value.clone();
        Ok(())
      }
    }
  }
  
  pub fn set_owned(&self, value: T) -> AnyhowResult<()> {
    match self.store.write() {
      Err(err) => Err(anyhow!("Failed to acquire write lock: {:?}", err)),
      Ok(mut store) => {
        *store = value;
        Ok(())
      }
    }
  }
}
