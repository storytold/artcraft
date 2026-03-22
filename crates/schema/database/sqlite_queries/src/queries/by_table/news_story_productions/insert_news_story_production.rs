use enums_db::common::sqlite::web_content_type::WebContentType;
use errors::{anyhow, AnyhowResult};
use sqlx::SqlitePool;
use tokens::tokens::news_stories::NewsStoryToken;

pub struct Args <'a> {
  pub news_story_token: &'a NewsStoryToken,

  pub original_news_canonical_url: &'a str,
  pub web_content_type: WebContentType,
  pub original_news_title: &'a str,

  pub sqlite_pool: &'a SqlitePool,
}

pub async fn insert_news_story_production(args: Args<'_>) -> AnyhowResult<()> {
  let news_story_token = args.news_story_token.as_str();
  let web_content_type = args.web_content_type.to_str();

  let query = sqlx::query!(
        r#"
INSERT INTO news_story_productions (
  news_story_token,
  original_news_canonical_url,
  web_content_type,
  original_news_title,
  overall_production_status
)
VALUES (
  ?,
  ?,
  ?,
  ?,
  "ready_waiting"
)
        "#,
        news_story_token,
        args.original_news_canonical_url,
        web_content_type,
        args.original_news_title,
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
