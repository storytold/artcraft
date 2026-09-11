use crate::datatypes::api::user_email::UserEmail;
use once_cell::sync::Lazy;
use regex::Regex;

/// Find the user email in the index.html payload
/// eg.
static JSON_REGEX: Lazy<Regex> = Lazy::new(|| {
  Regex::new(r#"\\?"email\\?":\s*\\?"([^"\\]+)\\?",?"#)
      .expect("Regex should parse")
});

/// Parse the user email from the index.html
pub fn parse_index_user_email(html: &str) -> Option<UserEmail> {
  let maybe_meta = scrape_user_email_via_regex(html);

  if let Some(meta) = maybe_meta {
    return Some(UserEmail(meta))
  }

  None
}

fn scrape_user_email_via_regex(html: &str) -> Option<String> {
  let captures = JSON_REGEX.captures(html)?;
  let capture = captures.get(1)?;
  Some(capture.as_str().to_string())
}

#[cfg(test)]
mod tests {
  use crate::requests::index_page::get_index_page::{get_index, GetIndexPageArgs};
  use crate::requests::index_page::parsers::index::parse_index_user_email::parse_index_user_email;
  use crate::test_utils::get_test_cookies::get_test_cookies;
  use errors::AnyhowResult;

  #[tokio::test]
  #[ignore] // Manual test invocation
  async fn test() -> AnyhowResult<()> {
    let cookie = get_test_cookies()?;
    let index = get_index(GetIndexPageArgs {
      cookie: &cookie,
    }).await?;

    let user_email = parse_index_user_email(&index.body);
    println!("User Email : {:?}", user_email);

    assert_eq!(1, 2);
    Ok(())
  }
}
