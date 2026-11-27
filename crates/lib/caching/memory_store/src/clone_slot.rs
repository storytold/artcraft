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

impl<T: Clone> CloneSlot<T> {
  pub fn empty() -> Self {
    Self { store: Arc::new(RwLock::new(None)) }
  }

  pub fn with_clone(object: &T) -> Self {
    Self { store: Arc::new(RwLock::new(Some(object.clone()))) }
  }

  pub fn with_owned(object: T) -> Self {
    Self { store: Arc::new(RwLock::new(Some(object))) }
  }

  pub fn get_clone(&self) -> AnyhowResult<Option<T>> {
    match self.store.read() {
      Err(err) => Err(anyhow!("Failed to acquire read lock: {err:?}")),
      Ok(store) => Ok(store.clone()),
    }
  }

  pub fn get_clone_required(&self) -> AnyhowResult<T> {
    match self.store.read() {
      Err(err) => Err(anyhow!("Failed to acquire read lock: {err:?}")),
      Ok(store) => match &*store {
        None => Err(anyhow!("Required stored item is not set")),
        Some(inner) => Ok(inner.clone()),
      },
    }
  }

  pub fn set_clone(&self, value: &T) -> AnyhowResult<()> {
    match self.store.write() {
      Err(err) => Err(anyhow!("Failed to acquire write lock: {err:?}")),
      Ok(mut store) => {
        *store = Some(value.clone());
        Ok(())
      },
    }
  }

  pub fn set_owned(&self, value: T) -> AnyhowResult<()> {
    match self.store.write() {
      Err(err) => Err(anyhow!("Failed to acquire write lock: {err:?}")),
      Ok(mut store) => {
        *store = Some(value);
        Ok(())
      },
    }
  }

  pub fn clear(&self) -> AnyhowResult<()> {
    match self.store.write() {
      Err(err) => Err(anyhow!("Failed to acquire write lock: {err:?}")),
      Ok(mut store) => {
        *store = None;
        Ok(())
      },
    }
  }

  pub fn take(&self) -> AnyhowResult<Option<T>> {
    match self.store.write() {
      Err(err) => Err(anyhow!("Failed to acquire write lock: {err:?}")),
      Ok(mut store) => Ok(store.take()),
    }
  }

  pub fn is_some(&self) -> AnyhowResult<bool> {
    match self.store.read() {
      Err(err) => Err(anyhow!("Failed to acquire read lock: {err:?}")),
      Ok(store) => Ok(store.is_some()),
    }
  }

  pub fn is_none(&self) -> AnyhowResult<bool> {
    match self.store.read() {
      Err(err) => Err(anyhow!("Failed to acquire read lock: {err:?}")),
      Ok(store) => Ok(store.is_none()),
    }
  }
}

impl<T: Clone> Default for CloneSlot<T> {
  fn default() -> Self {
    Self::empty()
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use std::thread;

  #[test]
  fn test_empty_and_default() {
    let slot: CloneSlot<String> = CloneSlot::empty();
    assert!(slot.is_none().unwrap());
    assert!(!slot.is_some().unwrap());
    assert_eq!(slot.get_clone().unwrap(), None);

    let default_slot: CloneSlot<String> = CloneSlot::default();
    assert!(default_slot.is_none().unwrap());
  }

  #[test]
  fn test_with_clone_and_owned() {
    let val = String::from("initial");
    let slot = CloneSlot::with_clone(&val);
    assert!(slot.is_some().unwrap());
    assert_eq!(slot.get_clone().unwrap(), Some("initial".to_string()));

    let owned_slot = CloneSlot::with_owned(100);
    assert_eq!(owned_slot.get_clone().unwrap(), Some(100));
  }

  #[test]
  fn test_get_clone_required() {
    let slot: CloneSlot<i32> = CloneSlot::empty();
    assert!(slot.get_clone_required().is_err());

    slot.set_owned(99).unwrap();
    assert_eq!(slot.get_clone_required().unwrap(), 99);
  }

  #[test]
  fn test_set_take_and_clear() {
    let slot = CloneSlot::empty();
    slot.set_clone(&"alpha".to_string()).unwrap();
    assert_eq!(slot.get_clone().unwrap(), Some("alpha".to_string()));

    let taken = slot.take().unwrap();
    assert_eq!(taken, Some("alpha".to_string()));
    assert!(slot.is_none().unwrap());

    slot.set_owned("beta".to_string()).unwrap();
    assert!(slot.is_some().unwrap());
    slot.clear().unwrap();
    assert!(slot.is_none().unwrap());
  }

  #[test]
  fn test_multithreaded_slot() {
    let slot = CloneSlot::empty();
    let mut handles = Vec::new();

    for i in 0..6 {
      let slot_clone = slot.clone();
      let handle = thread::spawn(move || {
        let _ = slot_clone.set_owned(i);
        let _ = slot_clone.get_clone();
      });
      handles.push(handle);
    }

    for handle in handles {
      handle.join().unwrap();
    }

    assert!(slot.is_some().unwrap());
  }
}
