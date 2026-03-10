use anyhow::anyhow;
use clap::Args;
use log::info;
use seedance2pro::creds::seedance2pro_session::Seedance2ProSession;
use seedance2pro::requests::poll_orders::poll_orders::{poll_orders, PollOrdersArgs};

#[derive(Args)]
pub struct FindjobArgs {
  /// The order ID (job token) to search for
  #[arg(long)]
  pub token: String,
}

pub async fn run(args: FindjobArgs) -> anyhow::Result<()> {
  let cookies = easyenv::get_env_string_required("SEEDANCE2PRO_COOKIES")
    .map_err(|err| anyhow!("Missing SEEDANCE2PRO_COOKIES env var: {:?}", err))?;

  let session = Seedance2ProSession::from_cookies_string(cookies);

  let mut cursor: Option<u64> = None;
  let mut page = 0usize;

  loop {
    page += 1;
    info!("Fetching page {} (cursor: {:?})...", page, cursor);

    let result = poll_orders(PollOrdersArgs {
      session: &session,
      cursor,
    }).await
      .map_err(|err| anyhow!("Error polling orders on page {}: {:?}", page, err))?;

    for order in &result.orders {
      if order.order_id == args.token {
        println!("{}", serde_json::to_string_pretty(&order_to_json(order))?);
        return Ok(());
      }
    }

    info!("Page {}: checked {} orders, no match.", page, result.orders.len());

    cursor = result.next_cursor;
    if cursor.is_none() {
      break;
    }
  }

  eprintln!("Order '{}' not found after {} pages.", args.token, page);
  std::process::exit(1);
}

fn order_to_json(order: &seedance2pro::requests::poll_orders::poll_orders::OrderStatus) -> serde_json::Value {
  serde_json::json!({
    "order_id": order.order_id,
    "task_status": format!("{:?}", order.task_status),
    "result_url": order.result_url,
    "fail_reason": order.fail_reason,
    "created_at": order.created_at,
    "results": order.results.iter().map(|r| {
      serde_json::json!({
        "url": r.url,
        "width": r.width,
        "height": r.height,
      })
    }).collect::<Vec<_>>(),
  })
}
