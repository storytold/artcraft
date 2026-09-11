use once_cell::sync::Lazy;
use scraper::{Html, Selector};

// scripts: list = [s['src'] for s in BeautifulSoup(load_site.text, 'html.parser').find_all('script', src=True) if s['src'].startswith('/_next/static/chunks/')]

static SCRIPT_SELECTOR: Lazy<Selector> = Lazy::new(|| {
  Selector::parse("script[src]")
      .expect("HTML selector should parse")
});


pub fn parse_index_svg_paths(html: &str) -> Vec<String> {
  let document = Html::parse_document(html);
  let selected = document.select(&SCRIPT_SELECTOR);
  selected
      .filter_map(|node| node.attr("src"))
      .filter(|src| src.starts_with("/_next/static/chunks/"))
      .map(|s| s.to_string())
      .collect::<Vec<_>>()
}

#[cfg(test)]
mod tests {
  use crate::requests::index_page::get_index_page::{get_index, GetIndexPageArgs};
  use crate::requests::index_page::parsers::index::parse_index_script_list::parse_index_svg_paths;
  use crate::test_utils::get_test_cookies::get_test_cookies;
  use errors::AnyhowResult;

  #[tokio::test]
  #[ignore] // Manual test invocation
  async fn test() -> AnyhowResult<()> {
    let cookie = get_test_cookies()?;
    let index = get_index(GetIndexPageArgs {
      cookie: &cookie,
    }).await?;

    let scripts = parse_index_svg_paths(&index.body);

    println!("Script count: {:?}", scripts.len());

    for script in scripts {
      println!("{}", script);
    }

    assert_eq!(1, 2);
    Ok(())
  }
}
