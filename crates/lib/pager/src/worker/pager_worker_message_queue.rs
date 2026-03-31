use std::collections::VecDeque;
use std::sync::{Arc, Mutex, Condvar};

use log::warn;

use crate::error::pager_error::PagerError;
use crate::error::pager_system_error::PagerSystemError;
use crate::notification::notification_details::NotificationDetails;

const DEFAULT_MAX_SIZE: usize = 256;

/// A thread-safe bounded ring buffer for pager notifications.
///
/// When the queue is full, the oldest item is dropped to make room.
/// The worker thread blocks on `wait_and_drain()` until items are available.
pub struct PagerWorkerMessageQueue {
  inner: Mutex<VecDeque<NotificationDetails>>,
  condvar: Condvar,
  max_size: usize,
}

impl PagerWorkerMessageQueue {
  pub fn new() -> Self {
    Self::with_capacity(DEFAULT_MAX_SIZE)
  }

  pub fn with_capacity(max_size: usize) -> Self {
    Self {
      inner: Mutex::new(VecDeque::with_capacity(max_size)),
      condvar: Condvar::new(),
      max_size,
    }
  }

  /// Push a notification onto the queue.
  ///
  /// If the queue is full, the oldest item is dropped and a warning is logged.
  /// Returns `Ok(Some(notification))` if an old item was evicted, `Ok(None)` otherwise.
  pub fn push(&self, notification: NotificationDetails) -> Result<Option<NotificationDetails>, PagerError> {
    let mut queue = self.inner.lock()
      .map_err(|e| PagerSystemError::MutexPoisoned(format!("push: {}", e)))?;

    let dropped = if queue.len() >= self.max_size {
      let old = queue.pop_front();
      if let Some(ref n) = old {
        warn!("Pager queue full (max={}). Dropped oldest: {}", self.max_size, n.title);
      }
      old
    } else {
      None
    };

    queue.push_back(notification);
    self.condvar.notify_one();
    Ok(dropped)
  }

  /// Block until at least one item is available, then drain all items.
  ///
  /// Returns an error if the mutex is poisoned.
  pub fn wait_and_drain(&self) -> Result<Vec<NotificationDetails>, PagerError> {
    let mut queue = self.inner.lock()
      .map_err(|e| PagerSystemError::MutexPoisoned(format!("wait_and_drain lock: {}", e)))?;

    while queue.is_empty() {
      queue = self.condvar.wait(queue)
        .map_err(|e| PagerSystemError::MutexPoisoned(format!("wait_and_drain wait: {}", e)))?;
    }

    let items: Vec<NotificationDetails> = queue.drain(..).collect();
    Ok(items)
  }

  /// Non-blocking drain of all currently queued items.
  pub fn drain_available(&self) -> Result<Vec<NotificationDetails>, PagerError> {
    let mut queue = self.inner.lock()
      .map_err(|e| PagerSystemError::MutexPoisoned(format!("drain_available: {}", e)))?;
    Ok(queue.drain(..).collect())
  }

  /// Wake up any thread blocked on `wait_and_drain()`.
  ///
  /// Used during shutdown to unblock the worker thread.
  pub fn notify_all(&self) {
    self.condvar.notify_all();
  }

  pub fn len(&self) -> Result<usize, PagerError> {
    let queue = self.inner.lock()
      .map_err(|e| PagerSystemError::MutexPoisoned(format!("len: {}", e)))?;
    Ok(queue.len())
  }

  pub fn is_empty(&self) -> Result<bool, PagerError> {
    Ok(self.len()? == 0)
  }
}

pub fn new_shared_queue() -> Arc<PagerWorkerMessageQueue> {
  Arc::new(PagerWorkerMessageQueue::new())
}

pub fn new_shared_queue_with_capacity(max_size: usize) -> Arc<PagerWorkerMessageQueue> {
  Arc::new(PagerWorkerMessageQueue::with_capacity(max_size))
}
