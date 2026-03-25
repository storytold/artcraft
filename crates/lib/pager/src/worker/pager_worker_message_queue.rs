use std::collections::VecDeque;
use std::sync::{Arc, Mutex, Condvar};

use log::warn;

use crate::error::pager_service_error::PagerServiceError;
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
  /// Returns `Ok(Some(summary))` if an old item was evicted, `Ok(None)` otherwise.
  pub fn push(&self, notification: NotificationDetails) -> Result<Option<String>, PagerServiceError> {
    let mut queue = self.inner.lock()
      .map_err(|e| PagerServiceError::MutexPoisoned(format!("push: {}", e)))?;

    let dropped = if queue.len() >= self.max_size {
      let old = queue.pop_front();
      let dropped_summary = old.as_ref().map(|n| n.summary.clone());
      if let Some(ref summary) = dropped_summary {
        warn!("Pager queue full (max={}). Dropped oldest: {}", self.max_size, summary);
      }
      dropped_summary
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
  pub fn wait_and_drain(&self) -> Result<Vec<NotificationDetails>, PagerServiceError> {
    let mut queue = self.inner.lock()
      .map_err(|e| PagerServiceError::MutexPoisoned(format!("wait_and_drain lock: {}", e)))?;

    while queue.is_empty() {
      queue = self.condvar.wait(queue)
        .map_err(|e| PagerServiceError::MutexPoisoned(format!("wait_and_drain wait: {}", e)))?;
    }

    let items: Vec<NotificationDetails> = queue.drain(..).collect();
    Ok(items)
  }

  /// Non-blocking drain of all currently queued items.
  pub fn drain_available(&self) -> Result<Vec<NotificationDetails>, PagerServiceError> {
    let mut queue = self.inner.lock()
      .map_err(|e| PagerServiceError::MutexPoisoned(format!("drain_available: {}", e)))?;
    Ok(queue.drain(..).collect())
  }

  /// Wake up any thread blocked on `wait_and_drain()`.
  ///
  /// Used during shutdown to unblock the worker thread.
  pub fn notify_all(&self) {
    self.condvar.notify_all();
  }

  pub fn len(&self) -> Result<usize, PagerServiceError> {
    let queue = self.inner.lock()
      .map_err(|e| PagerServiceError::MutexPoisoned(format!("len: {}", e)))?;
    Ok(queue.len())
  }

  pub fn is_empty(&self) -> Result<bool, PagerServiceError> {
    Ok(self.len()? == 0)
  }
}

/// Shareable handle to a message queue.
pub type SharedMessageQueue = Arc<PagerWorkerMessageQueue>;

pub fn new_shared_queue() -> SharedMessageQueue {
  Arc::new(PagerWorkerMessageQueue::new())
}

pub fn new_shared_queue_with_capacity(max_size: usize) -> SharedMessageQueue {
  Arc::new(PagerWorkerMessageQueue::with_capacity(max_size))
}
