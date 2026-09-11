use std::sync::{Arc, RwLock};
use log::error;
use crate::core::artcraft_error::ArtcraftError;

#[derive(Clone)]
pub struct WorldlabsBearerBridge {
  state: Arc<RwLock<Option<WorldlabsBearerBridgeInner>>>
}

#[derive(Clone, Debug)]
pub struct WorldlabsBearerBridgeInner {
  pub bearer_token: String,
  pub refresh_token: String,
}

impl WorldlabsBearerBridge {
  pub fn empty() -> Self {
    Self {
      state: Arc::new(RwLock::new(None)),
    }
  }

  pub fn clear(&self) -> Result<(), ArtcraftError> {
    match self.state.write() {
      Ok(mut state) => {
        *state = None;
        Ok(())
      }
      Err(err) => {
        error!("Lock poisoned: {:?}", err);
        Err(ArtcraftError::RwLockWriteError)
      }
    }
  }

  pub fn get(&self) -> Result<Option<WorldlabsBearerBridgeInner>, ArtcraftError> {
    match self.state.read() {
      Ok(state) => {
        Ok(state.clone())
      }
      Err(err) => {
        error!("Lock poisoned: {:?}", err);
        Err(ArtcraftError::RwLockReadError)
      }
    }
  }

  pub fn set(&self, new_state: WorldlabsBearerBridgeInner) -> Result<(), ArtcraftError> {
    match self.state.write() {
      Ok(mut state) => {
        *state = Some(new_state);
        Ok(())
      }
      Err(err) => {
        error!("Lock poisoned: {:?}", err);
        Err(ArtcraftError::RwLockReadError)
      }
    }
  }
}
