use std::fs::OpenOptions;
use std::io::Write;
use std::time::Duration;

use anyhow::anyhow;
use clap::Args;
use log::{info, warn};
use kinovi_web_client::creds::kinovi_web_session::KinoviWebSession;
use kinovi_web_client::requests::poll_orders::poll_orders::{
  poll_orders, OrderStatus, PollOrdersArgs, TaskStatus,
};

use super::super::state::KinoviWebState;

/// Dump Kinovi's own per-order billing records (`totalCredits`) to CSV for a
/// date window, by paging the getOrders API newest-to-oldest. Used to audit
/// whether failed orders carry charges.
#[derive(Args)]
pub struct AuditOrdersArgs {
  /// Output CSV path. Appends if the file exists (resume-friendly).
  #[arg(long)]
  pub out: String,

  /// Stop paging once a whole page is older than this UTC date (YYYY-MM-DD).
  /// Without it, paging stops at --max_pages.
  #[arg(long)]
  pub start_date: Option<String>,

  /// Skip (do not write) orders on days after this UTC date (YYYY-MM-DD,
  /// inclusive). Pages still have to be fetched to reach older orders.
  #[arg(long)]
  pub end_date: Option<String>,

  /// Maximum pages to fetch this run (30 orders per page).
  #[arg(long, default_value_t = 200)]
  pub max_pages: usize,

  /// Resume from a cursor logged by a previous run.
  #[arg(long)]
  pub cursor: Option<u64>,

  /// Delay between page fetches, in milliseconds.
  #[arg(long, default_value_t = 250)]
  pub delay_ms: u64,

  /// Read session cookies from this env var instead of SEEDANCE2PRO_COOKIES
  /// (e.g. SEEDANCE2PRO_VOLCENGINE_COOKIES / SEEDANCE2PRO_BYTEPLUS_COOKIES /
  /// SEEDANCE2PRO_BYTEPLUS_ULTRA_COOKIES to audit each Kinovi account).
  #[arg(long)]
  pub cookies_env: Option<String>,

  /// Account label written into each CSV row. Defaults to the cookies env
  /// var name (or "SEEDANCE2PRO_COOKIES").
  #[arg(long)]
  pub account: Option<String>,
}

pub async fn run(state: &KinoviWebState, args: AuditOrdersArgs) -> anyhow::Result<()> {
  let (cookies, account_label) = match &args.cookies_env {
    Some(var) => (
      easyenv::get_env_string_required(var)
        .map_err(|err| anyhow!("Missing {} env var: {:?}", var, err))?,
      args.account.clone().unwrap_or_else(|| var.clone()),
    ),
    None => (
      state.cookies.clone(),
      args.account.clone().unwrap_or_else(|| "SEEDANCE2PRO_COOKIES".to_string()),
    ),
  };
  let session = KinoviWebSession::from_cookies_string(cookies);

  let file_is_new = std::fs::metadata(&args.out).map(|m| m.len() == 0).unwrap_or(true);
  let mut out = OpenOptions::new().create(true).append(true).open(&args.out)
    .map_err(|err| anyhow!("Cannot open {}: {}", args.out, err))?;
  if file_is_new {
    writeln!(out, "account,order_id,created_at,task_status,media_type,total_credits,result_count,fail_reason")?;
  }

  let mut cursor = args.cursor;
  let mut stats = AuditStats::default();

  for page in 1..=args.max_pages {
    let result = poll_orders(PollOrdersArgs {
      session: &session,
      cursor,
      host_override: None,
    }).await
      .map_err(|err| anyhow!(
        "Error polling page {} (resume with --cursor {:?}): {:?}", page, cursor, err))?;

    if result.orders.is_empty() {
      info!("Page {} returned no orders; stopping.", page);
      break;
    }

    let newest = order_day(result.orders.first().unwrap());
    let oldest = order_day(result.orders.last().unwrap());

    for order in &result.orders {
      let day = order_day(order);
      if args.end_date.as_deref().is_some_and(|end| day > end) {
        stats.skipped_after_window += 1;
        continue;
      }
      if args.start_date.as_deref().is_some_and(|start| day < start) {
        stats.skipped_before_window += 1;
        continue;
      }
      write_order_row(&mut out, &account_label, order)?;
      stats.record(order);
    }
    out.flush()?;

    info!(
      "Page {}: {} orders ({} .. {}), written so far: {}, next cursor: {:?}",
      page, result.orders.len(), newest, oldest, stats.written, result.next_cursor,
    );

    // The API pages newest-to-oldest: once the whole page predates the
    // window, everything after it will too.
    if args.start_date.as_deref().is_some_and(|start| oldest < start) {
      info!("Reached orders older than {}; done.", args.start_date.as_deref().unwrap());
      cursor = result.next_cursor;
      break;
    }

    cursor = result.next_cursor;
    if cursor.is_none() {
      info!("No further pages; reached the end of the account's history.");
      break;
    }

    tokio::time::sleep(Duration::from_millis(args.delay_ms)).await;
  }

  stats.print_summary(&account_label, cursor);
  Ok(())
}

#[derive(Default)]
struct AuditStats {
  written: u64,
  skipped_after_window: u64,
  skipped_before_window: u64,
  completed: u64,
  completed_credits: u64,
  completed_missing_credits: u64,
  failed: u64,
  failed_credits: u64,
  failed_with_nonzero_credits: u64,
  in_flight: u64,
  in_flight_credits: u64,
}

impl AuditStats {
  fn record(&mut self, order: &OrderStatus) {
    self.written += 1;
    let credits = u64::from(order.total_credits.unwrap_or(0));
    match order.task_status {
      TaskStatus::Completed => {
        self.completed += 1;
        self.completed_credits += credits;
        if order.total_credits.is_none() {
          self.completed_missing_credits += 1;
        }
      }
      TaskStatus::Failed => {
        self.failed += 1;
        self.failed_credits += credits;
        if credits > 0 {
          self.failed_with_nonzero_credits += 1;
        }
      }
      _ => {
        self.in_flight += 1;
        self.in_flight_credits += credits;
      }
    }
  }

  fn print_summary(&self, account: &str, resume_cursor: Option<u64>) {
    // Final results are intentionally println: they ARE the tool's output.
    println!("── audit_orders summary [{}] ──", account);
    println!("orders written:           {}", self.written);
    println!("  completed:              {} ({} credits; {} missing totalCredits)",
      self.completed, self.completed_credits, self.completed_missing_credits);
    println!("  failed:                 {} ({} credits; {} orders with credits > 0)",
      self.failed, self.failed_credits, self.failed_with_nonzero_credits);
    println!("  pending/processing:     {} ({} credits)", self.in_flight, self.in_flight_credits);
    println!("skipped (newer than window): {}", self.skipped_after_window);
    println!("skipped (older than window): {}", self.skipped_before_window);
    match resume_cursor {
      Some(c) => println!("resume cursor:            {}", c),
      None => println!("resume cursor:            (none - history exhausted or window done)"),
    }
    if self.failed_with_nonzero_credits > 0 {
      warn!(
        "{} FAILED orders carry non-zero totalCredits ({} credits total) — \
         Kinovi's own records say failures were charged.",
        self.failed_with_nonzero_credits, self.failed_credits,
      );
    }
  }
}

/// UTC day prefix ("YYYY-MM-DD") of the order's ISO 8601 created_at.
/// ISO strings compare lexicographically, so no date parsing is needed.
fn order_day(order: &OrderStatus) -> &str {
  order.created_at.get(..10).unwrap_or("")
}

fn write_order_row(out: &mut impl Write, account: &str, order: &OrderStatus) -> anyhow::Result<()> {
  let media_type = order.media_type.as_ref()
    .map(|m| format!("{:?}", m))
    .unwrap_or_default();
  let total_credits = order.total_credits
    .map(|c| c.to_string())
    .unwrap_or_default();
  let fail_reason = order.fail_reason.as_ref()
    .map(|fr| fr.reason.as_str())
    .unwrap_or("");
  writeln!(
    out,
    "{},{},{},{:?},{},{},{},{}",
    account,
    order.order_id,
    order.created_at,
    order.task_status,
    media_type,
    total_credits,
    order.results.len(),
    csv_quote(fail_reason),
  )?;
  Ok(())
}

/// Minimal CSV quoting for the one free-text field.
fn csv_quote(field: &str) -> String {
  if field.is_empty() {
    return String::new();
  }
  format!("\"{}\"", field.replace('"', "\"\"").replace('\n', " "))
}
