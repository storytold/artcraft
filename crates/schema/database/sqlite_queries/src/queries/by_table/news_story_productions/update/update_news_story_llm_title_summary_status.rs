use enums_db::common::sqlite::awaitable_job_status::AwaitableJobStatus;
use errors::{anyhow, AnyhowResult};
use sqlx::SqlitePool;
use tokens::tokens::news_stories::NewsStoryToken;

pub struct Args <'a> {
  pub news_story_token: &'a NewsStoryToken,

  pub is_successful: bool,

  pub maybe_title_summary: Option<String>,

  pub llm_title_summary_attempts: i64,

  pub sqlite_pool: &'a SqlitePool,
}

pub async fn update_news_story_llm_title_summary_status(args: Args<'_>) -> AnyhowResult<()> {
  // NB: These are the default states for jobs at this stage of work:
  let mut overall_production_status = AwaitableJobStatus::Processing;
  let mut llm_title_summary_status = AwaitableJobStatus::Processing;

  if args.is_successful {
    llm_title_summary_status = AwaitableJobStatus::Done;
  } else {
    llm_title_summary_status = next_status(args.llm_title_summary_attempts);

    if llm_title_summary_status == AwaitableJobStatus::PermanentlyFailed {
      overall_production_status = AwaitableJobStatus::PermanentlyFailed;
    }
  }

  let overall_production_status = overall_production_status.to_string();
  let llm_rendition_status = llm_title_summary_status.to_string();

  let query = sqlx::query!(
        r#"
UPDATE news_story_productions
SET
  maybe_summary_news_title = ?,
  overall_production_status = ?,
  llm_title_summary_status = ?,
  llm_title_summary_attempts = ?,
  version = version + 1
WHERE
  news_story_token = ?
        "#,
        args.maybe_title_summary,
        overall_production_status,
        llm_title_summary_status,
        args.llm_title_summary_attempts,
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
