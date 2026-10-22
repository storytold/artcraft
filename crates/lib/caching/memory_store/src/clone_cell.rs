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

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn holds_the_value_it_was_made_with() {
    assert_eq!(CloneCell::with_clone(&"a".to_string()).get_clone().unwrap(), "a");
    assert_eq!(CloneCell::with_owned("b".to_string()).get_clone().unwrap(), "b");
  }

  #[test]
  fn set_replaces_the_value() {
    let cell = CloneCell::with_owned(1);
    cell.set_clone(&2).unwrap();
    assert_eq!(cell.get_clone().unwrap(), 2);
    cell.set_owned(3).unwrap();
    assert_eq!(cell.get_clone().unwrap(), 3);
  }

  #[test]
  fn clones_share_the_same_value() {
    let cell = CloneCell::with_owned(1);
    let other = cell.clone();
    cell.set_owned(9).unwrap();
    assert_eq!(other.get_clone().unwrap(), 9);
  }
}
