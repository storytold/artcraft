use crate::datatypes::api::sentry_trace::SentryTrace;
use once_cell::sync::Lazy;
use scraper::{Html, Selector};

/// eg. <meta name="baggage" content="sentry-environment=production,sentry-public_key=b311e0f2690c81f25e2c4cf6d4f7ce1c,sentry-trace_id=fb5c42c8cff6fd39161dd245154ca599,sentry-org_id=4508179396558848,sentry-sampled=false,sentry-sample_rand=0.7208394686924251,sentry-sample_rate=0"/>
static SENTRY_TRACE_SELECTOR : Lazy<Selector> = Lazy::new(|| {
  Selector::parse("meta[name=sentry-trace]")
      .expect("HTML selector should parse")
});


/// Extract the sentry trace, then process it.
/// The Python library discards the latter half of the trace.
pub fn parse_index_sentry_trace(html: &str) -> Option<SentryTrace> {
  get_meta_value(html)
      .map(|trace| split_sentry_trace(&trace))
      .map(|trace| SentryTrace(trace))
}

fn get_meta_value(html: &str) -> Option<String> {
  let document = Html::parse_document(html);
  let selected = document.select(&SENTRY_TRACE_SELECTOR);
  let mut values = selected
      .filter_map(|node| node.attr("content"))
      .map(|s| s.to_string())
      .collect::<Vec<_>>();
  values.pop()
}

fn split_sentry_trace(trace: &str) -> String {
  trace.split("-")
      .next()
      .map(|v| v.to_string())
      .unwrap_or_else(|| trace.to_string())
}

#[cfg(test)]
mod tests {
  use crate::requests::index_page::get_index_page::{get_index, GetIndexPageArgs};
  use crate::requests::index_page::parsers::index::parse_index_sentry_trace::parse_index_sentry_trace;
  use crate::test_utils::get_test_cookies::get_test_cookies;
  use errors::AnyhowResult;

  mod test_request {
    use super::*;

    #[tokio::test]
    #[ignore] // Manual test invocation
    async fn test() -> AnyhowResult<()> {
      let cookie = get_test_cookies()?;
      let index = get_index(GetIndexPageArgs {
        cookie: &cookie,
      }).await?;

      let sentry_trace = parse_index_sentry_trace(&index.body);

      println!("Sentry trace: {:?}", sentry_trace);

      assert_eq!(1, 2);
      Ok(())
    }
  }

  mod test_sentry_split {
    use crate::requests::index_page::parsers::index::parse_index_sentry_trace::split_sentry_trace;

    #[test]
    fn test_production_case() {
      let result = split_sentry_trace("d6d7c55e4a489c0dabaed06e5c7b257b-d2391b601d54494f-0");
      assert_eq!(&result, "d6d7c55e4a489c0dabaed06e5c7b257b");
    }

    #[test]
    fn fallback_case_1() {
      let result = split_sentry_trace("asdf");
      assert_eq!(&result, "asdf");
    }

    #[test]
    fn fallback_case_2() {
      let result = split_sentry_trace("");
      assert_eq!(&result, "");
    }
  }
}
