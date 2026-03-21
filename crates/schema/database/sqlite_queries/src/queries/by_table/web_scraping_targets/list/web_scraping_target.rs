use enums_db::by_table::web_scraping_targets::scraping_status::ScrapingStatus;
use enums::common::sqlite::web_content_type::WebContentType;

pub struct WebScrapingTarget {
  pub id: i64,
  pub canonical_url: String,
  pub web_content_type: WebContentType,
  pub maybe_title: Option<String>,
  pub maybe_article_full_image_url: Option<String>,
  pub maybe_article_thumbnail_image_url: Option<String>,
  pub scraping_status: ScrapingStatus,
  pub scrape_attempts: i64,
}

pub (crate) struct RawInternalWebScrapingTarget {
  pub id: i64,
  pub canonical_url: String,
  pub web_content_type: WebContentType,
  pub maybe_title: Option<String>,
  pub maybe_article_full_image_url: Option<String>,
  pub maybe_article_thumbnail_image_url: Option<String>,
  pub scraping_status: ScrapingStatus,
  pub scrape_attempts: i64,
}
