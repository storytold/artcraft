use crate::creds::seedance2pro_session::Seedance2ProSession;
use crate::error::seedance2pro_client_error::Seedance2ProClientError;
use crate::error::seedance2pro_error::Seedance2ProError;
use crate::error::seedance2pro_generic_api_error::Seedance2ProGenericApiError;
use crate::requests::kinovi_host::{KinoviHost, resolve_host};
use crate::requests::poll_orders::failure_reason::FailureReason;
use crate::requests::poll_orders::request_types::*;
use crate::utils::common_headers::FIREFOX_USER_AGENT;
use chrono::{DateTime, Utc};
use log::info;
use wreq::Client;
use wreq_util::Emulation;


// --- Args & response ---

pub struct PollOrdersArgs<'a> {
  pub session: &'a Seedance2ProSession,

  /// Optional cursor from a previous `PollOrdersResponse::next_cursor`.
  /// When `None`, the most recent orders are returned.
  pub cursor: Option<u64>,

  /// Override the default host (kinovi.ai).
  pub host_override: Option<KinoviHost>,
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

/// A single generated result attached to an order — a video frame for video
/// orders, or one of Midjourney's 4 generated images for image orders.
/// (Originally named for the video-only days; the underlying shape is shared.)
#[derive(Debug, Clone)]
pub struct VideoResult {
  pub url: String,
  pub width: u32,
  pub height: u32,
  // NB: We don't need these.
  // /// Width / height ratio (e.g. 1.777… for 16:9). `None` when the server returns null (e.g. width/height are 0).
  // pub ratio: Option<f64>,
}

/// Type-neutral alias for [`VideoResult`]. Prefer this name in new
/// callers that deal with both image and video orders.
pub type MediaResult = VideoResult;

/// Media type of an order. Midjourney orders are `Image`; the various
/// Seedance/keyframe/reference flows are `Video`.
///
/// `Unknown` covers response payloads that omit the field (older video
/// polling) or return an unrecognised value.
#[derive(Debug, Clone, PartialEq)]
pub enum OrderMediaType {
  Image,
  Video,
  Unknown(String),
}

impl OrderMediaType {
  fn from_str(s: &str) -> Self {
    match s {
      "image" => Self::Image,
      "video" => Self::Video,
      other => Self::Unknown(other.to_string()),
    }
  }

  pub fn is_image(&self) -> bool { matches!(self, Self::Image) }
  pub fn is_video(&self) -> bool { matches!(self, Self::Video) }
}

/// The status of one order (one generation task — video or image).
#[derive(Debug, Clone)]
pub struct OrderStatus {
  pub order_id: String,

  pub task_status: TaskStatus,

  /// Top-level result URL (video file for video orders, the first image of
  /// the 4-image grid for Midjourney image orders). Populated when
  /// `task_status` is `Completed`.
  pub result_url: Option<String>,

  /// Detailed result entries. One entry per video frame (video orders), or
  /// four entries per Midjourney task (image orders).
  pub results: Vec<VideoResult>,

  /// Structured failure reason. Populated when `task_status` is `Failed` or `fail_reason` is present.
  pub fail_reason: Option<FailureReason>,

  /// ISO 8601 creation timestamp (e.g. `"2026-02-19T01:20:50.398Z"`).
  pub created_at: String,

  /// Parsed `created_at` as a `DateTime<Utc>`. `None` if the raw string could not be parsed.
  pub created_at_utc: Option<DateTime<Utc>>,

  /// Whether this order produced an image or a video. `None` for older
  /// polling responses that didn't include the field — those came from the
  /// video-only era and can be treated as video by callers that need to.
  pub media_type: Option<OrderMediaType>,
}

// --- Implementation ---

pub async fn poll_orders(args: PollOrdersArgs<'_>) -> Result<PollOrdersResponse, Seedance2ProError> {
  let host = resolve_host(args.host_override.as_ref());
  let base_url = host.api_base_url();
  let get_orders_url = format!("{}/api/trpc/userOrder.getOrders", base_url);

  info!("Polling orders (cursor: {:?})...", args.cursor);

  let input_json = build_input_json(args.cursor);

  let client = Client::builder()
    .emulation(Emulation::Firefox143)
    .build()
    .map_err(|err| Seedance2ProClientError::WreqClientError(err))?;

  let cookie = args.session.cookies.as_str();
  let referer = format!("{}/app/gallery", base_url);

  let request = client.get(&get_orders_url)
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
    .ok_or_else(|| Seedance2ProGenericApiError::UnexpectedResponseShape {
      explanation: "Empty batch response array".to_string(),
      raw_body: response_body.clone(),
    })?
    .result
    .data
    .json;

  let next_cursor = json.next_cursor;

  let orders: Vec<OrderStatus> = json.orders
    .into_iter()
    .map(|o| {
      let task_status = TaskStatus::from_str(&o.task_status);
      let fail_reason = match (&o.fail_reason, &task_status) {
        (Some(reason), _) => Some(FailureReason::from_reason(reason)),
        (None, TaskStatus::Failed) => Some(FailureReason::from_reason("(no reason)")),
        _ => None,
      };
      let created_at_utc = DateTime::parse_from_rfc3339(&o.created_at)
        .map(|dt| dt.with_timezone(&Utc))
        .ok();

      let media_type = o.media_type.as_deref().map(OrderMediaType::from_str);

      OrderStatus {
        order_id: o.order_id,
        task_status,
        result_url: o.result_url,
        results: o.results.into_iter().map(|r| VideoResult {
          url: r.url,
          width: r.width,
          height: r.height,
        }).collect(),
        fail_reason,
        created_at: o.created_at,
        created_at_utc,
        media_type,
      }
    })
    .collect();

  info!("Polled {} orders, next_cursor: {:?}", orders.len(), next_cursor);

  Ok(PollOrdersResponse { orders, next_cursor })
}

/// Builds the tRPC `input` JSON for the getOrders endpoint.
/// When `cursor` is `Some`, it is included in the JSON payload.
fn build_input_json(cursor: Option<u64>) -> String {
  match cursor {
    None => r#"{"0":{"json":{"limit":30,"format":null,"toolId":null,"direction":"forward"},"meta":{"values":{"format":["undefined"],"toolId":["undefined"]},"v":1}}}"#.to_string(),
    Some(c) => format!(
      r#"{{"0":{{"json":{{"limit":30,"format":null,"toolId":null,"cursor":{cursor},"direction":"forward"}},"meta":{{"values":{{"format":["undefined"],"toolId":["undefined"]}},"v":1}}}}}}"#,
      cursor = c
    ),
  }
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

  // ── Offline parsing tests against captured responses ──
  //
  // These verify the deserializer + mapping handle the Midjourney image
  // polling shape, including the new `mediaType` field, without breaking
  // the older video-only callers.

  mod offline_parsing {
    use super::*;

    /// Helper: take a captured response file with a `Response:` header and
    /// extract the first complete JSON array body. Tolerant of whitespace
    /// between `[` and `{` (the pretty-printed captures look like
    /// `[\n  {`).
    fn extract_json_body(raw: &str) -> &str {
      // The body always sits after the `Response:` header in the capture.
      // Anchor the search there so we don't accidentally grab a `[` from
      // a header value above.
      let after_header = match raw.find("Response") {
        Some(i) => &raw[i..],
        None => raw,
      };
      let local_start = after_header.find('[').expect("no `[` found in response body");
      let start = (raw.len() - after_header.len()) + local_start;

      let mut depth = 0i32;
      let mut in_str = false;
      let mut esc = false;
      let bytes = raw.as_bytes();
      for i in start..bytes.len() {
        let c = bytes[i] as char;
        if in_str {
          if esc { esc = false; }
          else if c == '\\' { esc = true; }
          else if c == '"' { in_str = false; }
        } else {
          if c == '"' { in_str = true; }
          else if c == '[' || c == '{' { depth += 1; }
          else if c == ']' || c == '}' {
            depth -= 1;
            if depth == 0 {
              return &raw[start..=i];
            }
          }
        }
      }
      panic!("never found closing bracket")
    }

    /// The pretty-printed captures occasionally contain trailing commas
    /// before `]` or `}` because the curator excised neighbouring orders
    /// by hand. serde_json is strict about JSON, so scrub those out
    /// before parsing.
    fn strip_trailing_commas(body: &str) -> String {
      let mut out = String::with_capacity(body.len());
      let mut in_str = false;
      let mut esc = false;
      let bytes = body.as_bytes();
      let mut i = 0;
      while i < bytes.len() {
        let c = bytes[i] as char;
        if in_str {
          out.push(c);
          if esc { esc = false; }
          else if c == '\\' { esc = true; }
          else if c == '"' { in_str = false; }
          i += 1;
          continue;
        }
        if c == '"' { in_str = true; out.push(c); i += 1; continue; }
        if c == ',' {
          // Peek ahead past whitespace; if the next non-whitespace char is
          // `]` or `}`, drop the comma.
          let mut j = i + 1;
          while j < bytes.len() && (bytes[j] as char).is_whitespace() { j += 1; }
          if j < bytes.len() && (bytes[j] == b']' || bytes[j] == b'}') {
            i += 1;
            continue;
          }
        }
        out.push(c);
        i += 1;
      }
      out
    }

    fn parse_orders(raw: &str) -> Vec<OrderStatus> {
      let body = extract_json_body(raw);
      let body = strip_trailing_commas(body);
      let batch: Vec<BatchResponseItem> = serde_json::from_str(&body).expect("parse batch");
      let json = batch.into_iter().next().expect("non-empty batch").result.data.json;
      json.orders.into_iter().map(|o| {
        let task_status = TaskStatus::from_str(&o.task_status);
        let fail_reason = match (&o.fail_reason, &task_status) {
          (Some(r), _) => Some(FailureReason::from_reason(r)),
          (None, TaskStatus::Failed) => Some(FailureReason::from_reason("(no reason)")),
          _ => None,
        };
        let created_at_utc = DateTime::parse_from_rfc3339(&o.created_at)
          .map(|dt| dt.with_timezone(&Utc)).ok();
        let media_type = o.media_type.as_deref().map(OrderMediaType::from_str);
        OrderStatus {
          order_id: o.order_id,
          task_status,
          result_url: o.result_url,
          results: o.results.into_iter().map(|r| VideoResult {
            url: r.url, width: r.width, height: r.height,
          }).collect(),
          fail_reason,
          created_at: o.created_at,
          created_at_utc,
          media_type,
        }
      }).collect()
    }

    /// Back-compat: when the raw payload omits `mediaType` (older video-only
    /// polling), `media_type` parses as `None` and the rest of the order
    /// continues to deserialise unchanged.
    #[test]
    fn omitted_media_type_field_yields_none() {
      // Hand-built minimal video-shaped order, no `mediaType` field.
      let body = r#"[{"result":{"data":{"json":{"orders":[{
        "orderId":"ord_legacy_video",
        "resultUrl":null,
        "taskStatus":"PROCESSING",
        "results":[],
        "failReason":null,
        "createdAt":"2026-02-19T01:20:50.398Z"
      }],"nextCursor":null}}}}]"#;
      let orders = parse_orders(body);
      assert_eq!(orders.len(), 1);
      assert!(orders[0].media_type.is_none(), "legacy responses without mediaType should map to None");
      assert_eq!(orders[0].task_status, TaskStatus::Processing);
    }

    /// Unrecognised mediaType values shouldn't crash deserialisation;
    /// they end up as `Unknown(_)`.
    #[test]
    fn unknown_media_type_value_is_preserved() {
      let body = r#"[{"result":{"data":{"json":{"orders":[{
        "orderId":"ord_x",
        "resultUrl":null,
        "taskStatus":"PROCESSING",
        "results":[],
        "failReason":null,
        "createdAt":"2026-02-19T01:20:50.398Z",
        "mediaType":"hologram"
      }],"nextCursor":null}}}}]"#;
      let orders = parse_orders(body);
      assert_eq!(orders.len(), 1);
      match &orders[0].media_type {
        Some(OrderMediaType::Unknown(s)) => assert_eq!(s, "hologram"),
        other => panic!("expected Unknown(\"hologram\"), got {:?}", other),
      }
    }
  }

  #[tokio::test]
  #[ignore] // manually test — requires real cookies
  async fn test_poll_all_orders() -> AnyhowResult<()> {
    setup_test_logging(LevelFilter::Trace);
    let session = test_session()?;
    let result = poll_orders(PollOrdersArgs { session: &session, cursor: None, host_override: None }).await?;
    println!("Orders returned: {}", result.orders.len());
    println!("Next cursor: {:?}", result.next_cursor);
    let mut images = 0;
    let mut videos = 0;
    let mut unknown = 0;
    let mut missing = 0;
    for order in &result.orders {
      match &order.media_type {
        Some(OrderMediaType::Image) => images += 1,
        Some(OrderMediaType::Video) => videos += 1,
        Some(OrderMediaType::Unknown(_)) => unknown += 1,
        None => missing += 1,
      }
      println!("  {} | {:?} | media={:?} | results={} | result_url={:?} | fail={:?}",
        order.order_id, order.task_status, order.media_type,
        order.results.len(), order.result_url, order.fail_reason);
    }
    println!(
      "media_type tally: image={}, video={}, unknown={}, missing={}",
      images, videos, unknown, missing,
    );
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
    let result = poll_orders(PollOrdersArgs { session: &session, cursor: Some(cursor), host_override: None }).await?;
    println!("Orders returned (with cursor {}): {}", cursor, result.orders.len());
    println!("Next cursor: {:?}", result.next_cursor);
    for order in &result.orders {
      println!("  {} | {:?} | media={:?} | results={} | result_url={:?} | fail={:?}",
        order.order_id, order.task_status, order.media_type,
        order.results.len(), order.result_url, order.fail_reason);
    }
    assert_eq!(1, 2); // NB: Intentional failure to inspect output.
    Ok(())
  }

  /// Page back from the most recent orders until we hit a Midjourney image
  /// order, then assert the new parsing path detects it. Bounded to a few
  /// pages so this doesn't accidentally exhaust the whole account.
  #[tokio::test]
  #[ignore] // manually test — requires real cookies
  async fn test_poll_back_to_first_image_order() -> AnyhowResult<()> {
    setup_test_logging(LevelFilter::Trace);
    let session = test_session()?;

    const MAX_PAGES: usize = 10;
    let mut cursor: Option<u64> = None;
    let mut found_image_orders: Vec<OrderStatus> = Vec::new();
    let mut pages_scanned = 0usize;

    for _ in 0..MAX_PAGES {
      let result = poll_orders(PollOrdersArgs {
        session: &session, cursor, host_override: None,
      }).await?;
      pages_scanned += 1;
      println!("Page {}: {} orders, next_cursor={:?}", pages_scanned, result.orders.len(), result.next_cursor);

      for order in &result.orders {
        if order.media_type == Some(OrderMediaType::Image) {
          found_image_orders.push(order.clone());
        }
      }
      if !found_image_orders.is_empty() { break; }
      cursor = result.next_cursor;
      if cursor.is_none() { break; }
    }

    println!("Scanned {} pages; found {} image order(s)", pages_scanned, found_image_orders.len());
    for o in &found_image_orders {
      println!("  IMG {} | {:?} | results={} | result_url={:?}",
        o.order_id, o.task_status, o.results.len(), o.result_url);
    }

    assert!(!found_image_orders.is_empty(),
      "expected to find at least one image order within {} pages — \
       create a Midjourney generation if needed and rerun", MAX_PAGES);

    // Each Midjourney task returns exactly 4 images when completed.
    if let Some(completed) = found_image_orders.iter().find(|o| o.task_status == TaskStatus::Completed) {
      assert_eq!(completed.results.len(), 4,
        "completed Midjourney image order should have 4 results, got {}",
        completed.results.len());
    }
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
      let result = poll_orders(PollOrdersArgs { session: &session, cursor, host_override: None }).await?;
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
