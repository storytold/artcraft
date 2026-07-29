use std::marker::PhantomData;

use chrono::{DateTime, Duration as ChronoDuration, NaiveDate, TimeZone, Utc};
use log::{error, info, warn};

use mysql_queries::queries::user_daily_spends::aggregate_daily_spends_for_date::{
  aggregate_daily_spends_for_date, AggregateDailySpendsForDateArgs,
};
use mysql_queries::queries::user_daily_spends::upsert_user_daily_spend::{
  upsert_user_daily_spend, UpsertUserDailySpendArgs,
};

use crate::job::alert_on_error::alert_pager;
use crate::job_dependencies::JobDependencies;

const ALL_TIME_START: (i32, u32, u32) = (2020, 1, 1);

/// Backfill `user_daily_spends` for each UTC day from the configured start date
/// up to today, one date at a time. Days with no spend/refund produce no rows.
pub async fn backfill_daily_spends(deps: &JobDependencies) {
  let start_date = resolve_start_date(deps);
  let today = Utc::now().date_naive();
  info!("Daily-spends backfill window: {start_date} .. {today} (UTC).");

  let mut date = start_date;
  let mut total_upserted = 0u64;

  while date <= today {
    if deps.application_shutdown.get() {
      return;
    }
    match process_date(deps, date).await {
      Ok(count) => {
        total_upserted += count as u64;
        if count > 0 {
          info!("  {date}: upserted {count} daily row(s).");
        }
      }
      Err(err) => {
        error!("Daily-spends aggregation failed for {date}: {err:?}");
        alert_pager(
          &deps.pager,
          "user-spend-analytics: daily aggregation error",
          &format!("date={date}: {err:?}"),
        );
        let _ = deps.job_stats.increment_failure_count();
        tokio::time::sleep(deps.error_recovery).await;
      }
    }

    tokio::time::sleep(deps.query_delay).await;
    date = match date.succ_opt() {
      Some(next) => next,
      None => break,
    };
  }

  info!("Daily-spends backfill complete: {total_upserted} row(s) upserted.");
}

async fn process_date(deps: &JobDependencies, date: NaiveDate) -> Result<usize, sqlx::Error> {
  let range_start: DateTime<Utc> =
    Utc.from_utc_datetime(&date.and_hms_opt(0, 0, 0).expect("valid midnight"));
  let range_end = range_start + ChronoDuration::days(1);

  let aggregates = aggregate_daily_spends_for_date(AggregateDailySpendsForDateArgs {
    range_start,
    range_end,
    mysql_executor: &deps.mysql_pool,
    phantom: PhantomData,
  })
  .await?;

  let mut upserted = 0usize;
  for aggregate in &aggregates {
    if deps.application_shutdown.get() {
      break;
    }
    let result = upsert_user_daily_spend(UpsertUserDailySpendArgs {
      user_token: &aggregate.user_token,
      payments_namespace: aggregate.payments_namespace,
      spend_date: date,
      subscription_spend_usd_cents: aggregate.subscription_spend_usd_cents,
      credits_spend_usd_cents: aggregate.credits_spend_usd_cents,
      gross_spend_usd_cents: aggregate.gross_spend_usd_cents,
      refund_usd_cents: aggregate.refund_usd_cents,
      net_spend_usd_cents: aggregate.net_spend_usd_cents,
      payment_count: u32::try_from(aggregate.payment_count).unwrap_or(u32::MAX),
      credits_granted: aggregate.credits_granted,
      mysql_executor: &deps.mysql_pool,
      phantom: PhantomData,
    })
    .await;

    match result {
      Ok(()) => {
        upserted += 1;
        let _ = deps.job_stats.increment_success_count();
      }
      Err(err) => {
        error!("Daily upsert failed for user {} on {date}: {err:?}", aggregate.user_token.as_str());
        alert_pager(
          &deps.pager,
          "user-spend-analytics: daily upsert error",
          &format!("user={} date={date}: {err:?}", aggregate.user_token.as_str()),
        );
        let _ = deps.job_stats.increment_failure_count();
        tokio::time::sleep(deps.error_recovery).await;
      }
    }
  }

  Ok(upserted)
}

/// `BACKFILL_START_DATE` wins; else `today - BACKFILL_DAYS`; else all-time (with a loud warning).
fn resolve_start_date(deps: &JobDependencies) -> NaiveDate {
  if let Some(start_date) = deps.maybe_backfill_start_date {
    return start_date;
  }
  let today = Utc::now().date_naive();
  if let Some(days) = deps.maybe_backfill_days {
    return today - ChronoDuration::days(days.max(0));
  }
  warn!(
    "⚠️  Neither BACKFILL_START_DATE nor BACKFILL_DAYS is set — backfilling \
     user_daily_spends for ALL TIME. This is expensive; set one to bound the window."
  );
  NaiveDate::from_ymd_opt(ALL_TIME_START.0, ALL_TIME_START.1, ALL_TIME_START.2).expect("valid date")
}
