use crate::datatypes::api::user_id::UserId;
use once_cell::sync::Lazy;
use regex::Regex;

/// Find the user id in the index.html payload
/// eg. \"userId\":\"85980643-ffab-4984-a3de-59a608c47d7f\",
static JSON_REGEX: Lazy<Regex> = Lazy::new(|| {
  Regex::new(r#"\\?"userI[dD]\\?":\s*\\?"([a-zA-Z0-9-]{25,})\\?",?"#)
      .expect("Regex should parse")
});

/// Parse the user id from the index.html
pub fn parse_index_user_id(html: &str) -> Option<UserId> {
  let maybe_meta = scrape_user_id_via_regex(html);

  if let Some(meta) = maybe_meta {
    return Some(UserId(meta))
  }

  None
}

fn scrape_user_id_via_regex(html: &str) -> Option<String> {
  let captures = JSON_REGEX.captures(html)?;
  let capture = captures.get(1)?;
  Some(capture.as_str().to_string())
}

#[cfg(test)]
mod tests {
  use crate::requests::index_page::get_index_page::{get_index, GetIndexPageArgs};
  use crate::requests::index_page::parsers::index::parse_index_user_id::parse_index_user_id;
  use crate::test_utils::get_test_cookies::get_test_cookies;
  use errors::AnyhowResult;

  #[tokio::test]
  #[ignore] // Manual test invocation
  async fn test() -> AnyhowResult<()> {
    let cookie = get_test_cookies()?;
    let index = get_index(GetIndexPageArgs {
      cookie: &cookie,
    }).await?;

    let user_id = parse_index_user_id(&index.body);
    println!("User ID : {:?}", user_id);

    assert_eq!(1, 2);
    Ok(())
  }
}
