use enums_db::common::sqlite::awaitable_job_status::AwaitableJobStatus;
use errors::{anyhow, AnyhowResult};
use sqlx::SqlitePool;
use tokens::tokens::news_stories::NewsStoryToken;

pub async fn update_news_story_audio_finalized_success(
  news_story_token: &NewsStoryToken,
  sqlite_pool: &SqlitePool,
) -> AnyhowResult<()> {
  let mut audio_generation_status = AwaitableJobStatus::Done.to_str();

  let query = sqlx::query!(
        r#"
UPDATE news_story_productions
SET
  audio_generation_status = ?,
  version = version + 1
WHERE
  news_story_token = ?
        "#,
        audio_generation_status,
        news_story_token,
    );

  let query_result = query.execute(sqlite_pool)
      .await;

  match query_result {
    Ok(_) => Ok(()),
    Err(err) => Err(anyhow!("error updating: {:?}", err)),
  }
}

