use crate::core::artcraft_error::ArtcraftError;
use log::error;
use std::collections::VecDeque;
use std::sync::{Arc, Mutex};
use grok_consumer_client::requests::image_websocket::messages::websocket_client_message::ClientMessageAspectRatio;

#[derive(Clone)]
pub struct GrokImagePromptQueue {
  pub prompt_queue: Arc<Mutex<VecDeque<PromptItem>>>,
}


#[derive(Clone, Debug)]
pub struct PromptItem {
  /// Local database task ID
  pub task_id: String,
  
  /// Text prompt
  pub prompt: String,
  
  /// The aspect ratio of the image
  pub aspect_ratio: ClientMessageAspectRatio,
}

impl GrokImagePromptQueue {
  pub fn new() -> Self {
    Self {
      prompt_queue: Arc::new(Mutex::new(VecDeque::new())),
    }
  }
  
  pub fn enqueue(&self, prompt_item: PromptItem) -> Result<(), ArtcraftError> {
    match self.prompt_queue.lock() {
      Ok(mut queue) => {
        queue.push_back(prompt_item);
        Ok(())
      },
      Err(err) => {
        error!("Error locking prompt queue: {:?}", err);
        Err(ArtcraftError::MutexLockError)
      },
    }
  }
  
  pub fn dequeue(&self) -> Result<Option<PromptItem>, ArtcraftError> {
    match self.prompt_queue.lock() {
      Ok(mut queue) => {
        Ok(queue.pop_front())
      },
      Err(err) => {
        error!("Error locking prompt queue: {:?}", err);
        Err(ArtcraftError::MutexLockError)
      },
    }
  }

  pub fn is_empty(&self) -> Result<bool, ArtcraftError> {
    match self.prompt_queue.lock() {
      Ok(mut queue) => {
        Ok(queue.is_empty())
      },
      Err(err) => {
        error!("Error locking prompt queue: {:?}", err);
        Err(ArtcraftError::MutexLockError)
      },
    }
  }

  pub fn len(&self) -> Result<usize, ArtcraftError> {
    match self.prompt_queue.lock() {
      Ok(mut queue) => {
        Ok(queue.len())
      },
      Err(err) => {
        error!("Error locking prompt queue: {:?}", err);
        Err(ArtcraftError::MutexLockError)
      },
    }
  }
}
