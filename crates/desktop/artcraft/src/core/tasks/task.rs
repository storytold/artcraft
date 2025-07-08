use crate::core::tasks::task_id::TaskId;
use crate::core::tasks::task_provider::TaskProvider;
use crate::core::tasks::task_provider_job_id::TaskProviderJobId;
use crate::core::tasks::task_type::TaskType;

/// The provider's native identifier for the task.
pub type ProviderTaskId = String;

#[derive(Clone, Debug)]
pub struct Task {
  pub id: TaskId,
  
  pub task_type: Option<TaskType>,
  
  pub provider: Option<TaskProvider>,
  
  /// Identifier used by the provider to track the job.
  pub provider_job_id: Option<TaskProviderJobId>,
  
  /// If the frontend is subscribing, it might have an identifier
  pub frontend_subscriber_id: Option<String>,
  
  /// If the frontend is subscribing, it might have a payload.
  /// This is opaque, but could be for instance base64-encoded JSON.
  pub frontend_subscriber_payload: Option<String>,
}
