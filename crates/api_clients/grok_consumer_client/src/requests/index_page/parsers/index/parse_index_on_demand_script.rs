use once_cell::sync::Lazy;
use regex::Regex;

static ON_DEMAND_REGEX : Lazy<Regex> = Lazy::new(|| {
  Regex::new(r#""ondemand.s":"([^"]*)""#)
      .expect("Regex should parse")
});

pub fn parse_index_on_demand_script(html: &str) -> Option<String> {
  let on_demand = scrape_on_demand_via_regex(html);

  if let Some(on_demand) = on_demand {
    return Some(on_demand);
  }

  None
}

fn scrape_on_demand_via_regex(html: &str) -> Option<String> {
  let captures = ON_DEMAND_REGEX.captures(html)?;
  let capture = captures.get(1)?;
  Some(capture.as_str().to_string())
}


#[cfg(test)]
mod tests {
  use crate::requests::index_page::get_index_page::{get_index, GetIndexPageArgs};
  use crate::requests::index_page::parsers::index::parse_index_on_demand_script::parse_index_on_demand_script;
  use crate::test_utils::get_test_cookies::get_test_cookies;
  use errors::AnyhowResult;

  #[tokio::test]
  #[ignore] // Manual test invocation
  async fn test() -> AnyhowResult<()> {
    let cookie = get_test_cookies()?;
    let index = get_index(GetIndexPageArgs {
      cookie: &cookie,
    }).await?;

    let result = parse_index_on_demand_script(&index.body);
    println!("{:?}", result);

    assert_eq!(1, 2);
    Ok(())
  }
}
