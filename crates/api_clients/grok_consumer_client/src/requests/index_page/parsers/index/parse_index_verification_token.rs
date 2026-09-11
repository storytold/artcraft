use crate::datatypes::api::verification_token::VerificationToken;
use once_cell::sync::Lazy;
use regex::Regex;
use scraper::{Html, Selector};

/// Find the verification token in the meta tags using HTML parsing.
static META_SELECTOR : Lazy<Selector> = Lazy::new(|| {
  Selector::parse("meta[name=grok-site-verification]")
      .expect("HTML selector should parse")
});

/// Find the verification token in the meta tags using regex
// eg. <meta name="grok-site-verification" content="iFlTOEJNfQZP1B6YMRf/zuj3eYFrKWi6eNUg5XvvpllTOw5TS82coZkeUBdiHxYr"/>
static META_TAG_REGEX : Lazy<Regex> = Lazy::new(|| {
  Regex::new(r#""grok-site-verification"\s*content="([A-Za-z0-9/=+-]{5,})""#)
      .expect("Regex should parse")
});

/// Find the verification token in the script tags using regex
/// eg. {\"name\":\"grok-site-verification\",\"content\":\"iFlTOEJNfQZP1B6YMRf/zuj3eYFrKWi6eNUg5XvvpllTOw5TS82coZkeUBdiHxYr\"}]
static JSON_REGEX: Lazy<Regex> = Lazy::new(|| {
  Regex::new(r#""grok-site-verification\\?",\s*\\?"content\\?":\\?"([A-Za-z0-9/=+-]{5,})\\?""#)
      .expect("Regex should parse")
});

/// Parse the verification token from the root HTML
pub fn parse_index_verification_token(html: &str) -> Option<VerificationToken> {
  let maybe_meta = scrape_meta_tag_via_parsing(html);

  if let Some(meta) = maybe_meta {
    return Some(VerificationToken(meta))
  }

  let maybe_script = scrape_script_via_regex(html);

  if let Some(script) = maybe_script {
    return Some(VerificationToken(script))
  }

  None
}

fn scrape_script_via_regex(html: &str) -> Option<String> {
  let captures = META_TAG_REGEX.captures(html)?;
  let capture = captures.get(1)?;
  Some(capture.as_str().to_string())
}

fn scrape_meta_tag_via_parsing(html: &str) -> Option<String> {
  let document = Html::parse_document(html);
  let selected = document.select(&META_SELECTOR);
  let mut values = selected
      .filter_map(|node| node.attr("content"))
      .map(|s| s.to_string())
      .collect::<Vec<_>>();
  values.pop()
}

#[cfg(test)]
mod tests {
  use crate::requests::index_page::get_index_page::{get_index, GetIndexPageArgs};
  use crate::requests::index_page::parsers::index::parse_index_verification_token::parse_index_verification_token;
  use crate::test_utils::get_test_cookies::get_test_cookies;
  use errors::AnyhowResult;

  #[tokio::test]
  #[ignore] // Manual test invocation
  async fn test() -> AnyhowResult<()> {
    let cookie = get_test_cookies()?;
    let index = get_index(GetIndexPageArgs {
      cookie: &cookie,
    }).await?;

    let result = parse_index_verification_token(&index.body);
    println!("{:?}", result);
    
    assert_eq!(1, 2);
    Ok(())
  }
}
