use std::collections::HashSet;
use std::marker::PhantomData;

use chrono::{DateTime, Datelike, Utc};
use log::{error, info};

use enums::by_table::user_spend_events::payment_event_type::PaymentEventType;
use enums::common::payments_namespace::PaymentsNamespace;
use mysql_queries::queries::user_spend_summaries::list_payments_namespaces_with_spend_activity::{
  list_payments_namespaces_with_spend_activity, ListPaymentsNamespacesWithSpendActivityArgs,
};
use mysql_queries::queries::user_spend_summaries::list_user_spend_events_for_user::{
  list_user_spend_events_for_user, ListUserSpendEventsForUserArgs, UserSpendEventRow,
};
use mysql_queries::queries::user_spend_summaries::list_user_tokens_with_spend_activity::{
  list_user_tokens_with_spend_activity, ListUserTokensWithSpendActivityArgs,
};
use mysql_queries::queries::user_spend_summaries::upsert_user_spend_summary::{
  upsert_user_spend_summary, UpsertUserSpendSummaryArgs,
};
use mysql_queries::queries::users::user_subscriptions::get_active_subscription_status_for_user::{
  get_active_subscription_status_for_user, GetActiveSubscriptionStatusArgs,
};
use tokens::tokens::users::UserToken;

use crate::job::alert_on_error::alert_pager;
use crate::job::reengagement_score::reengagement_score;
use crate::job_dependencies::JobDependencies;

const DAYS_PER_WEEK: i64 = 7;

/// Recompute `user_spend_summaries` for every (user, namespace) with spend
/// activity. Window/cadence/score fields are time-relative, so all users are
/// refreshed each cycle against a single reference time. We iterate one namespace
/// at a time, keyset-paginating users by `user_token`.
pub async fn backfill_user_summaries(deps: &JobDependencies) {
  let now = Utc::now();
  info!("User-summaries backfill starting (reference time {now}).");

  let namespaces = match list_payments_namespaces_with_spend_activity(
    ListPaymentsNamespacesWithSpendActivityArgs {
      mysql_executor: &deps.mysql_pool,
      phantom: PhantomData,
    },
  )
  .await
  {
    Ok(namespaces) => namespaces,
    Err(err) => {
      error!("User-summaries: listing namespaces failed: {err:?}");
      alert_pager(&deps.pager, "user-spend-analytics: namespace list error", &format!("{err:?}"));
      let _ = deps.job_stats.increment_failure_count();
      return;
    }
  };

  let mut total_upserted = 0u64;
  for namespace in namespaces {
    total_upserted += backfill_namespace(deps, namespace, now).await;
    if deps.application_shutdown.get() {
      return;
    }
  }

  info!("User-summaries backfill complete: {total_upserted} user(s) upserted.");
}

async fn backfill_namespace(deps: &JobDependencies, namespace: PaymentsNamespace, now: DateTime<Utc>) -> u64 {
  let mut after_user_token = String::new();
  let mut upserted = 0u64;

  loop {
    if deps.application_shutdown.get() {
      return upserted;
    }
    let user_tokens = match list_user_tokens_with_spend_activity(ListUserTokensWithSpendActivityArgs {
      payments_namespace: namespace,
      after_user_token: &after_user_token,
      limit: deps.summary_user_page_size,
      mysql_executor: &deps.mysql_pool,
      phantom: PhantomData,
    })
    .await
    {
      Ok(user_tokens) => user_tokens,
      Err(err) => {
        error!("User-summaries: listing users for {} failed: {err:?}", namespace.to_str());
        alert_pager(&deps.pager, "user-spend-analytics: user list error", &format!("ns={}: {err:?}", namespace.to_str()));
        let _ = deps.job_stats.increment_failure_count();
        return upserted; // can't paginate further this cycle
      }
    };

    if user_tokens.is_empty() {
      break;
    }

    for user_token in &user_tokens {
      if deps.application_shutdown.get() {
        return upserted;
      }
      match process_user(deps, namespace, user_token, now).await {
        Ok(()) => {
          upserted += 1;
          let _ = deps.job_stats.increment_success_count();
        }
        Err(err) => {
          error!("User-summaries: failed for {} ({}): {err:?}", user_token.as_str(), namespace.to_str());
          alert_pager(
            &deps.pager,
            "user-spend-analytics: summary error",
            &format!("user={} ns={}: {err:?}", user_token.as_str(), namespace.to_str()),
          );
          let _ = deps.job_stats.increment_failure_count();
          tokio::time::sleep(deps.error_recovery).await;
        }
      }
      tokio::time::sleep(deps.query_delay).await;
    }

    after_user_token = user_tokens.last().expect("non-empty page").as_str().to_string();
  }

  upserted
}

async fn process_user(
  deps: &JobDependencies,
  namespace: PaymentsNamespace,
  user_token: &UserToken,
  now: DateTime<Utc>,
) -> Result<(), sqlx::Error> {
  let events = list_user_spend_events_for_user(ListUserSpendEventsForUserArgs {
    user_token,
    payments_namespace: namespace,
    mysql_executor: &deps.mysql_pool,
    phantom: PhantomData,
  })
  .await?;

  let aggregate = compute_summary(&events, now);

  // Authoritative subscription state (from user_subscriptions, not the events).
  let subscription_row = get_active_subscription_status_for_user(GetActiveSubscriptionStatusArgs {
    user_token,
    subscription_namespace: namespace,
    mysql_executor: &deps.mysql_pool,
    phantom: PhantomData,
  })
  .await?;
  let (is_active_subscriber, maybe_subscription_interval) = match subscription_row {
    Some(row) => {
      let active = matches!(
        row.maybe_stripe_subscription_status.as_deref(),
        Some("active") | Some("trialing")
      ) && row.subscription_expires_at > now;
      (active, row.maybe_stripe_recurring_interval)
    }
    None => (false, None),
  };

  let score = reengagement_score(
    aggregate.lifetime_net_spend_usd_cents,
    aggregate.maybe_days_since_last_payment,
    &deps.reengagement,
  );

  upsert_user_spend_summary(UpsertUserSpendSummaryArgs {
    payments_namespace: namespace,
    user_token,
    lifetime_gross_spend_usd_cents: aggregate.lifetime_gross_spend_usd_cents,
    lifetime_subscription_spend_usd_cents: aggregate.lifetime_subscription_spend_usd_cents,
    lifetime_credits_spend_usd_cents: aggregate.lifetime_credits_spend_usd_cents,
    lifetime_refund_usd_cents: aggregate.lifetime_refund_usd_cents,
    lifetime_net_spend_usd_cents: aggregate.lifetime_net_spend_usd_cents,
    lifetime_payment_count: aggregate.lifetime_payment_count,
    lifetime_refund_count: aggregate.lifetime_refund_count,
    maybe_first_payment_at: aggregate.maybe_first_payment_at,
    first_spend_usd_cents: aggregate.first_spend_usd_cents,
    maybe_last_payment_at: aggregate.maybe_last_payment_at,
    last_spend_usd_cents: aggregate.last_spend_usd_cents,
    maybe_days_since_first_payment: aggregate.maybe_days_since_first_payment,
    maybe_days_since_last_payment: aggregate.maybe_days_since_last_payment,
    net_spend_this_year_usd_cents: aggregate.net_spend_this_year_usd_cents,
    consecutive_active_weeks: aggregate.consecutive_active_weeks,
    consecutive_inactive_weeks: aggregate.consecutive_inactive_weeks,
    maybe_weeks_since_last_spend: aggregate.maybe_weeks_since_last_spend,
    is_active_subscriber,
    maybe_subscription_interval: maybe_subscription_interval.as_deref(),
    maybe_reengagement_score: Some(score),
    mysql_executor: &deps.mysql_pool,
    phantom: PhantomData,
  })
  .await?;

  Ok(())
}

/// Derived summary fields, computed from a user's full event history.
struct SummaryAggregate {
  lifetime_gross_spend_usd_cents: u64,
  lifetime_subscription_spend_usd_cents: u64,
  lifetime_credits_spend_usd_cents: u64,
  lifetime_refund_usd_cents: u64,
  lifetime_net_spend_usd_cents: u64,
  lifetime_payment_count: u32,
  lifetime_refund_count: u32,
  maybe_first_payment_at: Option<DateTime<Utc>>,
  first_spend_usd_cents: u64,
  maybe_last_payment_at: Option<DateTime<Utc>>,
  last_spend_usd_cents: u64,
  maybe_days_since_first_payment: Option<u32>,
  maybe_days_since_last_payment: Option<u32>,
  net_spend_this_year_usd_cents: i64,
  consecutive_active_weeks: u32,
  consecutive_inactive_weeks: u32,
  maybe_weeks_since_last_spend: Option<u32>,
}

/// Aggregate one user's events (assumed ascending by `payment_occurred_at`).
/// "Positive" events are payments; negatives are refunds/chargebacks. Weekly
/// cadence uses 7-day buckets relative to `now` (week 0 = the last 7 days).
fn compute_summary(events: &[UserSpendEventRow], now: DateTime<Utc>) -> SummaryAggregate {
  let current_year = now.year();

  let mut gross: i128 = 0;
  let mut subscription: i128 = 0;
  let mut credits: i128 = 0;
  let mut refund: i128 = 0;
  let mut net: i128 = 0;
  let mut net_this_year: i128 = 0;
  let mut payment_count: u32 = 0;
  let mut refund_count: u32 = 0;
  let mut first_payment: Option<&UserSpendEventRow> = None;
  let mut last_payment: Option<&UserSpendEventRow> = None;
  let mut active_weeks: HashSet<i64> = HashSet::new();

  for event in events {
    let amount = event.amount_usd_cents as i128;
    net += amount;
    if event.payment_occurred_at.year() == current_year {
      net_this_year += amount;
    }

    if event.amount_usd_cents > 0 {
      gross += amount;
      payment_count += 1;
      match event.event_type {
        PaymentEventType::SubscriptionInitial
        | PaymentEventType::SubscriptionRenewal
        | PaymentEventType::SubscriptionProrationUpgrade => subscription += amount,
        PaymentEventType::CreditPackPurchase => credits += amount,
        _ => {}
      }
      if first_payment.is_none() {
        first_payment = Some(event);
      }
      last_payment = Some(event);

      let days_ago = (now - event.payment_occurred_at).num_days();
      if days_ago >= 0 {
        active_weeks.insert(days_ago / DAYS_PER_WEEK);
      }
    } else if event.amount_usd_cents < 0 {
      refund += -amount;
      refund_count += 1;
    }
  }

  let maybe_first_payment_at = first_payment.map(|e| e.payment_occurred_at);
  let maybe_last_payment_at = last_payment.map(|e| e.payment_occurred_at);
  let first_spend_usd_cents = first_payment.map(|e| e.amount_usd_cents.max(0) as u64).unwrap_or(0);
  let last_spend_usd_cents = last_payment.map(|e| e.amount_usd_cents.max(0) as u64).unwrap_or(0);
  let maybe_days_since_first_payment =
    maybe_first_payment_at.map(|t| (now - t).num_days().max(0) as u32);
  let maybe_days_since_last_payment =
    maybe_last_payment_at.map(|t| (now - t).num_days().max(0) as u32);

  // Cadence from the set of active weeks-ago.
  let maybe_weeks_since_last_spend = active_weeks.iter().min().map(|w| *w as u32);
  let consecutive_active_weeks = {
    let mut week = 0i64;
    while active_weeks.contains(&week) {
      week += 1;
    }
    week as u32
  };
  let consecutive_inactive_weeks = maybe_weeks_since_last_spend.unwrap_or(0);

  SummaryAggregate {
    lifetime_gross_spend_usd_cents: gross.max(0) as u64,
    lifetime_subscription_spend_usd_cents: subscription.max(0) as u64,
    lifetime_credits_spend_usd_cents: credits.max(0) as u64,
    lifetime_refund_usd_cents: refund.max(0) as u64,
    lifetime_net_spend_usd_cents: net.max(0) as u64,
    lifetime_payment_count: payment_count,
    lifetime_refund_count: refund_count,
    maybe_first_payment_at,
    first_spend_usd_cents,
    maybe_last_payment_at,
    last_spend_usd_cents,
    maybe_days_since_first_payment,
    maybe_days_since_last_payment,
    net_spend_this_year_usd_cents: net_this_year.clamp(i64::MIN as i128, i64::MAX as i128) as i64,
    consecutive_active_weeks,
    consecutive_inactive_weeks,
    maybe_weeks_since_last_spend,
  }
}

#[cfg(test)]
mod tests {
  use chrono::Duration as ChronoDuration;

  use super::*;

  fn event(days_ago: i64, amount_usd_cents: i64, event_type: PaymentEventType, now: DateTime<Utc>) -> UserSpendEventRow {
    UserSpendEventRow {
      payment_occurred_at: now - ChronoDuration::days(days_ago),
      amount_usd_cents,
      event_type,
      maybe_credits_granted: None,
    }
  }

  #[test]
  fn aggregates_lifetime_and_cadence() {
    let now = Utc::now();
    // ascending by time => furthest in the past first
    let events = vec![
      event(40, 1999, PaymentEventType::SubscriptionInitial, now),  // ~6 wks ago
      event(20, 999, PaymentEventType::CreditPackPurchase, now),    // ~3 wks (week 2)
      event(5, 2999, PaymentEventType::SubscriptionRenewal, now),    // week 0
      event(3, -999, PaymentEventType::Refund, now),                // refund, week 0
    ];

    let agg = compute_summary(&events, now);

    assert_eq!(agg.lifetime_gross_spend_usd_cents, 1999 + 999 + 2999);
    assert_eq!(agg.lifetime_subscription_spend_usd_cents, 1999 + 2999);
    assert_eq!(agg.lifetime_credits_spend_usd_cents, 999);
    assert_eq!(agg.lifetime_refund_usd_cents, 999);
    assert_eq!(agg.lifetime_net_spend_usd_cents, (1999 + 999 + 2999 - 999) as u64);
    assert_eq!(agg.lifetime_payment_count, 3);
    assert_eq!(agg.lifetime_refund_count, 1);
    assert_eq!(agg.first_spend_usd_cents, 1999);
    assert_eq!(agg.last_spend_usd_cents, 2999);
    assert_eq!(agg.maybe_weeks_since_last_spend, Some(0));
    assert_eq!(agg.consecutive_inactive_weeks, 0);
    assert_eq!(agg.consecutive_active_weeks, 1);
  }

  #[test]
  fn lapsed_user_has_inactive_streak() {
    let now = Utc::now();
    let events = vec![event(60, 4999, PaymentEventType::SubscriptionInitial, now)];
    let agg = compute_summary(&events, now);
    assert_eq!(agg.maybe_weeks_since_last_spend, Some(60 / 7));
    assert_eq!(agg.consecutive_inactive_weeks, (60 / 7) as u32);
    assert_eq!(agg.consecutive_active_weeks, 0);
    assert_eq!(agg.maybe_days_since_last_payment, Some(60));
  }
}
