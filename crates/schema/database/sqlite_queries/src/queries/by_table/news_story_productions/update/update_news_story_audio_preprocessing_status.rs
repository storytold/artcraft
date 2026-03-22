use enums_db::common::sqlite::awaitable_job_status::AwaitableJobStatus;
use errors::{anyhow, AnyhowResult};
use sqlx::SqlitePool;
use tokens::tokens::news_stories::NewsStoryToken;

pub struct Args <'a> {
  pub news_story_token: &'a NewsStoryToken,

  pub is_success: bool,

  pub sqlite_pool: &'a SqlitePool,
}

pub async fn update_news_story_audio_preprocessing_status(args: Args<'_>) -> AnyhowResult<()> {
  let mut overall_production_status;
  let mut audio_generation_status;

  if args.is_success {
    overall_production_status = AwaitableJobStatus::Processing.to_str();
    audio_generation_status = AwaitableJobStatus::Processing.to_str();
  } else {
    // TODO: More graceful.
    overall_production_status = AwaitableJobStatus::PermanentlyFailed.to_str();
    audio_generation_status = AwaitableJobStatus::PermanentlyFailed.to_str();
  }

  let query = sqlx::query!(
        r#"
UPDATE news_story_productions
SET
  overall_production_status = ?,
  audio_generation_status = ?,
  version = version + 1
WHERE
  news_story_token = ?
        "#,
        overall_production_status,
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

