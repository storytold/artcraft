use enums_db::by_table::web_scraping_targets::scraping_status::ScrapingStatus;
use errors::{anyhow, AnyhowResult};
use sqlx::SqlitePool;

pub struct Args <'a> {
  pub canonical_url: &'a str,

  pub scraping_status: ScrapingStatus,
  pub scrape_attempts: i64,

  pub sqlite_pool: &'a SqlitePool,
}

pub async fn update_web_scraping_target(args: Args<'_>) -> AnyhowResult<()> {
  let scraping_status = args.scraping_status.to_str().to_string();
  let query = sqlx::query!(
        r#"
UPDATE web_scraping_targets
SET
  scraping_status = ?,
  scrape_attempts = ?,
  version = version + 1
WHERE
  canonical_url = ?
        "#,
        scraping_status,
        args.scrape_attempts,
        args.canonical_url,
    );

  let query_result = query.execute(args.sqlite_pool)
      .await;

  match query_result {
    Ok(_) => Ok(()),
    Err(err) => Err(anyhow!("error updating: {:?}", err)),
  }
}
