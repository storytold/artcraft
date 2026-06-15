use anyhow::{anyhow, Result};
use serde_json::{json, Value};
use tokio::try_join;

use artcraft_client::endpoints::credits::get_session_credits::get_session_credits;
use artcraft_client::endpoints::subscriptions::get_session_subscription::get_session_subscription;
use enums::common::payments_namespace::PaymentsNamespace;

use crate::creds::load_session;

pub async fn run() -> Result<Value> {
  let (api_host, creds) = load_session()?;

  let credits_fut = get_session_credits(&api_host, Some(&creds), PaymentsNamespace::Artcraft);
  let subscription_fut =
    get_session_subscription(&api_host, Some(&creds), PaymentsNamespace::Artcraft);

  let (credits, subscription) = try_join!(credits_fut, subscription_fut)
    .map_err(|e| anyhow!("user status fetch failed: {:?}", e))?;

  let subscription_value = serde_json::to_value(&subscription.active_subscription)
    .map_err(|e| anyhow!("failed to serialize subscription: {:?}", e))?;

  Ok(json!({
    "credits": {
      "free": credits.free_credits,
      "monthly": credits.monthly_credits,
      "banked": credits.banked_credits,
      "total": credits.sum_total_credits,
    },
    "subscription": subscription_value,
  }))
}
