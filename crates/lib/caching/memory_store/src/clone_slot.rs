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

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn an_empty_slot_has_nothing() {
    let slot = CloneSlot::<String>::empty();
    assert!(slot.is_none().unwrap());
    assert!(!slot.is_some().unwrap());
    assert_eq!(slot.get_clone().unwrap(), None);
    assert!(slot.get_clone_required().is_err());
  }

  #[test]
  fn a_set_value_can_be_read_back() {
    let slot = CloneSlot::empty();
    slot.set_clone(&"hello".to_string()).unwrap();
    assert!(slot.is_some().unwrap());
    assert_eq!(slot.get_clone().unwrap(), Some("hello".to_string()));
    assert_eq!(slot.get_clone_required().unwrap(), "hello");
  }

  #[test]
  fn clear_and_take_empty_the_slot() {
    let slot = CloneSlot::with_clone(&1);
    assert_eq!(slot.take().unwrap(), Some(1));
    assert!(slot.is_none().unwrap());
    slot.set_clone(&2).unwrap();
    slot.clear().unwrap();
    assert!(slot.is_none().unwrap());
    assert_eq!(slot.take().unwrap(), None);
  }

  #[test]
  fn clones_share_the_same_value() {
    let slot = CloneSlot::empty();
    let other = slot.clone();
    slot.set_clone(&5).unwrap();
    assert_eq!(other.get_clone().unwrap(), Some(5));
  }
}
