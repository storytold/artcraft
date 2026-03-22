use errors::{anyhow, AnyhowResult};
use sqlx::SqlitePool;
use tokens::tokens::news_stories::NewsStoryToken;

use crate::queries::by_table::news_stories::list::news_story_list_item::NewsStoryListItem;
use crate::queries::by_table::news_story_productions::list::news_story_production_item::NewsStoryProductionItem;

pub async fn list_news_stories_replayable(
  sqlite_pool: &SqlitePool,
) -> AnyhowResult<Vec<NewsStoryListItem>> {

  let query = sqlx::query_as!(
    NewsStoryListItem,
        r#"
SELECT
  news_story_token as `news_story_token: tokens::tokens::news_stories::NewsStoryToken`,
  original_news_canonical_url,
  original_news_title,
  summary_news_title,
  audio_file_count,
  audio_total_duration_seconds
FROM news_stories
WHERE
  is_playable IS TRUE
  AND replayable_until > DATE('now')
ORDER BY id ASC
        "#,
    );

  let records = query.fetch_all(sqlite_pool)
      .await?;

  Ok(records)
}
