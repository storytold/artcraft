use enums_db::common::sqlite::awaitable_job_status::AwaitableJobStatus;
use errors::{anyhow, AnyhowResult};
use sqlx::SqlitePool;
use tokens::tokens::news_stories::NewsStoryToken;

pub struct Args <'a> {
  pub news_story_token: &'a NewsStoryToken,

  pub is_successful: bool,

  pub image_generation_attempts: i64,

  pub sqlite_pool: &'a SqlitePool,
}

pub async fn update_news_story_image_generation_status(args: Args<'_>) -> AnyhowResult<()> {
  // NB: These are the default states for jobs at this stage of work:
  let mut _overall_production_status = AwaitableJobStatus::Processing;
  let mut image_generation_status = AwaitableJobStatus::Processing;

  if args.is_successful {
    image_generation_status = AwaitableJobStatus::Done;
  } else {
    image_generation_status = next_status(args.image_generation_attempts);

    if image_generation_status == AwaitableJobStatus::PermanentlyFailed {
      _overall_production_status = AwaitableJobStatus::PermanentlyFailed;
    }
  }

  // TODO - this needs to be transactional or SELECT...FOR UPDATE (whatever Sqlite's equivalent is)
  //  in order to prevent race conditions. For now, I'm leaving out "overall_production_status"
  //  updates so that we don't overwrite them.

  let _overall_production_status = _overall_production_status.to_string();
  let image_generation_status = image_generation_status.to_string();

  let query = sqlx::query!(
        r#"
UPDATE news_story_productions
SET
  image_generation_status = ?,
  image_generation_attempts = ?,
  version = version + 1
WHERE
  news_story_token = ?
        "#,
        image_generation_status,
        args.image_generation_attempts,
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
