use enums_db::common::sqlite::awaitable_job_status::AwaitableJobStatus;
use errors::{anyhow, AnyhowResult};
use sqlx::SqlitePool;
use tokens::tokens::news_stories::NewsStoryToken;

use crate::queries::by_table::news_story_productions::list::news_story_production_item::NewsStoryProductionItem;

pub async fn list_news_story_productions_awaiting_llm_rendition(
  llm_rendition_status: AwaitableJobStatus,
  last_id: i64,
  limit: i64,
  sqlite_pool: &SqlitePool,
) -> AnyhowResult<Vec<NewsStoryProductionItem>> {

  // NB: Sqlx doesn't support `WHERE ... IN (...)` "yet". :(
  // https://github.com/launchbadge/sqlx/blob/6d0d7402c8a9cbea2676a1795e9fb50b0cf60c03/FAQ.md?plain=1#L73
  let llm_rendition_status = llm_rendition_status.to_string();

  let query = sqlx::query_as!(
    NewsStoryProductionItem,
        r#"
SELECT
  id,
  news_story_token as `news_story_token: tokens::tokens::news_stories::NewsStoryToken`,
  original_news_canonical_url,
  web_content_type as `web_content_type: enums_db::common::sqlite::web_content_type::WebContentType`,
  original_news_title,

  maybe_summary_news_title,
  maybe_categorization,

  overall_production_status as `overall_production_status: enums_db::common::sqlite::awaitable_job_status::AwaitableJobStatus`,

  llm_rendition_status as `llm_rendition_status: enums_db::common::sqlite::awaitable_job_status::AwaitableJobStatus`,
  llm_rendition_attempts,

  llm_title_summary_status as `llm_title_summary_status: enums_db::common::sqlite::awaitable_job_status::AwaitableJobStatus`,
  llm_title_summary_attempts,

  llm_categorization_status as `llm_categorization_status: enums_db::common::sqlite::awaitable_job_status::AwaitableJobStatus`,
  llm_categorization_attempts,

  audio_generation_status as `audio_generation_status: enums_db::common::sqlite::awaitable_job_status::AwaitableJobStatus`,
  image_generation_status as `image_generation_status: enums_db::common::sqlite::awaitable_job_status::AwaitableJobStatus`,
  image_generation_attempts
FROM news_story_productions
WHERE
  overall_production_status = "processing"
  AND llm_rendition_status = ?
  AND id > ?
ORDER BY id ASC
LIMIT ?
        "#,
        llm_rendition_status,
        last_id,
        limit,
    );

  let records = query.fetch_all(sqlite_pool)
      .await?;

  Ok(records)
}
