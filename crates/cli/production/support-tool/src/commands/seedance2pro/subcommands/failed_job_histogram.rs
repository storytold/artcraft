use std::collections::BTreeMap;

use anyhow::anyhow;
use log::info;
use seedance2pro::creds::seedance2pro_session::Seedance2ProSession;
use seedance2pro::requests::poll_orders::failure_type::FailureType;
use seedance2pro::requests::poll_orders::poll_orders::{poll_orders, PollOrdersArgs, TaskStatus};

use super::super::state::Seedance2ProState;

pub async fn run(state: &Seedance2ProState) -> anyhow::Result<()> {
  let session = Seedance2ProSession::from_cookies_string(state.cookies.clone());

  let mut cursor: Option<u64> = None;
  let mut page = 0usize;
  let mut total_orders = 0usize;
  let mut failed_count = 0usize;
  let mut histogram: BTreeMap<String, usize> = BTreeMap::new();

  loop {
    page += 1;
    info!("Fetching page {} (cursor: {:?})...", page, cursor);

    let result = poll_orders(PollOrdersArgs {
      session: &session,
      cursor,
    }).await
      .map_err(|err| anyhow!("Error polling orders on page {}: {:?}", page, err))?;

    let page_count = result.orders.len();
    total_orders += page_count;

    for order in &result.orders {
      if order.task_status == TaskStatus::Failed {
        failed_count += 1;
        let reason = order.fail_reason.as_ref()
          .map(|fr| fr.reason.as_str())
          .unwrap_or("(no reason)");
        *histogram.entry(reason.to_string()).or_insert(0) += 1;
      }
    }

    info!("Page {}: {} orders ({} failed so far).", page, page_count, failed_count);

    cursor = result.next_cursor;
    if cursor.is_none() {
      break;
    }
  }

  println!("\nScanned {} orders across {} pages.", total_orders, page);
  println!("Failed: {}\n", failed_count);

  if histogram.is_empty() {
    println!("No failed jobs found.");
    return Ok(());
  }

  // Sort by count descending.
  let mut sorted: Vec<(&String, &usize)> = histogram.iter().collect();
  sorted.sort_by(|a, b| b.1.cmp(a.1));

  println!("{:<6}  {}", "Count", "Failure Reason");
  println!("{:<6}  {}", "-----", "--------------");
  for (reason, count) in &sorted {
    println!("{:<6}  {}", count, reason);
  }

  // Build a second histogram by FailureType.
  let mut type_histogram: BTreeMap<String, usize> = BTreeMap::new();
  for (reason, count) in &histogram {
    let failure_type = FailureType::classify_text(reason);
    *type_histogram.entry(format!("{:?}", failure_type)).or_insert(0) += count;
  }

  let mut type_sorted: Vec<(&String, &usize)> = type_histogram.iter().collect();
  type_sorted.sort_by(|a, b| b.1.cmp(a.1));

  println!("\n{:<6}  {}", "Count", "Failure Type");
  println!("{:<6}  {}", "-----", "------------");
  for (failure_type, count) in &type_sorted {
    println!("{:<6}  {}", count, failure_type);
  }

  // Print reason → type mapping table.
  println!("\n{:<30}  {}", "Failure Type", "Failure Reason");
  println!("{:<30}  {}", "------------", "--------------");
  for (reason, _) in &sorted {
    let failure_type = FailureType::classify_text(reason);
    println!("{:<30}  {}", format!("{:?}", failure_type), reason);
  }

  Ok(())
}
