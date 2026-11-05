use crate::connection::TaskDbConnection;
use crate::error::SqliteTasksError;
use crate::queries::task::warn_unreadable_task;
use chrono::{DateTime, Utc};
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_failure_type::TaskFailureType;
use enums::tauri::tasks::task_media_file_class::TaskMediaFileClass;
use enums::tauri::tasks::task_model_type::TaskModelType;
use enums::tauri::tasks::task_status::TaskStatus;
use enums::tauri::tasks::task_type::TaskType;
use enums::tauri::ux::tauri_command_caller::TauriCommandCaller;
use tokens::tokens::batch_generations::BatchGenerationToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::sqlite::tasks::TaskId;

pub struct TaskList {
  pub tasks: Vec<TaskItem>,
}

pub struct TaskItem {
  pub id: TaskId,
  pub status: TaskStatus,
  pub task_type: TaskType,
  pub model_type: Option<TaskModelType>,
  pub provider: Option<GenerationProvider>,
  pub provider_job_id: Option<String>,
  pub frontend_caller: Option<TauriCommandCaller>,
  pub frontend_subscriber_id: Option<String>,
  pub frontend_subscriber_payload: Option<String>,
  pub on_complete_primary_media_file_token: Option<MediaFileToken>,
  pub on_complete_primary_media_file_class: Option<TaskMediaFileClass>,
  pub on_complete_batch_token: Option<BatchGenerationToken>,
  pub on_complete_primary_media_file_cdn_url: Option<String>,
  pub on_complete_primary_media_file_thumbnail_url_template: Option<String>,
  pub on_failure_type: Option<TaskFailureType>,
  pub on_failure_message: Option<String>,
  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
  pub completed_at: Option<DateTime<Utc>>,
}

pub async fn list_tasks_for_frontend(
  db: & TaskDbConnection
) -> Result<TaskList, SqliteTasksError> {
  let query = sqlx::query_as!(
    TaskItemRaw,
    r#"
    SELECT
      id,
      task_status,
      task_type,
      model_type,
      provider,
      provider_job_id,
      frontend_caller,
      frontend_subscriber_id,
      frontend_subscriber_payload,
      on_complete_primary_media_file_token,
      on_complete_primary_media_file_class,
      on_complete_batch_token,
      on_complete_primary_media_file_cdn_url,
      on_complete_primary_media_file_thumbnail_url_template,
      on_failure_type,
      on_failure_message,
      created_at as "created_at: DateTime<Utc>",
      updated_at as "updated_at: DateTime<Utc>",
      completed_at as "completed_at: DateTime<Utc>"
    FROM tasks
    WHERE is_dismissed_by_user == 0
  "#);

  let result = query.fetch_all(db.get_pool())
      .await?;

  let mut tasks = Vec::with_capacity(result.len());

  for raw in result.into_iter() {
    let task_id = raw.id.clone();
    // FIX: one row with a value this build cannot parse (left by a newer version of the app, or damaged) used to
    // fail the whole call with `?`, so the task queue could not load at all. Log the row and carry on with the rest.
    match item_from_raw(raw) {
      Ok(item) => tasks.push(item),
      Err(err) => warn_unreadable_task(&task_id, &err),
    }
  }

  Ok(TaskList {
    tasks,
  })
}

fn item_from_raw(raw: TaskItemRaw) -> Result<TaskItem, SqliteTasksError> {
  Ok(TaskItem {
      id: TaskId::new(raw.id),
      status: TaskStatus::from_str(&raw.task_status)?,
      task_type: TaskType::from_str(&raw.task_type)?,
      model_type: raw.model_type
          .map(|model| TaskModelType::from_str(&model))
          .transpose()?,
      provider: raw.provider
          .map(|provider| GenerationProvider::from_str(&provider))
          .transpose()?,
      provider_job_id: raw.provider_job_id,
      frontend_caller: raw.frontend_caller
          .map(|caller| TauriCommandCaller::from_str(&caller))
          .transpose()?,
      frontend_subscriber_id: raw.frontend_subscriber_id,
      frontend_subscriber_payload: raw.frontend_subscriber_payload,
      on_complete_primary_media_file_token: raw.on_complete_primary_media_file_token.map(|t| MediaFileToken::new_from_str(&t)),
      on_complete_primary_media_file_class: raw.on_complete_primary_media_file_class
          .map(|c| TaskMediaFileClass::from_str(&c))
          .transpose()?,
      on_complete_batch_token: raw.on_complete_batch_token.map(|t| BatchGenerationToken::new_from_str(&t)),
      on_complete_primary_media_file_cdn_url: raw.on_complete_primary_media_file_cdn_url,
      on_complete_primary_media_file_thumbnail_url_template: raw.on_complete_primary_media_file_thumbnail_url_template,
      on_failure_type: raw.on_failure_type
          .map(|t| TaskFailureType::from_str(&t))
          .transpose()?,
      on_failure_message: raw.on_failure_message,
      created_at: raw.created_at,
      updated_at: raw.updated_at,
      completed_at: raw.completed_at,
    })
}

struct TaskItemRaw {
  id: String,
  task_status: String,
  task_type: String,
  model_type: Option<String>,
  provider: Option<String>,
  provider_job_id: Option<String>,
  frontend_caller: Option<String>,
  frontend_subscriber_id: Option<String>,
  frontend_subscriber_payload: Option<String>,
  on_complete_primary_media_file_token: Option<String>,
  on_complete_primary_media_file_class: Option<String>,
  on_complete_batch_token: Option<String>,
  on_complete_primary_media_file_cdn_url: Option<String>,
  on_complete_primary_media_file_thumbnail_url_template: Option<String>,
  on_failure_type: Option<String>,
  on_failure_message: Option<String>,
  created_at: DateTime<Utc>,
  updated_at: DateTime<Utc>,
  completed_at: Option<DateTime<Utc>>,
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::queries::create_task::{create_task, CreateTaskArgs};

  // NB: A plain #[test] with a hand-built runtime, because this crate forbids `unused_mut`, which the
  // #[tokio::test] expansion trips over.
  #[test]
  fn a_row_with_an_unknown_value_does_not_hide_the_other_tasks() {
    let runtime = tokio::runtime::Builder::new_current_thread().enable_all().build().unwrap();
    runtime.block_on(async {
      let dir = tempfile::tempdir().unwrap();
      let db = TaskDbConnection::connect_and_migrate(dir.path().join("tasks.sqlite")).await.unwrap();
      let good = new_task(&db, "job-good").await;
      let odd = new_task(&db, "job-odd").await;

      // A value this build does not know, as left behind by a newer version of the app.
      sqlx::query("UPDATE tasks SET task_type = 'from_a_newer_version' WHERE id = ?")
          .bind(odd.as_str())
          .execute(db.get_pool())
          .await
          .unwrap();

      let list = list_tasks_for_frontend(&db).await.unwrap();

      let ids = list.tasks.iter().map(|task| task.id.as_str().to_string()).collect::<Vec<_>>();
      assert_eq!(ids, vec![good.as_str().to_string()]);
    });
  }

  async fn new_task(db: &TaskDbConnection, provider_job_id: &str) -> TaskId {
    create_task(CreateTaskArgs {
      db,
      status: TaskStatus::Pending,
      task_type: TaskType::ImageGeneration,
      model_type: None,
      provider: GenerationProvider::Fal,
      provider_job_id: Some(provider_job_id),
      queue_status_url: None,
      queue_response_url: None,
      prompt_token: None,
      frontend_caller: None,
      frontend_subscriber_id: None,
      frontend_subscriber_payload: None,
    }).await.unwrap()
  }
}
