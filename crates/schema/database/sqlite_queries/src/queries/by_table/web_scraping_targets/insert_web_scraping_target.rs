use enums_db::by_table::web_scraping_targets::scraping_status::ScrapingStatus;
use enums_db::common::sqlite::skip_reason::SkipReason;
use enums_db::common::sqlite::web_content_type::WebContentType;
use errors::{anyhow, AnyhowResult};
use sqlx::SqlitePool;

pub struct Args <'a> {
  pub canonical_url: &'a str,

  pub web_content_type: WebContentType,

  pub maybe_title: Option<&'a str>,
  pub maybe_article_full_image_url: Option<&'a str>,
  pub maybe_article_thumbnail_image_url: Option<&'a str>,

  pub maybe_skip_reason: Option<SkipReason>,

  pub sqlite_pool: &'a SqlitePool,
}

pub async fn insert_web_scraping_target(args: Args<'_>) -> AnyhowResult<()> {
  let web_content_type = args.web_content_type.to_str().to_string();
  let maybe_skip_reason = args.maybe_skip_reason
      .map(|reason| reason.to_str().to_string());

  let scraping_status = if args.maybe_skip_reason.is_some() {
    ScrapingStatus::Skipped.to_str()
  } else {
    ScrapingStatus::New.to_str()
  };

  let query = sqlx::query!(
        r#"
INSERT INTO web_scraping_targets(
  canonical_url,
  web_content_type,
  maybe_title,
  maybe_article_full_image_url,
  maybe_article_thumbnail_image_url,
  maybe_skip_reason,
  scraping_status
)
VALUES (
  ?,
  ?,
  ?,
  ?,
  ?,
  ?,
  ?
)
        "#,
        args.canonical_url,
        web_content_type,
        args.maybe_title,
        args.maybe_article_full_image_url,
        args.maybe_article_thumbnail_image_url,
        maybe_skip_reason,
        scraping_status
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