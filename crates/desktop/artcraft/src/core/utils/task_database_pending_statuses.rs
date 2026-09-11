use enums::tauri::tasks::task_status::TaskStatus;
use once_cell::sync::Lazy;
use std::collections::HashSet;

/// Reused predicate for querying pending SQLite tasks
pub static TASK_DATABASE_PENDING_STATUSES: Lazy<HashSet<TaskStatus>> = Lazy::new(|| {
  let mut statuses = HashSet::new();
  statuses.insert(TaskStatus::Pending);
  statuses.insert(TaskStatus::Started);
  statuses.insert(TaskStatus::AttemptFailed);
  statuses
});
