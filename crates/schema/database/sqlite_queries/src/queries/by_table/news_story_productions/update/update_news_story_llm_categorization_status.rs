use enums_db::common::sqlite::awaitable_job_status::AwaitableJobStatus;
use errors::{anyhow, AnyhowResult};
use sqlx::SqlitePool;
use tokens::tokens::news_stories::NewsStoryToken;

pub struct Args <'a> {
  pub news_story_token: &'a NewsStoryToken,

  pub is_successful: bool,

  pub maybe_categorization: Option<String>,

  pub llm_categorization_attempts: i64,

  pub sqlite_pool: &'a SqlitePool,
}

pub async fn update_news_story_llm_categorization_status(args: Args<'_>) -> AnyhowResult<()> {
  // NB: These are the default states for jobs at this stage of work:
  let mut overall_production_status = AwaitableJobStatus::Processing;
  let mut llm_categorization_status = AwaitableJobStatus::Processing;

  if args.is_successful {
    llm_categorization_status = AwaitableJobStatus::Done;
  } else {
    llm_categorization_status = next_status(args.llm_categorization_attempts);

    if llm_categorization_status == AwaitableJobStatus::PermanentlyFailed {
      overall_production_status = AwaitableJobStatus::PermanentlyFailed;
    }
  }

  let overall_production_status = overall_production_status.to_string();
  let llm_rendition_status = llm_categorization_status.to_string();

  let query = sqlx::query!(
        r#"
UPDATE news_story_productions
SET
  maybe_categorization = ?,
  overall_production_status = ?,
  llm_categorization_status = ?,
  llm_categorization_attempts = ?,
  version = version + 1
WHERE
  news_story_token = ?
        "#,
        args.maybe_categorization,
        overall_production_status,
        llm_categorization_status,
        args.llm_categorization_attempts,
        args.news_story_token,
    );

  let query_result = query.execute(args.sqlite_pool)
      .await;

  match query_result {
    Ok(_) => Ok(()),
    Err(err) => Err(anyhow!("error updating: {:?}", err)),
  }
}

fn next_status(attempts: i64) -> AwaitableJobStatus {
  if attempts >= 3 {
    AwaitableJobStatus::PermanentlyFailed
  } else {
    AwaitableJobStatus::RetryablyFailed
  }
}
