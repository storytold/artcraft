use chrono::{DateTime, Utc};
use enums_db::common::sqlite::web_content_type::WebContentType;
use errors::{anyhow, AnyhowResult};
use sqlx::SqlitePool;
use tokens::tokens::news_stories::NewsStoryToken;

pub struct Args <'a> {
  pub news_story_token: &'a NewsStoryToken,

  pub original_news_canonical_url: &'a str,
  pub web_content_type: WebContentType,
  pub original_news_title: &'a str,

  pub summary_news_title: &'a str,
  pub llm_categorization: &'a str,

  pub audio_file_count: i64,
  pub audio_total_duration_seconds: i64,

  pub replayable_until: DateTime<Utc>,

  pub sqlite_pool: &'a SqlitePool,
}

pub async fn insert_news_story(args: Args<'_>) -> AnyhowResult<()> {
  let news_story_token = args.news_story_token.as_str();
  let web_content_type = args.web_content_type.to_str();

  let query = sqlx::query!(
        r#"
INSERT INTO news_stories (
  news_story_token,
  original_news_canonical_url,
  web_content_type,
  original_news_title,
  summary_news_title,
  llm_categorization,
  audio_file_count,
  audio_total_duration_seconds,
  replayable_until,
  is_playable
)
VALUES (
  ?,
  ?,
  ?,
  ?,
  ?,
  ?,
  ?,
  ?,
  ?,
  true
)
        "#,
        news_story_token,
        args.original_news_canonical_url,
        web_content_type,
        args.original_news_title,
        args.summary_news_title,
        args.llm_categorization,
        args.audio_file_count,
        args.audio_total_duration_seconds,
        args.replayable_until
    );

  let query_result = query.execute(args.sqlite_pool)
      .await;

  let _record_id = match query_result {
    Ok(res) => res.last_insert_rowid(),
    Err(err) => {
      return Err(anyhow!("error inserting: {:?}", err));
    }
  };

  Ok(())
}
