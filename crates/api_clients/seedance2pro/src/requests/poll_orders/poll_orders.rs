use crate::creds::seedance2pro_session::Seedance2ProSession;
use crate::error::seedance2pro_client_error::Seedance2ProClientError;
use crate::error::seedance2pro_error::Seedance2ProError;
use crate::error::seedance2pro_generic_api_error::Seedance2ProGenericApiError;
use crate::requests::poll_orders::request_types::*;
use crate::utils::common_headers::FIREFOX_USER_AGENT;
use log::info;
use wreq::Client;
use wreq_util::Emulation;

const GET_ORDERS_BASE_URL: &str = "https://seedance2-pro.com/api/trpc/userOrder.getOrders";

/// Builds the tRPC `input` JSON for the getOrders endpoint.
/// When `cursor` is `Some`, it is included in the JSON payload.
fn build_input_json(cursor: Option<u64>) -> String {
  match cursor {
    None => r#"{"0":{"json":{"limit":30,"format":null,"direction":"forward"},"meta":{"values":{"format":["undefined"]},"v":1}}}"#.to_string(),
    Some(c) => format!(
      r#"{{"0":{{"json":{{"limit":30,"format":null,"cursor":{cursor},"direction":"forward"}},"meta":{{"values":{{"format":["undefined"]}},"v":1}}}}}}"#,
      cursor = c
    ),
  }
}

// --- Args & response ---

pub struct PollOrdersArgs<'a> {
  pub session: &'a Seedance2ProSession,

  /// Optional cursor from a previous `PollOrdersResponse::next_cursor`.
  /// When `None`, the most recent orders are returned.
  pub cursor: Option<u64>,
}

pub struct PollOrdersResponse {
  pub orders: Vec<OrderStatus>,

  /// Present when there are more orders to fetch.
  /// Pass this value as `PollOrdersArgs::cursor` in the next call.
  pub next_cursor: Option<u64>,
}

// --- Public types ---

/// The lifecycle status of a video generation task.
#[derive(Debug, Clone, PartialEq)]
pub enum TaskStatus {
  /// The task is queued and has not started yet.
  Pending,
  /// The task is actively being processed.
  Processing,
  /// The task finished successfully. `result_url` and `results` will be populated.
  Completed,
  /// The task failed. `fail_reason` will contain the reason.
  Failed,
  /// An unrecognised status string was returned by the server.
  Unknown(String),
}

impl TaskStatus {
  fn from_str(s: &str) -> Self {
    match s {
      "PENDING" => Self::Pending,
      "PROCESSING" => Self::Processing,
      "COMPLETED" => Self::Completed,
      "FAILED" => Self::Failed,
      other => Self::Unknown(other.to_string()),
    }
  }

  pub fn is_terminal(&self) -> bool {
    matches!(self, Self::Completed | Self::Failed)
  }
}

/// A single generated video result attached to an order.
#[derive(Debug, Clone)]
pub struct VideoResult {
  pub url: String,
  pub width: u32,
  pub height: u32,
  // NB: We don't need these.
  // /// Width / height ratio (e.g. 1.777… for 16:9). `None` when the server returns null (e.g. width/height are 0).
  // pub ratio: Option<f64>,
}

/// The status of one order (one video generation task).
#[derive(Debug, Clone)]
pub struct OrderStatus {
  pub order_id: String,

  pub task_status: TaskStatus,

  /// Top-level result video URL. Populated when `task_status` is `Completed`.
  pub result_url: Option<String>,

  /// Detailed result entries. Typically one entry per video.
  pub results: Vec<VideoResult>,

  /// Failure reason. Populated when `task_status` is `Failed`.
  pub fail_reason: Option<String>,

  /// ISO 8601 creation timestamp (e.g. `"2026-02-19T01:20:50.398Z"`).
  pub created_at: String,
}

// --- Implementation ---

pub async fn poll_orders(args: PollOrdersArgs<'_>) -> Result<PollOrdersResponse, Seedance2ProError> {
  info!("Polling orders (cursor: {:?})...", args.cursor);

  let input_json = build_input_json(args.cursor);

  let client = Client::builder()
    .emulation(Emulation::Firefox143)
    .build()
    .map_err(|err| Seedance2ProClientError::WreqClientError(err))?;

  let cookie = args.session.cookies.as_str();

  let request = client.get(GET_ORDERS_BASE_URL)
    .query(&[("batch", "1"), ("input", input_json.as_str())])
    .header("User-Agent", FIREFOX_USER_AGENT)
    .header("Accept", "*/*")
    .header("Accept-Language", "en-US,en;q=0.9")
    .header("Accept-Encoding", "gzip, deflate, br, zstd")
    .header("Referer", "https://seedance2-pro.com/app/gallery")
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

  info!("Poll orders response status: {}", status);

  if !status.is_success() {
    return Err(Seedance2ProGenericApiError::UncategorizedBadResponseWithStatusAndBody {
      status_code: status,
      body: response_body,
    }.into());
  }

  let batch_response: Vec<BatchResponseItem> = serde_json::from_str(&response_body)
    .map_err(|err| Seedance2ProGenericApiError::SerdeResponseParseErrorWithBody(err, response_body.clone()))?;

  let json = batch_response
    .into_iter()
    .next()
    .ok_or_else(|| Seedance2ProGenericApiError::UncategorizedBadResponse(
      "Empty batch response array".to_string()
    ))?
    .result
    .data
    .json;

  let next_cursor = json.next_cursor;

  let orders: Vec<OrderStatus> = json.orders
    .into_iter()
    .map(|o| OrderStatus {
      order_id: o.order_id,
      task_status: TaskStatus::from_str(&o.task_status),
      result_url: o.result_url,
      results: o.results.into_iter().map(|r| VideoResult {
        url: r.url,
        width: r.width,
        height: r.height,
        // ratio: r.ratio,
      }).collect(),
      fail_reason: o.fail_reason,
      created_at: o.created_at,
    })
    .collect();

  info!("Polled {} orders, next_cursor: {:?}", orders.len(), next_cursor);

  Ok(PollOrdersResponse { orders, next_cursor })
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::creds::seedance2pro_session::Seedance2ProSession;
  use crate::test_utils::get_test_cookies::get_test_cookies;
  use crate::test_utils::setup_test_logging::setup_test_logging;
  use errors::AnyhowResult;
  use log::LevelFilter;

  fn test_session() -> AnyhowResult<Seedance2ProSession> {
    let cookies = get_test_cookies()?;
    Ok(Seedance2ProSession::from_cookies_string(cookies))
  }

  #[tokio::test]
  #[ignore] // manually test — requires real cookies
  async fn test_poll_all_orders() -> AnyhowResult<()> {
    setup_test_logging(LevelFilter::Trace);
    let session = test_session()?;
    let result = poll_orders(PollOrdersArgs { session: &session, cursor: None }).await?;
    println!("Orders returned: {}", result.orders.len());
    println!("Next cursor: {:?}", result.next_cursor);
    for order in &result.orders {
      println!("  {} | {:?} | result_url={:?} | fail={:?}",
        order.order_id, order.task_status, order.result_url, order.fail_reason);
    }
    assert_eq!(1, 2); // NB: Intentional failure to inspect output.
    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually test — requires real cookies and a known cursor value
  async fn test_poll_with_cursor() -> AnyhowResult<()> {
    setup_test_logging(LevelFilter::Trace);
    let session = test_session()?;
    // Use the cursor value returned from a prior call (e.g. 394062 from the example responses).
    let cursor: u64 = 394062;
    let result = poll_orders(PollOrdersArgs { session: &session, cursor: Some(cursor) }).await?;
    println!("Orders returned (with cursor {}): {}", cursor, result.orders.len());
    println!("Next cursor: {:?}", result.next_cursor);
    for order in &result.orders {
      println!("  {} | {:?} | result_url={:?} | fail={:?}",
        order.order_id, order.task_status, order.result_url, order.fail_reason);
    }
    assert_eq!(1, 2); // NB: Intentional failure to inspect output.
    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually test — requires real cookies; exhausts all pages
  async fn test_poll_all_pages() -> AnyhowResult<()> {
    setup_test_logging(LevelFilter::Trace);
    let session = test_session()?;

    let mut cursor: Option<u64> = None;
    let mut page = 0usize;
    let mut total_orders = 0usize;

    loop {
      page += 1;
      let result = poll_orders(PollOrdersArgs { session: &session, cursor }).await?;
      let page_count = result.orders.len();
      total_orders += page_count;

      println!("Page {}: {} orders, next_cursor: {:?}", page, page_count, result.next_cursor);
      for order in &result.orders {
        println!("  {} | {:?}", order.order_id, order.task_status);
      }

      cursor = result.next_cursor;
      if cursor.is_none() {
        break;
      }
    }

    println!("Total orders across {} pages: {}", page, total_orders);
    assert_eq!(1, 2); // NB: Intentional failure to inspect output.
    Ok(())
  }
}
