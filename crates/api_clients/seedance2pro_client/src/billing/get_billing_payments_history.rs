use chrono::{DateTime, Utc};
use log::info;
use serde::Deserialize;
use wreq::Client;
use wreq_util::Emulation;

use crate::creds::seedance2pro_session::Seedance2ProSession;
use crate::error::seedance2pro_client_error::Seedance2ProClientError;
use crate::error::seedance2pro_error::Seedance2ProError;
use crate::error::seedance2pro_generic_api_error::Seedance2ProGenericApiError;
use crate::requests::kinovi_host::{KinoviHost, resolve_host};
use crate::utils::common_headers::FIREFOX_USER_AGENT;
use crate::utils::number_coercion::de_u64_int_or_float;

/// Page size the kinovi.ai billing dashboard uses.
pub const DEFAULT_BILLING_PAGE_LIMIT: u32 = 20;

// --- Args & response ---

pub struct GetBillingPaymentsHistoryArgs<'a> {
  pub session: &'a Seedance2ProSession,

  /// Page size. The web dashboard uses [`DEFAULT_BILLING_PAGE_LIMIT`].
  pub limit: u32,

  /// Zero-based row offset. Pagination is offset-based: advance by the
  /// number of payments actually returned until a page comes back empty.
  pub offset: u64,

  /// Override the default host (kinovi.ai).
  pub host_override: Option<KinoviHost>,
}

pub struct BillingPaymentsHistoryPage {
  /// Payments on this page, newest first.
  pub payments: Vec<BillingPayment>,

  /// Cursor of the row after this page (`None` on the last page). The
  /// dashboard paginates by limit/offset; this is informational.
  pub maybe_next_cursor: Option<String>,

  /// Total payment rows on the account, per the server.
  pub total: u64,
}

// --- Public types ---

/// One payment on the Kinovi billing dashboard (a credit-package purchase).
#[derive(Debug, Clone)]
pub struct BillingPayment {
  pub id: String,

  /// Payment amount in US dollars (the API returns dollars: `2159`, `99.99`).
  pub amount_usd: f64,

  pub status: BillingPaymentStatus,

  pub payment_type: BillingPaymentType,

  /// Kinovi credits granted by this payment (e.g. 525,000).
  pub credits_earned: u64,

  /// e.g. "Credits Package"
  pub product_name: String,

  pub transaction_id: String,
  pub payment_id: String,
  pub product_id: String,

  /// ISO 8601 creation timestamp (e.g. `"2026-07-13T20:40:49.405Z"`).
  pub created_at: String,

  /// Parsed `created_at`. `None` if the raw string could not be parsed.
  pub created_at_utc: Option<DateTime<Utc>>,

  pub updated_at: String,
}

/// Payment status. Only `PAID` has been observed; unrecognised values are
/// preserved in `Unknown` so future statuses (refunds, chargebacks, pending)
/// don't break deserialization.
#[derive(Debug, Clone, PartialEq)]
pub enum BillingPaymentStatus {
  Paid,
  Unknown(String),
}

impl BillingPaymentStatus {
  fn from_str(s: &str) -> Self {
    match s {
      "PAID" => Self::Paid,
      other => Self::Unknown(other.to_string()),
    }
  }
}

/// Payment type. Only `ONE_TIME` has been observed.
#[derive(Debug, Clone, PartialEq)]
pub enum BillingPaymentType {
  OneTime,
  Unknown(String),
}

impl BillingPaymentType {
  fn from_str(s: &str) -> Self {
    match s {
      "ONE_TIME" => Self::OneTime,
      other => Self::Unknown(other.to_string()),
    }
  }
}

// --- Implementation ---

pub async fn get_billing_payments_history(
  args: GetBillingPaymentsHistoryArgs<'_>,
) -> Result<BillingPaymentsHistoryPage, Seedance2ProError> {
  let host = resolve_host(args.host_override.as_ref());
  let base_url = host.api_base_url();
  let url = format!("{}/api/trpc/billing.getPayments", base_url);

  info!("Fetching billing payments (limit: {}, offset: {})...", args.limit, args.offset);

  let input_json = build_input_json(args.limit, args.offset);

  let client = Client::builder()
    .emulation(Emulation::Firefox143)
    .build()
    .map_err(|err| Seedance2ProClientError::WreqClientError(err))?;

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
    .map_err(|err| Seedance2ProClientError::WreqClientError(err))?;

  let response = client.execute(request)
    .await
    .map_err(|err| Seedance2ProGenericApiError::WreqError(err))?;

  let status = response.status();
  let response_body = response.text()
    .await
    .map_err(|err| Seedance2ProGenericApiError::WreqError(err))?;

  info!("Billing payments response status: {}", status);

  if !status.is_success() {
    return Err(Seedance2ProGenericApiError::UncategorizedBadResponseWithStatusAndBody {
      status_code: status,
      body: response_body,
    }.into());
  }

  parse_response_body(&response_body)
}

fn parse_response_body(response_body: &str) -> Result<BillingPaymentsHistoryPage, Seedance2ProError> {
  let batch_response: Vec<BatchResponseItem> = serde_json::from_str(response_body)
    .map_err(|err| Seedance2ProGenericApiError::SerdeResponseParseErrorWithBody(err, response_body.to_string()))?;

  let json = batch_response
    .into_iter()
    .next()
    .ok_or_else(|| Seedance2ProGenericApiError::UnexpectedResponseShape {
      explanation: "Empty batch response array".to_string(),
      raw_body: response_body.to_string(),
    })?
    .result
    .data
    .json;

  let payments = json.payments
    .into_iter()
    .map(|p| {
      let created_at_utc = DateTime::parse_from_rfc3339(&p.created_at)
        .map(|dt| dt.with_timezone(&Utc))
        .ok();
      BillingPayment {
        id: p.id,
        amount_usd: p.amount,
        status: BillingPaymentStatus::from_str(&p.payment_status),
        payment_type: BillingPaymentType::from_str(&p.payment_type),
        credits_earned: p.credits_earned,
        product_name: p.product_name,
        transaction_id: p.transaction_id,
        payment_id: p.payment_id,
        product_id: p.product_id,
        created_at: p.created_at,
        created_at_utc,
        updated_at: p.updated_at,
      }
    })
    .collect();

  Ok(BillingPaymentsHistoryPage {
    payments,
    maybe_next_cursor: json.next_cursor,
    total: json.total,
  })
}

/// Builds the tRPC `input` JSON for the billing.getPayments endpoint.
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
  payments: Vec<RawPayment>,
  #[serde(default)]
  next_cursor: Option<String>,
  #[serde(deserialize_with = "de_u64_int_or_float")]
  total: u64,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct RawPayment {
  id: String,
  amount: f64,
  payment_status: String,
  #[serde(default)]
  transaction_id: String,
  #[serde(default)]
  payment_id: String,
  #[serde(default)]
  product_id: String,
  #[serde(rename = "type")]
  payment_type: String,
  #[serde(deserialize_with = "de_u64_int_or_float")]
  credits_earned: u64,
  #[serde(default)]
  product_name: String,
  created_at: String,
  #[serde(default)]
  updated_at: String,
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::creds::seedance2pro_session::Seedance2ProSession;
  use crate::test_utils::get_test_cookies::get_test_cookies;
  use crate::test_utils::setup_test_logging::setup_test_logging;
  use errors::AnyhowResult;
  use log::LevelFilter;

  mod offline_parsing {
    use super::*;

    /// Trimmed verbatim from a captured billing.getPayments response
    /// (external/requests/sites/kinovi.ai/2026-07-13-billing/).
    const CAPTURED_PAGE: &str = r#"[{"result":{"data":{"json":{"payments":[
      {"id":"31722","amount":2159,"paymentStatus":"PAID","transactionId":"","paymentId":"","createdAt":"2026-07-13T20:40:49.405Z","updatedAt":"2026-07-13T20:40:49.405Z","productId":"","type":"ONE_TIME","creditsEarned":525000,"productName":"Credits Package"},
      {"id":"11491","amount":99.99,"paymentStatus":"PAID","transactionId":"202603141400154949180","paymentId":"202603141400154949180","createdAt":"2026-03-14T14:00:15.782Z","updatedAt":"2026-03-14T14:01:02.630Z","productId":"","type":"ONE_TIME","creditsEarned":22000,"productName":"Credits Package"}
    ],"nextCursor":"29564","total":997}}}}]"#;

    #[test]
    fn parses_captured_page() {
      let page = parse_response_body(CAPTURED_PAGE).expect("parse");
      assert_eq!(page.payments.len(), 2);
      assert_eq!(page.maybe_next_cursor.as_deref(), Some("29564"));
      assert_eq!(page.total, 997);

      let first = &page.payments[0];
      assert_eq!(first.id, "31722");
      assert_eq!(first.amount_usd, 2159.0);
      assert_eq!(first.status, BillingPaymentStatus::Paid);
      assert_eq!(first.payment_type, BillingPaymentType::OneTime);
      assert_eq!(first.credits_earned, 525_000);
      assert!(first.created_at_utc.is_some());

      let second = &page.payments[1];
      assert_eq!(second.amount_usd, 99.99);
      assert_eq!(second.transaction_id, "202603141400154949180");
    }

    #[test]
    fn last_page_has_no_next_cursor() {
      let body = r#"[{"result":{"data":{"json":{"payments":[],"nextCursor":null,"total":997}}}}]"#;
      let page = parse_response_body(body).expect("parse");
      assert!(page.payments.is_empty());
      assert_eq!(page.maybe_next_cursor, None);
    }

    #[test]
    fn unknown_status_and_type_are_preserved() {
      let body = r#"[{"result":{"data":{"json":{"payments":[
        {"id":"1","amount":5,"paymentStatus":"REFUNDED","type":"SUBSCRIPTION","creditsEarned":0,"createdAt":"2026-07-13T20:40:49.405Z"}
      ],"nextCursor":null,"total":1}}}}]"#;
      let page = parse_response_body(body).expect("parse");
      assert_eq!(page.payments[0].status, BillingPaymentStatus::Unknown("REFUNDED".to_string()));
      assert_eq!(page.payments[0].payment_type, BillingPaymentType::Unknown("SUBSCRIPTION".to_string()));
    }
  }

  mod live {
    use super::*;

    #[tokio::test]
    #[ignore] // manual test — requires real cookies
    async fn live_fetch_first_payments_page() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Info);
      let session = test_session()?;

      let page = get_billing_payments_history(GetBillingPaymentsHistoryArgs {
        session: &session,
        limit: DEFAULT_BILLING_PAGE_LIMIT,
        offset: 0,
        host_override: None,
      }).await?;

      println!("payments: {}, total: {}, next_cursor: {:?}",
        page.payments.len(), page.total, page.maybe_next_cursor);
      for payment in &page.payments {
        println!("  {} | {} | ${:.2} | {} credits | {:?} | {:?}",
          payment.id, payment.created_at, payment.amount_usd,
          payment.credits_earned, payment.status, payment.payment_type);
      }
      assert!(!page.payments.is_empty());
      Ok(())
    }

    /// Pages through the ENTIRE payments history with throttling and prints
    /// lifetime totals. ~1,000 rows / 50 pages as of 2026-07.
    ///   cargo test -p seedance2pro_client live_paginate_entire_payments_history -- --ignored --nocapture
    #[tokio::test]
    #[ignore] // manual test — requires real cookies; fetches every page
    async fn live_paginate_entire_payments_history() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Info);
      let session = test_session()?;

      const PAGE_DELAY_MS: u64 = 250;
      const MAX_PAGES: usize = 2_000; // runaway guard

      let mut offset: u64 = 0;
      let mut pages = 0usize;
      let mut total_rows = 0u64;
      let mut total_amount_usd = 0f64;
      let mut total_credits = 0u64;
      let mut last_reported_total = 0u64;

      for _ in 0..MAX_PAGES {
        let page = get_billing_payments_history(GetBillingPaymentsHistoryArgs {
          session: &session,
          limit: DEFAULT_BILLING_PAGE_LIMIT,
          offset,
          host_override: None,
        }).await?;

        pages += 1;
        last_reported_total = page.total;
        if page.payments.is_empty() {
          break;
        }

        for payment in &page.payments {
          total_rows += 1;
          total_amount_usd += payment.amount_usd;
          total_credits += payment.credits_earned;
        }

        println!("page {} (offset {}): {} payments, running total ${:.2}",
          pages, offset, page.payments.len(), total_amount_usd);

        // Advance by what was actually returned so a server-side limit cap
        // can never skip rows.
        offset += page.payments.len() as u64;
        tokio::time::sleep(std::time::Duration::from_millis(PAGE_DELAY_MS)).await;
      }

      println!("── payments history totals ──");
      println!("pages:               {}", pages);
      println!("payments:            {} (server reports total {})", total_rows, last_reported_total);
      println!("lifetime spend:      ${:.2}", total_amount_usd);
      println!("lifetime credits:    {}", total_credits);
      assert!(total_rows > 0);
      Ok(())
    }

    fn test_session() -> AnyhowResult<Seedance2ProSession> {
      let cookies = get_test_cookies()?;
      Ok(Seedance2ProSession::from_cookies_string(cookies))
    }
  }
}
