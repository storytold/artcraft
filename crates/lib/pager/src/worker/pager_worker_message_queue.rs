use std::collections::VecDeque;
use std::sync::{Arc, Mutex, Condvar};

use log::warn;

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
  /// Returns the dropped item's summary if one was evicted.
  pub fn push(&self, notification: NotificationDetails) -> Option<String> {
    let mut queue = self.inner.lock().unwrap();
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
    dropped
  }

  /// Block until at least one item is available, then drain all items.
  ///
  /// Returns `None` if the queue was poisoned (shouldn't happen in practice).
  pub fn wait_and_drain(&self) -> Option<Vec<NotificationDetails>> {
    let mut queue = self.inner.lock().ok()?;
    while queue.is_empty() {
      queue = self.condvar.wait(queue).ok()?;
    }
    let items: Vec<NotificationDetails> = queue.drain(..).collect();
    Some(items)
  }

  /// Non-blocking drain of all currently queued items.
  pub fn drain_available(&self) -> Vec<NotificationDetails> {
    let mut queue = self.inner.lock().unwrap();
    queue.drain(..).collect()
  }

  /// Wake up any thread blocked on `wait_and_drain()`.
  ///
  /// Used during shutdown to unblock the worker thread.
  pub fn notify_all(&self) {
    self.condvar.notify_all();
  }

  pub fn len(&self) -> usize {
    self.inner.lock().unwrap().len()
  }

  pub fn is_empty(&self) -> bool {
    self.len() == 0
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
