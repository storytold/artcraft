use crate::datatypes::api::svg_path_data::SvgPathData;
use once_cell::sync::Lazy;
use scraper::{Html, Selector};

static SVG_PATH_SELECTOR: Lazy<Selector> = Lazy::new(|| {
  Selector::parse("path[d]")
      .expect("HTML selector should parse")
});


pub fn parse_svg_paths_from_index_html(html: &str) -> Vec<SvgPathData> {
  // From https://github.com/realasfngl/Grok-Api :
  //   all_d_values = findall(r'"d":"(M[^"]{200,})"', html)
  //   svg_data = all_d_values[int(loading.split("loading-x-anim-")[1])]

  let document = Html::parse_document(html);
  let selected = document.select(&SVG_PATH_SELECTOR);
  selected
      .filter_map(|node| node.attr("d"))
      .filter(|path_data| path_data.len() >= 200) // NB: Not sure why these SVG strokes are more important.
      .map(|s| SvgPathData(s.to_string()))
      .collect::<Vec<_>>()
}

// TODO: Get from JSON instead ? - That's how the python source does it.

#[cfg(test)]
mod tests {
  use crate::requests::index_page::get_index_page::{get_index, GetIndexPageArgs};
  use crate::requests::index_page::parsers::index::parse_index_svg_paths::parse_svg_paths_from_index_html;
  use crate::test_utils::get_test_cookies::get_test_cookies;
  use errors::AnyhowResult;

  #[tokio::test]
  #[ignore] // Manual test invocation
  async fn test() -> AnyhowResult<()> {
    let cookie = get_test_cookies()?;
    let index = get_index(GetIndexPageArgs {
      cookie: &cookie,
    }).await?;

    let paths = parse_svg_paths_from_index_html(&index.body);
    println!("Paths count: {:?}", paths.len());

    for path in paths {
      println!("{}", path.0);
    }

    assert_eq!(1, 2);
    Ok(())
  }
}
