use once_cell::sync::Lazy;
use scraper::{Html, Selector};
use crate::datatypes::api::baggage::Baggage;
// <meta name="baggage" content="sentry-environment=production,sentry-public_key=b311e0f2690c81f25e2c4cf6d4f7ce1c,sentry-trace_id=fb5c42c8cff6fd39161dd245154ca599,sentry-org_id=4508179396558848,sentry-sampled=false,sentry-sample_rand=0.7208394686924251,sentry-sample_rate=0"/>

static BAGGAGE_SELECTOR : Lazy<Selector> = Lazy::new(|| {
  Selector::parse("meta[name=baggage]")
      .expect("HTML selector should parse")
});


pub fn parse_index_baggage(html: &str) -> Option<Baggage> {
  let document = Html::parse_document(html);
  let selected = document.select(&BAGGAGE_SELECTOR);
  let mut values = selected
      .filter_map(|node| node.attr("content"))
      .map(|s| s.to_string())
      .collect::<Vec<_>>();
  values.pop().map(|b| Baggage(b))
}

#[cfg(test)]
mod tests {
  use crate::requests::index_page::get_index_page::{get_index, GetIndexPageArgs};
  use crate::requests::index_page::parsers::index::parse_index_baggage::parse_index_baggage;
  use crate::test_utils::get_test_cookies::get_test_cookies;
  use errors::AnyhowResult;

  #[tokio::test]
  #[ignore] // Manual test invocation
  async fn test() -> AnyhowResult<()> {
    let cookie = get_test_cookies()?;
    let index = get_index(GetIndexPageArgs {
      cookie: &cookie,
    }).await?;

    let baggage = parse_index_baggage(&index.body);

    println!("Baggage: {:?}", baggage);

    assert_eq!(1, 2);
    Ok(())
  }
}
