use crate::connection::TaskDbConnection;
use crate::error::SqliteTasksError;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_model_type::TaskModelType;
use enums::tauri::tasks::task_status::TaskStatus;
use tokens::tokens::media_files::MediaFileToken;

pub struct GetCompletedTaskByMediaFileTokenArgs<'a> {
  pub db: &'a TaskDbConnection,
  pub provider: GenerationProvider,
  pub media_file_token: &'a MediaFileToken,
}

/// The task that produced a media file, with what's needed to build on its result later.
pub struct CompletedTaskForMediaFile {
  pub model_type: Option<TaskModelType>,
  pub provider_job_id: Option<String>,
  pub prompt_token: Option<String>,
  /// Unix seconds.
  pub created_at: i64,
}

/// Finds the successful task from `provider` whose primary result is `media_file_token`.
pub async fn get_completed_task_by_media_file_token(
  args: GetCompletedTaskByMediaFileTokenArgs<'_>,
) -> Result<Option<CompletedTaskForMediaFile>, SqliteTasksError> {
  // NB: A runtime query (like `list_tasks_by_provider_and_tokens`), so no `.sqlx` cache entry.
  let maybe_row: Option<RawCompletedTask> = sqlx::query_as(r#"
    SELECT model_type, provider_job_id, prompt_token, created_at
    FROM tasks
    WHERE provider = ?
      AND task_status = ?
      AND on_complete_primary_media_file_token = ?
    ORDER BY created_at DESC
    LIMIT 1
  "#)
      .bind(args.provider.to_str())
      .bind(TaskStatus::CompleteSuccess.to_str())
      .bind(args.media_file_token.as_str())
      .fetch_optional(args.db.get_pool())
      .await?;

  let Some(row) = maybe_row else {
    return Ok(None);
  };

  Ok(Some(CompletedTaskForMediaFile {
    model_type: row.model_type
        .map(|model| TaskModelType::from_str(&model))
        .transpose()?,
    provider_job_id: row.provider_job_id,
    prompt_token: row.prompt_token,
    created_at: row.created_at,
  }))
}

#[derive(sqlx::FromRow)]
struct RawCompletedTask {
  model_type: Option<String>,
  provider_job_id: Option<String>,
  prompt_token: Option<String>,
  created_at: i64,
}

#[cfg(test)]
mod tests {
  use super::*;

  const DRAFT_MEDIA_TOKEN: &str = "mf_draft";

  #[test]
  fn finds_the_successful_task_that_made_a_media_file() { block_on(async {
    let (_dir, db) = test_database().await;
    insert_task(&db, "byteplus", "complete_success", "seedance_2p5_draft", "cgt-1", DRAFT_MEDIA_TOKEN).await;

    let task = get_completed_task_by_media_file_token(GetCompletedTaskByMediaFileTokenArgs {
      db: &db,
      provider: GenerationProvider::Byteplus,
      media_file_token: &MediaFileToken::new_from_str(DRAFT_MEDIA_TOKEN),
    }).await.unwrap().unwrap();

    assert_eq!(task.model_type, Some(TaskModelType::Unknown("seedance_2p5_draft".to_string())));
    assert_eq!(task.provider_job_id.as_deref(), Some("cgt-1"));
    assert!(task.created_at > 0);
  }) }

  #[test]
  fn ignores_other_providers_and_unfinished_tasks() { block_on(async {
    let (_dir, db) = test_database().await;
    insert_task(&db, "fal", "complete_success", "seedance_2p5_draft", "fal-1", DRAFT_MEDIA_TOKEN).await;
    insert_task(&db, "byteplus", "pending", "seedance_2p5_draft", "cgt-2", DRAFT_MEDIA_TOKEN).await;

    let maybe_task = get_completed_task_by_media_file_token(GetCompletedTaskByMediaFileTokenArgs {
      db: &db,
      provider: GenerationProvider::Byteplus,
      media_file_token: &MediaFileToken::new_from_str(DRAFT_MEDIA_TOKEN),
    }).await.unwrap();

    assert!(maybe_task.is_none());
  }) }

  // NB: Not `#[tokio::test]`: its expansion allows `unused_mut`, which this crate forbids.
  fn block_on<F: std::future::Future<Output = ()>>(future: F) {
    tokio::runtime::Builder::new_current_thread().enable_all().build().unwrap().block_on(future)
  }

  async fn test_database() -> (tempfile::TempDir, TaskDbConnection) {
    let dir = tempfile::tempdir().unwrap();
    let db = TaskDbConnection::connect_and_migrate(dir.path().join("tasks.sqlite")).await.unwrap();
    (dir, db)
  }

  async fn insert_task(db: &TaskDbConnection, provider: &str, status: &str, model: &str, job_id: &str, media_token: &str) {
    sqlx::query(r#"
      INSERT INTO tasks (id, task_status, task_type, model_type, provider, provider_job_id, on_complete_primary_media_file_token)
      VALUES (?, ?, 'video_generation', ?, ?, ?, ?)
    "#)
        .bind(format!("task_{}", job_id))
        .bind(status)
        .bind(model)
        .bind(provider)
        .bind(job_id)
        .bind(media_token)
        .execute(db.get_pool())
        .await
        .unwrap();
  }
}
