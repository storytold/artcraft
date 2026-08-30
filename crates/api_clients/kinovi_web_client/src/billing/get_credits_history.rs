use chrono::{DateTime, Utc};
use log::info;
use serde::Deserialize;
use wreq::Client;
use wreq_util::Emulation;

use crate::creds::kinovi_web_session::KinoviWebSession;
use crate::error::kinovi_web_client_error::KinoviWebClientError;
use crate::error::kinovi_web_error::KinoviWebError;
use crate::error::kinovi_web_generic_api_error::KinoviWebGenericApiError;
use crate::requests::kinovi_host::{KinoviHost, resolve_host};
use crate::utils::common_headers::FIREFOX_USER_AGENT;
use crate::utils::request_timeouts::KINOVI_REQUEST_TIMEOUT;
use crate::utils::number_coercion::{de_i64_int_or_float, de_u64_int_or_float};

/// Page size the kinovi.ai billing dashboard uses.
pub const DEFAULT_CREDITS_PAGE_LIMIT: u32 = 20;

// --- Args & response ---

pub struct GetCreditsHistoryArgs<'a> {
  pub session: &'a KinoviWebSession,

  /// Page size. The web dashboard uses [`DEFAULT_CREDITS_PAGE_LIMIT`].
  pub limit: u32,

  /// Zero-based row offset. Pagination is offset-based: advance by the
  /// number of entries actually returned until a page comes back empty.
  /// NB: the ledger grows while you page (offsets shift under live traffic),
  /// so dedupe by entry `id` when sweeping the full history.
  pub offset: u64,

  /// Override the default host (kinovi.ai).
  pub host_override: Option<KinoviHost>,
}

pub struct CreditsHistoryPage {
  /// Ledger entries on this page, newest first.
  pub entries: Vec<CreditHistoryEntry>,

  /// Total ledger rows on the account, per the server.
  pub total: u64,
}

// --- Public types ---

/// One row of the Kinovi credits ledger: a signed credit delta attributed to
/// a generation order (consumption) or a grant (purchase, registration bonus).
#[derive(Debug, Clone)]
pub struct CreditHistoryEntry {
  pub id: u64,

  pub entry_type: CreditHistoryEntryType,

  /// Signed credit delta: negative for consumption, positive for grants.
  pub credit_delta: i64,

  /// The generation order this entry bills, when applicable (`ord_...`).
  /// `None` for grants (purchases, registration bonuses).
  pub maybe_order_id: Option<String>,

  /// e.g. "Seedance 2.0 Video", "Credit Package - xl (25000 credits)"
  pub product_name: String,

  /// ISO 8601 creation timestamp (e.g. `"2026-07-14T00:31:12.820Z"`).
  pub created_at: String,

  /// Parsed `created_at`. `None` if the raw string could not be parsed.
  pub created_at_utc: Option<DateTime<Utc>>,
}

/// Ledger entry type. Observed values are mapped; anything new (refunds,
/// failure credits, expirations, ...) lands in `Unknown` so deserialization
/// never breaks.
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub enum CreditHistoryEntryType {
  /// Credits consumed by a successful generation (negative delta).
  ConsumptionSuccess,
  /// Credits granted by a package purchase (positive delta).
  PurchasedCredits,
  /// Sign-up bonus credits (positive delta).
  NewUserRegistration,
  Unknown(String),
}

impl CreditHistoryEntryType {
  pub fn as_str(&self) -> &str {
    match self {
      Self::ConsumptionSuccess => "CONSUMPTION_SUCCESS",
      Self::PurchasedCredits => "PURCHASED_CREDITS",
      Self::NewUserRegistration => "NEW_USER_REGISTRATION",
      Self::Unknown(other) => other.as_str(),
    }
  }

  fn from_str(s: &str) -> Self {
    match s {
      "CONSUMPTION_SUCCESS" => Self::ConsumptionSuccess,
      "PURCHASED_CREDITS" => Self::PurchasedCredits,
      "NEW_USER_REGISTRATION" => Self::NewUserRegistration,
      other => Self::Unknown(other.to_string()),
    }
  }
}

// --- Implementation ---

pub async fn get_credits_history(
  args: GetCreditsHistoryArgs<'_>,
) -> Result<CreditsHistoryPage, KinoviWebError> {
  let host = resolve_host(args.host_override.as_ref());
  let base_url = host.api_base_url();
  let url = format!("{}/api/trpc/credits.getCreditHistory", base_url);

  info!("Fetching credits history (limit: {}, offset: {})...", args.limit, args.offset);

  let input_json = build_input_json(args.limit, args.offset);

  let client = Client::builder()
    .emulation(Emulation::Firefox143)
    .timeout(KINOVI_REQUEST_TIMEOUT)
    .build()
    .map_err(|err| KinoviWebClientError::WreqClientError(err))?;

  let cookie = args.session.cookies.as_str();
  let referer = format!("{}/app/dashboard/billing", base_url);

  let request = client.get(&url)
    .query(&[("batch", "1"), ("input", input_json.as_str())])
    .header("User-Agent", FIREFOX_USER_AGENT)
    .header("Accept", "*/*")
    .header("Accept-Language", "en-US,en;q=0.9")
    .header("Accept-Encoding", "gzip, deflate, br, zstd")
    .header("Referer", &referer)
    .header("content-type", "application/json")
    .header("x-trpc-source", "client")
    .header("Connection", "keep-alive")
    .header("Cookie", cookie)
    .header("Sec-Fetch-Dest", "empty")
    .header("Sec-Fetch-Mode", "cors")
    .header("Sec-Fetch-Site", "same-origin")
    .header("Priority", "u=4")
    .header("TE", "trailers")
    .build()
    .map_err(|err| KinoviWebClientError::WreqClientError(err))?;

  let response = client.execute(request)
    .await
    .map_err(|err| KinoviWebGenericApiError::WreqError(err))?;

  let status = response.status();
  let response_body = response.text()
    .await
    .map_err(|err| KinoviWebGenericApiError::WreqError(err))?;

  info!("Credits history response status: {}", status);

  if !status.is_success() {
    return Err(KinoviWebGenericApiError::UncategorizedBadResponseWithStatusAndBody {
      status_code: status,
      body: response_body,
    }.into());
  }

  parse_response_body(&response_body)
}

fn parse_response_body(response_body: &str) -> Result<CreditsHistoryPage, KinoviWebError> {
  let batch_response: Vec<BatchResponseItem> = serde_json::from_str(response_body)
    .map_err(|err| KinoviWebGenericApiError::SerdeResponseParseErrorWithBody(err, response_body.to_string()))?;

  let json = batch_response
    .into_iter()
    .next()
    .ok_or_else(|| KinoviWebGenericApiError::UnexpectedResponseShape {
      explanation: "Empty batch response array".to_string(),
      raw_body: response_body.to_string(),
    })?
    .result
    .data
    .json;

  let entries = json.credits
    .into_iter()
    .map(|entry| {
      let created_at_utc = DateTime::parse_from_rfc3339(&entry.created_at)
        .map(|dt| dt.with_timezone(&Utc))
        .ok();
      CreditHistoryEntry {
        id: entry.id,
        entry_type: CreditHistoryEntryType::from_str(&entry.entry_type),
        credit_delta: entry.credit,
        maybe_order_id: entry.order_id,
        product_name: entry.product_name,
        created_at: entry.created_at,
        created_at_utc,
      }
    })
    .collect();

  Ok(CreditsHistoryPage {
    entries,
    total: json.total,
  })
}

/// Builds the tRPC `input` JSON for the credits.getCreditHistory endpoint.
fn build_input_json(limit: u32, offset: u64) -> String {
  format!(r#"{{"0":{{"json":{{"limit":{limit},"offset":{offset}}}}}}}"#)
}

// --- Raw response types ---

#[derive(Deserialize, Debug)]
struct BatchResponseItem {
  result: RawResult,
}

#[derive(Deserialize, Debug)]
struct RawResult {
  data: RawData,
}

#[derive(Deserialize, Debug)]
struct RawData {
  json: RawJson,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct RawJson {
  credits: Vec<RawCreditEntry>,
  #[serde(deserialize_with = "de_u64_int_or_float")]
  total: u64,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct RawCreditEntry {
  #[serde(deserialize_with = "de_u64_int_or_float")]
  id: u64,
  #[serde(rename = "type")]
  entry_type: String,
  #[serde(deserialize_with = "de_i64_int_or_float")]
  credit: i64,
  #[serde(default)]
  order_id: Option<String>,
  created_at: String,
  #[serde(default)]
  product_name: String,
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::creds::kinovi_web_session::KinoviWebSession;
  use crate::test_utils::get_test_cookies::get_test_cookies;
  use crate::test_utils::setup_test_logging::setup_test_logging;
  use errors::AnyhowResult;
  use log::LevelFilter;

  mod offline_parsing {
    use super::*;

    /// Trimmed verbatim from a captured credits.getCreditHistory response
    /// (external/requests/sites/kinovi.ai/2026-07-13-billing/).
    const CAPTURED_PAGE: &str = r#"[{"result":{"data":{"json":{"credits":[
      {"id":2750659,"type":"CONSUMPTION_SUCCESS","credit":-454,"orderId":"ord_mff2cjk2feczmzqweizcdal2","createdAt":"2026-07-14T00:31:12.820Z","productName":"Seedance 2.0 Video"},
      {"id":591799,"type":"PURCHASED_CREDITS","credit":25000,"orderId":null,"createdAt":"2026-02-19T08:16:58.524Z","productName":"Credit Package - xl (25000 credits)"},
      {"id":563856,"type":"NEW_USER_REGISTRATION","credit":200,"orderId":null,"createdAt":"2026-02-18T01:02:52.747Z","productName":"unknown"}
    ],"total":304617}}}}]"#;

    #[test]
    fn parses_captured_page() {
      let page = parse_response_body(CAPTURED_PAGE).expect("parse");
      assert_eq!(page.entries.len(), 3);
      assert_eq!(page.total, 304_617);

      let consumption = &page.entries[0];
      assert_eq!(consumption.id, 2_750_659);
      assert_eq!(consumption.entry_type, CreditHistoryEntryType::ConsumptionSuccess);
      assert_eq!(consumption.credit_delta, -454);
      assert_eq!(consumption.maybe_order_id.as_deref(), Some("ord_mff2cjk2feczmzqweizcdal2"));
      assert!(consumption.created_at_utc.is_some());

      let purchase = &page.entries[1];
      assert_eq!(purchase.entry_type, CreditHistoryEntryType::PurchasedCredits);
      assert_eq!(purchase.credit_delta, 25_000);
      assert_eq!(purchase.maybe_order_id, None);

      let registration = &page.entries[2];
      assert_eq!(registration.entry_type, CreditHistoryEntryType::NewUserRegistration);
      assert_eq!(registration.credit_delta, 200);
    }

    #[test]
    fn unknown_entry_type_is_preserved() {
      let body = r#"[{"result":{"data":{"json":{"credits":[
        {"id":1,"type":"CONSUMPTION_REFUND","credit":454,"orderId":"ord_x","createdAt":"2026-07-14T00:31:12.820Z","productName":"Seedance 2.0 Video"}
      ],"total":1}}}}]"#;
      let page = parse_response_body(body).expect("parse");
      assert_eq!(
        page.entries[0].entry_type,
        CreditHistoryEntryType::Unknown("CONSUMPTION_REFUND".to_string()),
      );
      assert_eq!(page.entries[0].credit_delta, 454);
    }

    #[test]
    fn entry_type_round_trips_as_str() {
      for raw in ["CONSUMPTION_SUCCESS", "PURCHASED_CREDITS", "NEW_USER_REGISTRATION", "SOMETHING_NEW"] {
        assert_eq!(CreditHistoryEntryType::from_str(raw).as_str(), raw);
      }
    }
  }

  mod live {
    use super::*;
    use std::collections::HashMap;
    use std::collections::HashSet;

    #[tokio::test]
    #[ignore] // manual test — requires real cookies
    async fn live_fetch_first_credits_page() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Info);
      let session = test_session()?;

      let page = get_credits_history(GetCreditsHistoryArgs {
        session: &session,
        limit: DEFAULT_CREDITS_PAGE_LIMIT,
        offset: 0,
        host_override: None,
      }).await?;

      println!("entries: {}, total: {}", page.entries.len(), page.total);
      for entry in &page.entries {
        println!("  {} | {} | {:?} | {} | {:?}",
          entry.id, entry.created_at, entry.entry_type, entry.credit_delta,
          entry.maybe_order_id);
      }
      assert!(!page.entries.is_empty());
      Ok(())
    }

    /// Pages through the ENTIRE credits ledger with throttling and prints
    /// per-type tallies (this is where any refund-like entry types will
    /// surface). ~300k rows as of 2026-07 — expect a long run; the ledger
    /// also grows while paging, so entries are deduped by id.
    ///   cargo test -p kinovi_web_client live_paginate_entire_credits_history -- --ignored --nocapture
    #[tokio::test]
    #[ignore] // manual test — requires real cookies; fetches every page
    async fn live_paginate_entire_credits_history() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Info);
      let session = test_session()?;

      const PAGE_LIMIT: u32 = 100;
      const PAGE_DELAY_MS: u64 = 250;
      const MAX_PAGES: usize = 50_000; // runaway guard

      let mut offset: u64 = 0;
      let mut pages = 0usize;
      let mut seen_ids: HashSet<u64> = HashSet::new();
      let mut type_counts: HashMap<CreditHistoryEntryType, (u64, i64)> = HashMap::new();
      let mut last_reported_total = 0u64;

      for _ in 0..MAX_PAGES {
        let page = get_credits_history(GetCreditsHistoryArgs {
          session: &session,
          limit: PAGE_LIMIT,
          offset,
          host_override: None,
        }).await?;

        pages += 1;
        last_reported_total = page.total;
        if page.entries.is_empty() {
          break;
        }

        for entry in &page.entries {
          if !seen_ids.insert(entry.id) {
            continue; // offset shifted under live traffic; already counted
          }
          let tally = type_counts.entry(entry.entry_type.clone()).or_insert((0, 0));
          tally.0 += 1;
          tally.1 += entry.credit_delta;
        }

        if pages % 25 == 0 {
          println!("page {} (offset {}): {} unique entries so far (server total {})",
            pages, offset, seen_ids.len(), page.total);
        }

        // Advance by what was actually returned so a server-side limit cap
        // can never skip rows.
        offset += page.entries.len() as u64;
        tokio::time::sleep(std::time::Duration::from_millis(PAGE_DELAY_MS)).await;
      }

      println!("── credits ledger totals ──");
      println!("pages:          {}", pages);
      println!("unique entries: {} (server reports total {})", seen_ids.len(), last_reported_total);
      let mut types: Vec<_> = type_counts.iter().collect();
      types.sort_by_key(|(_, (count, _))| std::cmp::Reverse(*count));
      for (entry_type, (count, delta_sum)) in types {
        println!("  {:<28} n={:<8} credit_sum={}", entry_type.as_str(), count, delta_sum);
      }
      assert!(!seen_ids.is_empty());
      Ok(())
    }

    fn test_session() -> AnyhowResult<KinoviWebSession> {
      let cookies = get_test_cookies()?;
      Ok(KinoviWebSession::from_cookies_string(cookies))
    }
  }
}
