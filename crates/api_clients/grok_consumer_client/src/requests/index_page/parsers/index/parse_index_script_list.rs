use once_cell::sync::Lazy;
use scraper::{Html, Selector};

// Historical (relative): /_next/static/chunks/...
// 2026-03+: absolute CDN: https://cdn.grok.com/_next/static/chunks/...
const NEXT_STATIC_CHUNKS_MARKER: &str = "/_next/static/chunks/";

static SCRIPT_SELECTOR: Lazy<Selector> = Lazy::new(|| {
  Selector::parse("script[src]")
      .expect("HTML selector should parse")
});


pub fn parse_index_svg_paths(html: &str) -> Vec<String> {
  let document = Html::parse_document(html);
  let selected = document.select(&SCRIPT_SELECTOR);
  selected
      .filter_map(|node| node.attr("src"))
      .filter(|src| is_next_static_chunk_script(src))
      .map(|s| s.to_string())
      .collect::<Vec<_>>()
}

fn is_next_static_chunk_script(src: &str) -> bool {
  src.starts_with(NEXT_STATIC_CHUNKS_MARKER) || src.contains(NEXT_STATIC_CHUNKS_MARKER)
}

#[cfg(test)]
mod tests {
  use crate::requests::index_page::get_index_page::{get_index, GetIndexPageArgs};
  use crate::requests::index_page::parsers::index::parse_index_script_list::{
    is_next_static_chunk_script, parse_index_svg_paths,
  };
  use crate::test_utils::get_test_cookies::get_test_cookies;
  use errors::AnyhowResult;

  #[test]
  fn accepts_relative_and_cdn_chunk_urls() {
    assert!(is_next_static_chunk_script("/_next/static/chunks/abc.js"));
    assert!(is_next_static_chunk_script(
      "https://cdn.grok.com/_next/static/chunks/abc.js"
    ));
    assert!(!is_next_static_chunk_script("https://cdn.grok.com/_next/static/css/abc.css"));
  }

  #[test]
  fn parses_cdn_script_tags_from_index_html() {
    let html = r#"
      <html><head>
        <script src="https://cdn.grok.com/_next/static/chunks/one.js"></script>
        <script src="/_next/static/chunks/two.js"></script>
        <script src="https://example.com/other.js"></script>
      </head></html>
    "#;

    let scripts = parse_index_svg_paths(html);
    assert_eq!(scripts.len(), 2);
    assert!(scripts.iter().any(|s| s.contains("one.js")));
    assert!(scripts.iter().any(|s| s.contains("two.js")));
  }

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
