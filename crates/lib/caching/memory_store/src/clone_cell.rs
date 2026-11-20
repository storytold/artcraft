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

impl<T: Clone> CloneCell<T> {
  pub fn with_clone(object: &T) -> Self {
    Self { store: Arc::new(RwLock::new(object.clone())) }
  }

  pub fn with_owned(object: T) -> Self {
    Self { store: Arc::new(RwLock::new(object)) }
  }

  pub fn get_clone(&self) -> AnyhowResult<T> {
    match self.store.read() {
      Err(err) => Err(anyhow!("Failed to acquire read lock: {err:?}")),
      Ok(store) => Ok(store.clone()),
    }
  }

  pub fn set_clone(&self, value: &T) -> AnyhowResult<()> {
    match self.store.write() {
      Err(err) => Err(anyhow!("Failed to acquire write lock: {err:?}")),
      Ok(mut store) => {
        *store = value.clone();
        Ok(())
      },
    }
  }

  pub fn set_owned(&self, value: T) -> AnyhowResult<()> {
    match self.store.write() {
      Err(err) => Err(anyhow!("Failed to acquire write lock: {err:?}")),
      Ok(mut store) => {
        *store = value;
        Ok(())
      },
    }
  }
}

impl<T: Clone + Default> Default for CloneCell<T> {
  fn default() -> Self {
    Self::with_owned(T::default())
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use std::thread;

  #[test]
  fn test_with_clone() {
    let original = String::from("artcraft");
    let cell = CloneCell::with_clone(&original);
    assert_eq!(cell.get_clone().unwrap(), "artcraft");
  }

  #[test]
  fn test_with_owned() {
    let cell = CloneCell::with_owned(42);
    assert_eq!(cell.get_clone().unwrap(), 42);
  }

  #[test]
  fn test_default() {
    let cell: CloneCell<i32> = CloneCell::default();
    assert_eq!(cell.get_clone().unwrap(), 0);
  }

  #[test]
  fn test_set_clone_and_owned() {
    let cell = CloneCell::with_owned(10);
    assert_eq!(cell.get_clone().unwrap(), 10);

    let val = 20;
    cell.set_clone(&val).unwrap();
    assert_eq!(cell.get_clone().unwrap(), 20);

    cell.set_owned(30).unwrap();
    assert_eq!(cell.get_clone().unwrap(), 30);
  }

  #[test]
  fn test_multithreaded_read_write() {
    let cell = CloneCell::with_owned(0);
    let mut handles = Vec::new();

    for i in 1..=8 {
      let cell_clone = cell.clone();
      let handle = thread::spawn(move || {
        let current = cell_clone.get_clone().unwrap();
        let _ = cell_clone.set_owned(current + i);
      });
      handles.push(handle);
    }

    for handle in handles {
      handle.join().unwrap();
    }

    let final_val = cell.get_clone().unwrap();
    assert!(final_val > 0);
  }
}
