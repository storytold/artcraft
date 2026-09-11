use crate::core::artcraft_error::ArtcraftError;
use errors::AnyhowResult;
use grok_consumer_client::requests::image_websocket::grok_wrapped_websocket::GrokWrappedWebsocket;
use log::error;
use std::sync::{Arc, RwLock};


/// NB: This is inefficient because the websockets are locked at two layers.
/// Should be fine for our performance needs, though.
#[derive(Clone)]
pub struct GrokWebsocketManager {
  //websocket: Arc<RwLock<Option<GrokWebsocket>>>,
  websocket: Arc<RwLock<Option<()>>>,
}

impl GrokWebsocketManager {
  pub fn new() -> Self {
    Self {
      websocket: Arc::new(RwLock::new(None)),
    }
  }

  pub fn set_websocket(&self, websocket: GrokWrappedWebsocket) -> Result<(), ArtcraftError> {
    match self.websocket.write() {
      Ok(mut guard) => {
        //*guard = Some(websocket);
        *guard = Some(());
        Ok(())
      }
      Err(err) => {
        error!("Error writing locked websocket: {}", err);
        Err(ArtcraftError::RwLockWriteError)
      }
    }
  }

  pub fn clear_websocket(&self) -> Result<(), ArtcraftError> {
    match self.websocket.write() {
      Ok(mut guard) => {
        *guard = None;
        Ok(())
      }
      Err(err) => {
        error!("Error writing locked websocket: {}", err);
        Err(ArtcraftError::RwLockWriteError)
      }
    }
  }

  pub fn grab_websocket(&self) -> Result<Option<GrokWrappedWebsocket>, ArtcraftError> {
    match self.websocket.read() {
      Ok(guard) => {
        //Ok(guard.clone())
        Ok(None)
      }
      Err(err) => {
        error!("Error reading locked websocket: {}", err);
        Err(ArtcraftError::RwLockReadError)
      }
    }
  }
}
