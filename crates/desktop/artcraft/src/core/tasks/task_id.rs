use idempotency::uuid::generate_random_uuid;

/// Our identifier for tasks.
/// These are ephemeral (for now), but may be peristed later on.
#[derive(Clone, Debug, Hash, PartialEq, Eq, PartialOrd, Ord)]
pub struct TaskId(String);

impl TaskId {
  pub fn generate() -> Self {
    let task_id = format!("tauri_task_{}", generate_random_uuid());
    Self(task_id)
  }
  
  pub fn from_str(task_id: &str) -> Self {
    Self(task_id.to_string())
  }
  
  pub fn to_string(&self) -> String {
    self.0.clone()
  }

  pub fn as_str(&self) -> &str {
    self.0.as_str()
  }
}
