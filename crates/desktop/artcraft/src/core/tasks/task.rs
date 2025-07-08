use multi_index_map::MultiIndexMap;
use crate::core::tasks::task_id::TaskId;
use crate::core::tasks::task_provider::TaskProvider;
use crate::core::tasks::task_provider_job_id::TaskProviderJobId;
use crate::core::tasks::task_state::TaskState;
use crate::core::tasks::task_type::TaskType;

/// The provider's native identifier for the task.
pub type ProviderTaskId = String;

#[derive(MultiIndexMap, Debug, Clone)]
#[multi_index_derive(Debug)]
#[multi_index_hash(rustc_hash::FxBuildHasher)]
pub struct Task {
  #[multi_index(hashed_unique)]
  pub id: TaskId,

  #[multi_index(hashed_non_unique)]
  pub task_state: TaskState,
  
  pub task_type: Option<TaskType>,

  #[multi_index(hashed_non_unique)]
  pub provider: Option<TaskProvider>,
  
  /// Identifier used by the provider to track the job.
  #[multi_index(hashed_unique)]
  pub provider_job_id: Option<TaskProviderJobId>,
  
  /// If the frontend is subscribing, it might have an identifier
  pub frontend_subscriber_id: Option<String>,
  
  /// If the frontend is subscribing, it might have a payload.
  /// This is opaque, but could be for instance base64-encoded JSON.
  pub frontend_subscriber_payload: Option<String>,
  
  // TODO: Submitted and completion datetimes
  
  // TODO: Progress
  
  // TODO: Completion media file, completion batch token
}
