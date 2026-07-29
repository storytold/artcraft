use std::collections::HashMap;
use std::fs::OpenOptions;
use std::io::Write;
use std::time::Duration;

use anyhow::anyhow;
use clap::Args;
use log::info;
use seedance2pro_client::billing::get_credits_history::{
  get_credits_history, CreditHistoryEntry, GetCreditsHistoryArgs,
};
use seedance2pro_client::creds::seedance2pro_session::Seedance2ProSession;

use super::super::state::Seedance2ProState;

/// Dump the account's credits ledger (credits.getCreditHistory) to CSV,
/// newest-first, back to a start date. The ledger is offset-paginated and
/// grows while paging (new rows push older rows to higher offsets), which
/// causes re-reads rather than gaps - consumers should dedupe by entry id.
#[derive(Args)]
pub struct AuditCreditsArgs {
  /// Output CSV path. Appends if the file exists.
  #[arg(long)]
  pub out: String,

  /// Stop paging once a whole page is older than this UTC date (YYYY-MM-DD).
  #[arg(long)]
  pub start_date: Option<String>,

  /// Page size to request (the server may cap it; paging advances by rows
  /// actually returned, so a cap cannot skip rows).
  #[arg(long, default_value_t = 100)]
  pub limit: u32,

  /// Maximum pages to fetch this run.
  #[arg(long, default_value_t = 10_000)]
  pub max_pages: usize,

  /// Resume from a row offset (e.g. after an interrupted run).
  #[arg(long, default_value_t = 0)]
  pub offset: u64,

  /// Delay between page fetches, in milliseconds.
  #[arg(long, default_value_t = 250)]
  pub delay_ms: u64,

  /// Read session cookies from this env var instead of SEEDANCE2PRO_COOKIES.
  #[arg(long)]
  pub cookies_env: Option<String>,

  /// Account label written into each CSV row. Defaults to the cookies env
  /// var name.
  #[arg(long)]
  pub account: Option<String>,
}

pub async fn run(state: &Seedance2ProState, args: AuditCreditsArgs) -> anyhow::Result<()> {
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
  let session = Seedance2ProSession::from_cookies_string(cookies);

  let file_is_new = std::fs::metadata(&args.out).map(|m| m.len() == 0).unwrap_or(true);
  let mut out = OpenOptions::new().create(true).append(true).open(&args.out)
    .map_err(|err| anyhow!("Cannot open {}: {}", args.out, err))?;
  if file_is_new {
    writeln!(out, "account,entry_id,created_at,entry_type,credit_delta,order_id,product_name")?;
  }

  let mut offset = args.offset;
  let mut rows = 0u64;
  let mut type_tallies: HashMap<String, (u64, i64)> = HashMap::new();
  let mut last_reported_total = 0u64;

  for page_number in 1..=args.max_pages {
    let page = get_credits_history(GetCreditsHistoryArgs {
      session: &session,
      limit: args.limit,
      offset,
      host_override: None,
    }).await
      .map_err(|err| anyhow!(
        "Error fetching credits page {} (resume with --offset {}): {:?}",
        page_number, offset, err))?;

    last_reported_total = page.total;
    if page.entries.is_empty() {
      info!("Page {} returned no entries; reached the end of the ledger.", page_number);
      break;
    }

    let newest_day = page.entries.first().map(|e| day_of(e)).unwrap_or_default();
    let oldest_day = page.entries.last().map(|e| day_of(e)).unwrap_or_default();

    for entry in &page.entries {
      write_entry_row(&mut out, &account_label, entry)?;
      rows += 1;
      let tally = type_tallies.entry(entry.entry_type.as_str().to_string()).or_insert((0, 0));
      tally.0 += 1;
      tally.1 += entry.credit_delta;
    }
    out.flush()?;

    if page_number % 25 == 0 || page_number == 1 {
      info!(
        "Page {} (offset {}): {} entries ({} .. {}), written {} (server total {})",
        page_number, offset, page.entries.len(), newest_day, oldest_day, rows, page.total,
      );
    }

    // Newest-first: once a whole page predates the window, everything
    // after it does too.
    if args.start_date.as_deref().is_some_and(|start| oldest_day.as_str() < start) {
      info!("Reached entries older than {}; done.", args.start_date.as_deref().unwrap());
      break;
    }

    offset += page.entries.len() as u64;
    tokio::time::sleep(Duration::from_millis(args.delay_ms)).await;
  }

  println!("── audit_credits summary [{}] ──", account_label);
  println!("entries written: {} (server reports ledger total {}; duplicates possible", rows, last_reported_total);
  println!("                 under live growth - dedupe by entry_id downstream)");
  let mut tallies: Vec<_> = type_tallies.iter().collect();
  tallies.sort_by_key(|(_, (count, _))| std::cmp::Reverse(*count));
  for (entry_type, (count, delta_sum)) in tallies {
    println!("  {:<28} n={:<9} credit_sum={}", entry_type, count, delta_sum);
  }
  Ok(())
}

/// UTC day prefix ("YYYY-MM-DD"); ISO strings compare lexicographically.
fn day_of(entry: &CreditHistoryEntry) -> String {
  entry.created_at.get(..10).unwrap_or("").to_string()
}

fn write_entry_row(out: &mut impl Write, account: &str, entry: &CreditHistoryEntry) -> anyhow::Result<()> {
  writeln!(
    out,
    "{},{},{},{},{},{},{}",
    account,
    entry.id,
    entry.created_at,
    entry.entry_type.as_str(),
    entry.credit_delta,
    entry.maybe_order_id.as_deref().unwrap_or(""),
    csv_quote(&entry.product_name),
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
