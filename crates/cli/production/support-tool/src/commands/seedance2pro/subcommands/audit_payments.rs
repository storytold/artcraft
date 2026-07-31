use std::fs::OpenOptions;
use std::io::Write;
use std::time::Duration;

use anyhow::anyhow;
use clap::Args;
use log::info;
use seedance2pro_web_client::billing::get_billing_payments_history::{
  get_billing_payments_history, BillingPayment, GetBillingPaymentsHistoryArgs,
  DEFAULT_BILLING_PAGE_LIMIT,
};
use seedance2pro_web_client::creds::seedance2pro_session::Seedance2ProSession;

use super::super::state::Seedance2ProState;

/// Dump the account's full billing payments history (credit-package
/// purchases) to CSV, for reconciling refill charges against invoices.
#[derive(Args)]
pub struct AuditPaymentsArgs {
  /// Output CSV path. Appends if the file exists.
  #[arg(long)]
  pub out: String,

  /// Maximum pages to fetch (20 payments per page).
  #[arg(long, default_value_t = 500)]
  pub max_pages: usize,

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

pub async fn run(state: &Seedance2ProState, args: AuditPaymentsArgs) -> anyhow::Result<()> {
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
    writeln!(out, "account,payment_id,created_at,amount_usd,credits_earned,status,payment_type,product_name,transaction_id")?;
  }

  let mut offset: u64 = 0;
  let mut rows = 0u64;
  let mut total_amount = 0f64;
  let mut total_credits = 0u64;
  let mut last_reported_total = 0u64;

  for page_number in 1..=args.max_pages {
    let page = get_billing_payments_history(GetBillingPaymentsHistoryArgs {
      session: &session,
      limit: DEFAULT_BILLING_PAGE_LIMIT,
      offset,
      host_override: None,
    }).await
      .map_err(|err| anyhow!(
        "Error fetching payments page {} (offset {}): {:?}", page_number, offset, err))?;

    last_reported_total = page.total;
    if page.payments.is_empty() {
      break;
    }

    for payment in &page.payments {
      write_payment_row(&mut out, &account_label, payment)?;
      rows += 1;
      total_amount += payment.amount_usd;
      total_credits += payment.credits_earned;
    }
    out.flush()?;

    info!(
      "Page {} (offset {}): {} payments; running ${:.2} / {} credits (server total {})",
      page_number, offset, page.payments.len(), total_amount, total_credits, page.total,
    );

    offset += page.payments.len() as u64;
    tokio::time::sleep(Duration::from_millis(args.delay_ms)).await;
  }

  println!("── audit_payments summary [{}] ──", account_label);
  println!("payments written:   {} (server reports total {})", rows, last_reported_total);
  println!("lifetime charged:   ${:.2}", total_amount);
  println!("lifetime credits:   {}", total_credits);
  Ok(())
}

fn write_payment_row(out: &mut impl Write, account: &str, payment: &BillingPayment) -> anyhow::Result<()> {
  writeln!(
    out,
    "{},{},{},{},{},{:?},{:?},{},{}",
    account,
    payment.id,
    payment.created_at,
    payment.amount_usd,
    payment.credits_earned,
    payment.status,
    payment.payment_type,
    csv_quote(&payment.product_name),
    payment.transaction_id,
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
