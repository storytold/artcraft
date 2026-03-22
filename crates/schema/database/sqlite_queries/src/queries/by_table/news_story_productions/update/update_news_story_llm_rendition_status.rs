use enums_db::common::sqlite::awaitable_job_status::AwaitableJobStatus;
use errors::{anyhow, AnyhowResult};
use sqlx::SqlitePool;
use tokens::tokens::news_stories::NewsStoryToken;

pub struct Args <'a> {
  pub news_story_token: &'a NewsStoryToken,

  pub is_successful: bool,

  pub llm_rendition_attempts: i64,

  pub sqlite_pool: &'a SqlitePool,
}

pub async fn update_news_story_llm_rendition_status(args: Args<'_>) -> AnyhowResult<()> {
  // NB: These are the default states for jobs at this stage of work:
  let mut overall_production_status = AwaitableJobStatus::Processing;
  let mut llm_rendition_status = AwaitableJobStatus::Processing;
  let mut audio_generation_status = AwaitableJobStatus::NotReady;

  if args.is_successful {
    llm_rendition_status = AwaitableJobStatus::Done;
    audio_generation_status = AwaitableJobStatus::ReadyWaiting;
  } else {
    llm_rendition_status = next_status(args.llm_rendition_attempts);

    if llm_rendition_status == AwaitableJobStatus::PermanentlyFailed {
      overall_production_status = AwaitableJobStatus::PermanentlyFailed;
      audio_generation_status = AwaitableJobStatus::Skipped;
    }
  }

  let overall_production_status = overall_production_status.to_string();
  let llm_rendition_status = llm_rendition_status.to_string();
  let audio_generation_status = audio_generation_status.to_string();

  let query = sqlx::query!(
        r#"
UPDATE news_story_productions
SET
  overall_production_status = ?,
  llm_rendition_status = ?,
  llm_rendition_attempts = ?,
  audio_generation_status = ?,
  version = version + 1
WHERE
  news_story_token = ?
        "#,
        overall_production_status,
        llm_rendition_status,
        args.llm_rendition_attempts,
        audio_generation_status,
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
