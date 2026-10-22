use crate::connection::TaskDbConnection;
use crate::error::SqliteTasksError;
use crate::queries::task::{RawTask, Task};
use enums::common::generation_provider::GenerationProvider;
use log::warn;
use sqlx::{QueryBuilder, Sqlite};

pub struct ListTasksArgs<'a> {
  pub db: &'a TaskDbConnection,
  pub provider: GenerationProvider,
  pub provider_job_ids: Option<Vec<String>>,
}

pub struct TaskList {
  pub tasks: Vec<Task>,
}

pub async fn list_tasks_by_provider_and_tokens(
  args: ListTasksArgs<'_>,
) -> Result<TaskList, SqliteTasksError> {

  let mut query_builder: QueryBuilder<Sqlite> = QueryBuilder::new(r#"
    SELECT
      id,
      task_status,
      task_type,
      model_type,
      provider,
      provider_job_id,
      frontend_caller,
      queue_status_url,
      queue_response_url,
      prompt_token,
      frontend_subscriber_id,
      frontend_subscriber_payload
    FROM tasks
    WHERE provider =
  "#);

  // TODO(bt,2025-07-15): Fix this. The sqlx mysql queries never required temporaries
  let provider = args.provider.to_string();

  query_builder.push_bind(provider);

  if let Some(provider_job_ids) = args.provider_job_ids {
    query_builder.push(" AND provider_job_id IN (");
    let mut separated = query_builder.separated(", ");

    for job_id in provider_job_ids.into_iter() {
      separated.push_bind(job_id);
    }

    separated.push_unseparated(") ");
  }

  let query = query_builder.build_query_as::<RawTask>();

  // info!("Query: {:?}", query.sql());

  let results = query.fetch_all(args.db.get_pool()).await?;

  let mut tasks: Vec<Task> = Vec::new();

  for raw in results {
    let task_id = raw.id.clone();
    // FIX: one row with a value this build cannot parse (left by a newer version of the app, or damaged) used to
    // fail the whole call with `?`, and every poller that lists its tasks through here then did nothing for any task.
    // Log the row and carry on with the rest.
    match raw.into_task() {
      Ok(task) => tasks.push(task),
      Err(err) => warn!("Skipping task {} that could not be read: {}", task_id, err),
    }
  }

  Ok(TaskList {
    tasks,
  })
}
