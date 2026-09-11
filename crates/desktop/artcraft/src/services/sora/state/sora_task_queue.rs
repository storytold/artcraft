use chrono::{DateTime, Utc};
use errors::AnyhowResult;
use indexmap::IndexMap;
use openai_sora_client::requests::common::task_id::TaskId;
use std::collections::HashSet;
use std::sync::{Arc, RwLock};

#[derive(Clone)]
pub struct TaskDetails {
  pub enqueue_time: DateTime<Utc>
}

impl TaskDetails {
  pub fn new() -> Self {
    Self {
      enqueue_time: Utc::now()
    }
  }
}

#[derive(Clone)]
pub struct TaskIdAndDetails {
  pub task_id: TaskId,
  pub details: TaskDetails,
}

#[derive(Clone)]
pub struct SoraTaskQueue {
  // Insertion-order map of task IDs to task details
  queue: Arc<RwLock<IndexMap<TaskId, TaskDetails>>>
}

impl SoraTaskQueue {
  pub fn new() -> Self {
    Self {
      queue: Arc::new(RwLock::new(IndexMap::new()))
    }
  }

  /// Determine if queue is empty
  /// This is an O(1) operation.
  pub fn is_empty(&self) -> AnyhowResult<bool> {
    match self.queue.read() {
      Err(err) => {
        Err(anyhow::anyhow!("Failed to acquire read lock: {:?}", err))
      }
      Ok(lock) => Ok(lock.is_empty())
    }
  }

  /// Get length of set
  /// This is an O(1) operation.
  pub fn len(&self) -> AnyhowResult<usize> {
    match self.queue.read() {
      Err(err) => {
        Err(anyhow::anyhow!("Failed to acquire read lock: {:?}", err))
      }
      Ok(lock) => Ok(lock.len())
    }
  }

  /// Determine if the key is in the queue
  /// This is an O(1) operation.
  pub fn contains_key(&self, task_id: &TaskId) -> AnyhowResult<bool> {
    match self.queue.read() {
      Err(err) => {
        Err(anyhow::anyhow!("Failed to acquire read lock: {:?}", err))
      }
      Ok(lock) => Ok(lock.contains_key(task_id))
    }
  }

  /// Get the first enqueued task
  /// This is an O(1) operation.
  pub fn first(&self) -> AnyhowResult<Option<TaskIdAndDetails>> {
    match self.queue.read() {
      Err(err) => {
        Err(anyhow::anyhow!("Failed to acquire read lock: {:?}", err))
      }
      Ok(lock) => match lock.first() {
        None => Ok(None),
        Some((task_id, task_details)) => Ok(Some(TaskIdAndDetails {
          task_id: task_id.clone(),
          details: task_details.clone(),
        }))
      }
    }
  }

  /// Get the last enqueued task
  /// This is an O(1) operation.
  pub fn last(&self) -> AnyhowResult<Option<TaskIdAndDetails>> {
    match self.queue.read() {
      Err(err) => {
        Err(anyhow::anyhow!("Failed to acquire read lock: {:?}", err))
      }
      Ok(lock) => match lock.last() {
        None => Ok(None),
        Some((task_id, task_details)) => Ok(Some(TaskIdAndDetails {
          task_id: task_id.clone(),
          details: task_details.clone(),
        }))
      }
    }
  }

  /// Insert a new task. If a task already exists, we update its value.
  /// This is an O(1) operation.
  pub fn insert(&self, task_id: &TaskId) -> AnyhowResult<Option<TaskDetails>> {
    match self.queue.write() {
      Err(err) => {
        Err(anyhow::anyhow!("Failed to acquire write lock: {:?}", err))
      }
      Ok(mut lock) => {
        // NB: Probably fine to compute TaskDetails here for now. We may eventually expose this if we include additional info.
        let task_details = TaskDetails::new();
        Ok(lock.insert(task_id.clone(), task_details))
      }
    }
  }

  /// Remove a task by ID.
  /// This is an O(n) operation.
  pub fn remove(&self, task_id: &TaskId) -> AnyhowResult<Option<TaskDetails>> {
    match self.queue.write() {
      Err(err) => {
        Err(anyhow::anyhow!("Failed to acquire write lock: {:?}", err))
      }
      Ok(mut lock) => {
        Ok(lock.shift_remove(task_id))
      }
    }
  }

  /// Remove a list of tasks by ID.
  /// This is an O(n) operation.
  pub fn remove_list(&self, task_ids: &[&TaskId]) -> AnyhowResult<()> {
    match self.queue.write() {
      Err(err) => {
        Err(anyhow::anyhow!("Failed to acquire write lock: {:?}", err))
      }
      Ok(mut lock) => {
        // TODO: Cleaner way to do this?
        let mut set : HashSet<&TaskId, _> = HashSet::with_capacity(task_ids.len());
        set.extend(task_ids);
        lock.retain(|k, v| !set.contains(k));
        Ok(())
      }
    }
  }
}

#[cfg(test)]
mod tests {
  use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
  use errors::AnyhowResult;
  use openai_sora_client::requests::common::task_id::TaskId;

  #[test]
  fn remove_list() -> AnyhowResult<()> {
    let task_queue = SoraTaskQueue::new();

    assert!(task_queue.is_empty()?);
    assert_eq!(task_queue.len()?, 0);

    task_queue.insert(&TaskId("a".to_string()))?;
    task_queue.insert(&TaskId("b".to_string()))?;
    task_queue.insert(&TaskId("c".to_string()))?;
    task_queue.insert(&TaskId("d".to_string()))?;
    task_queue.insert(&TaskId("e".to_string()))?;
    task_queue.insert(&TaskId("f".to_string()))?;

    assert!(!task_queue.is_empty()?);
    assert_eq!(task_queue.len()?, 6);

    task_queue.insert(&TaskId("a".to_string()))?;
    task_queue.insert(&TaskId("b".to_string()))?;
    task_queue.insert(&TaskId("c".to_string()))?;
    task_queue.insert(&TaskId("d".to_string()))?;
    task_queue.insert(&TaskId("e".to_string()))?;
    task_queue.insert(&TaskId("f".to_string()))?;

    assert!(!task_queue.is_empty()?);
    assert_eq!(task_queue.len()?, 6);

    task_queue.remove_list(&[
      &TaskId("a".to_string()),
      &TaskId("c".to_string()),
      &TaskId("e".to_string()),
    ])?;

    assert!(!task_queue.is_empty()?);
    assert_eq!(task_queue.len()?, 3);

    assert!(task_queue.contains_key(&TaskId("b".to_string()))?);
    assert!(task_queue.contains_key(&TaskId("d".to_string()))?);
    assert!(task_queue.contains_key(&TaskId("f".to_string()))?);

    assert!(!task_queue.contains_key(&TaskId("a".to_string()))?);
    assert!(!task_queue.contains_key(&TaskId("c".to_string()))?);
    assert!(!task_queue.contains_key(&TaskId("e".to_string()))?);

    task_queue.remove_list(&[
      &TaskId("foo".to_string()),
      &TaskId("bar".to_string()),
      &TaskId("baz".to_string()),
    ])?;

    assert!(!task_queue.is_empty()?);
    assert_eq!(task_queue.len()?, 3);

    assert!(task_queue.contains_key(&TaskId("b".to_string()))?);
    assert!(task_queue.contains_key(&TaskId("d".to_string()))?);
    assert!(task_queue.contains_key(&TaskId("f".to_string()))?);

    task_queue.remove_list(&[
      &TaskId("b".to_string()),
      &TaskId("d".to_string()),
      &TaskId("f".to_string()),
    ])?;

    assert!(task_queue.is_empty()?);
    assert_eq!(task_queue.len()?, 0);

    assert!(!task_queue.contains_key(&TaskId("b".to_string()))?);
    assert!(!task_queue.contains_key(&TaskId("d".to_string()))?);
    assert!(!task_queue.contains_key(&TaskId("f".to_string()))?);

    Ok(())
  }
}