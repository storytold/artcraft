use enums_db::common::sqlite::awaitable_job_status::AwaitableJobStatus;
use enums_db::common::sqlite::skip_reason::SkipReason;
use errors::{anyhow, AnyhowResult};
use sqlx::SqlitePool;
use tokens::tokens::news_stories::NewsStoryToken;

pub struct Args <'a> {
  pub news_story_token: &'a NewsStoryToken,

  pub maybe_skip_reason: Option<SkipReason>,
  pub is_greenlit: bool,

  pub sqlite_pool: &'a SqlitePool,
}

pub async fn update_news_story_production_greenlit_status(args: Args<'_>) -> AnyhowResult<()> {
  // NB: "audio_generation_status" etc. should still be "not_ready".
  let mut overall_production_status;
  let mut llm_rendition_status;
  let mut llm_title_summary_status;
  let mut llm_categorization_status;
  let mut image_generation_status;

  if args.is_greenlit {
    overall_production_status = AwaitableJobStatus::Processing.to_str();
    llm_rendition_status = AwaitableJobStatus::ReadyWaiting.to_str();
    llm_title_summary_status = AwaitableJobStatus::ReadyWaiting.to_str();
    llm_categorization_status = AwaitableJobStatus::ReadyWaiting.to_str();
    image_generation_status = AwaitableJobStatus::ReadyWaiting.to_str();
  } else {
    overall_production_status = AwaitableJobStatus::Skipped.to_str();
    llm_rendition_status = AwaitableJobStatus::Skipped.to_str();
    llm_title_summary_status = AwaitableJobStatus::Skipped.to_str();
    llm_categorization_status = AwaitableJobStatus::Skipped.to_str();
    image_generation_status = AwaitableJobStatus::Skipped.to_str();
  }

  let query = sqlx::query!(
        r#"
UPDATE news_story_productions
SET
  maybe_skip_reason = ?,
  overall_production_status = ?,
  llm_rendition_status = ?,
  llm_title_summary_status = ?,
  llm_categorization_status = ?,
  image_generation_status = ?,
  version = version + 1
WHERE
  news_story_token = ?
        "#,
        args.maybe_skip_reason,
        overall_production_status,
        llm_rendition_status,
        llm_title_summary_status,
        llm_categorization_status,
        image_generation_status,
        args.news_story_token,
    );

  let query_result = query.execute(args.sqlite_pool)
      .await;

  match query_result {
    Ok(_) => Ok(()),
    Err(err) => Err(anyhow!("error updating: {:?}", err)),
  }
}

