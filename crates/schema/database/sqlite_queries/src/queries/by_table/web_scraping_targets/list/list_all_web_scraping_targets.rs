use enums_db::by_table::web_scraping_targets::scraping_status::ScrapingStatus;
use enums::common::sqlite::web_content_type::WebContentType;
use errors::{anyhow, AnyhowResult};
use sqlx::SqlitePool;

use crate::queries::by_table::web_scraping_targets::list::web_scraping_target::{RawInternalWebScrapingTarget, WebScrapingTarget};

// NB: I wanted to do "RANDOM()", but Sqlx turns non-NULL fields to null. (WTF?!)

pub async fn list_all_web_scraping_targets(
  scraping_status: ScrapingStatus,
  sqlite_pool: &SqlitePool,
) -> AnyhowResult<Vec<WebScrapingTarget>> {

  // NB: Sqlx doesn't support `WHERE ... IN (...)` "yet". :(
  // https://github.com/launchbadge/sqlx/blob/6d0d7402c8a9cbea2676a1795e9fb50b0cf60c03/FAQ.md?plain=1#L73
  let scraping_status = scraping_status.to_str().to_string();

  let query = sqlx::query_as!(
    RawInternalWebScrapingTarget,
        r#"
SELECT
  id,
  canonical_url,
  web_content_type as `web_content_type: enums::common::sqlite::web_content_type::WebContentType`,
  maybe_title,
  maybe_article_full_image_url,
  maybe_article_thumbnail_image_url,
  scraping_status as `scraping_status: enums_db::by_table::web_scraping_targets::scraping_status::ScrapingStatus`,
  scrape_attempts
FROM web_scraping_targets
WHERE
  scraping_status = ?
  AND maybe_skip_reason IS NULL
ORDER BY id ASC
        "#,
        scraping_status,
    );

  let records = query.fetch_all(sqlite_pool)
      .await?;

  let records = records.into_iter()
      .map(|record : RawInternalWebScrapingTarget| {
        WebScrapingTarget {
          id: record.id,
          canonical_url: record.canonical_url,
          web_content_type: record.web_content_type,
          maybe_title: record.maybe_title,
          maybe_article_full_image_url: record.maybe_article_full_image_url,
          maybe_article_thumbnail_image_url: record.maybe_article_thumbnail_image_url,
          scraping_status: record.scraping_status,
          scrape_attempts: record.scrape_attempts,
        }
      })
      .collect::<Vec<WebScrapingTarget>>();

  Ok(records)
}
