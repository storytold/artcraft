use std::collections::HashMap;
use std::convert::TryFrom;
use std::fs::File;
use std::io::Write;
use std::marker::PhantomData;
use std::time::Instant;

use chrono::{DateTime, NaiveDate, TimeZone, Utc};
use log::{info, warn};
use sqlx::{MySql, Pool};

use enums::by_table::user_spend_events::payment_event_type::PaymentEventType;
use enums::by_table::user_spend_events::payment_source::PaymentSource;
use enums::common::payments_namespace::PaymentsNamespace;
use errors::AnyhowResult;
use mysql_queries::queries::user_spend_events::backfill_get_user_token_by_email::{
  backfill_get_user_token_by_email, BackfillGetUserTokenByEmailArgs,
};
use mysql_queries::queries::user_spend_events::backfill_list_artcraft_customer_links::{
  backfill_list_artcraft_customer_links, BackfillListCustomerLinksArgs,
};
use mysql_queries::queries::user_spend_events::backfill_list_artcraft_ledger_payments::{
  backfill_list_artcraft_ledger_payments, BackfillListLedgerPaymentsArgs, LedgerPaymentRef,
};
use mysql_queries::queries::user_spend_events::insert_user_spend_event::{
  insert_user_spend_event, InsertUserSpendEventArgs,
};
use tokens::tokens::users::UserToken;

use crate::operations::backfill_user_spend_events::stripe_api::{Invoice, StripeApi};
use crate::operations::backfill_user_spend_events::sub_args::BackfillUserSpendEventsArgs;

/// Backfill `user_spend_events` from historical Stripe payments.
///
/// Stripe (REST) is the authoritative payment list (so we don't miss charged-
/// but-unfulfilled payments); the ArtCraft ledger (read pool) only ENRICHES each
/// payment with the granted credits + ledger-entry FK. Every event is upserted
/// (write pool) on the same `(payment_source, source_object_id)` dedup key the
/// webhook path uses, so rows already written live are no-ops. Payments that
/// can't be linked to a user are written to a CSV instead of inserted.
pub async fn backfill_user_spend_events(
  read_pool: &Pool<MySql>,
  write_pool: &Pool<MySql>,
  stripe: &StripeApi,
  args: BackfillUserSpendEventsArgs,
) -> AnyhowResult<()> {
  let started = Instant::now();
  let since = parse_since(&args.since)?;
  info!("Backfill user_spend_events since {since} (UTC). dry_run={}", args.dry_run);

  // ---- 1. Enrichment maps from the READ pool (replica) ----
  let ledger_rows = backfill_list_artcraft_ledger_payments(BackfillListLedgerPaymentsArgs {
    since,
    mysql_executor: read_pool,
    phantom: PhantomData,
  })
  .await?;
  info!("Loaded {} ArtCraft ledger payment refs (enrichment)", ledger_rows.len());
  let ledger_by_id: HashMap<String, LedgerPaymentRef> =
    ledger_rows.into_iter().map(|r| (r.stripe_object_id.clone(), r)).collect();

  let links = backfill_list_artcraft_customer_links(BackfillListCustomerLinksArgs {
    mysql_executor: read_pool,
    phantom: PhantomData,
  })
  .await?;
  info!("Loaded {} ArtCraft customer links (fallback attribution)", links.len());
  let user_by_customer: HashMap<String, UserToken> =
    links.into_iter().map(|l| (l.stripe_customer_id, l.user_token)).collect();

  let mut stats = Stats::default();
  let mut unattributed: Vec<UnattributedRow> = Vec::new();
  // Stripe customer -> resolved user, cached so deep attribution retrieves each
  // customer at most once.
  let mut customer_cache: HashMap<String, Option<UserToken>> = HashMap::new();

  // ---- 2. Credit-pack purchases: succeeded one-off PaymentIntents ----
  backfill_payment_intents(
    stripe, read_pool, write_pool, since, &args, &ledger_by_id, &user_by_customer,
    &mut customer_cache, &mut stats, &mut unattributed,
  )
  .await?;

  // ---- 3. Subscription payments: paid invoices (create/cycle) ----
  backfill_invoices(
    stripe, read_pool, write_pool, since, &args, &ledger_by_id, &user_by_customer,
    &mut customer_cache, &mut stats, &mut unattributed,
  )
  .await?;

  // ---- 4. Report unattributable payments ----
  write_unattributed_report(&args.unattributed_report, &unattributed)?;

  info!("==== BACKFILL SUMMARY ====");
  info!("  credit-pack purchases upserted: {}", stats.credit_packs);
  info!("  subscription payments upserted: {}", stats.subscriptions);
  info!("  skipped (not a tracked type):   {}", stats.skipped);
  info!("  UNATTRIBUTED (no user account): {} -> {}", unattributed.len(), args.unattributed_report);
  let elapsed = started.elapsed();
  info!("  elapsed: {:.1}s ({:.0} payments/sec)",
    elapsed.as_secs_f64(),
    (stats.credit_packs + stats.subscriptions) as f64 / elapsed.as_secs_f64().max(0.001),
  );
  if args.dry_run {
    info!("  (dry run — NOTHING was written to the database)");
  }
  Ok(())
}

// ---- Enumerators ----

async fn backfill_payment_intents(
  stripe: &StripeApi,
  read_pool: &Pool<MySql>,
  write_pool: &Pool<MySql>,
  since: DateTime<Utc>,
  args: &BackfillUserSpendEventsArgs,
  ledger_by_id: &HashMap<String, LedgerPaymentRef>,
  user_by_customer: &HashMap<String, UserToken>,
  customer_cache: &mut HashMap<String, Option<UserToken>>,
  stats: &mut Stats,
  unattributed: &mut Vec<UnattributedRow>,
) -> AnyhowResult<()> {
  info!("Enumerating Stripe PaymentIntents (credit packs) since {} …", since.format("%Y-%m-%d"));
  let mut starting_after: Option<String> = None;
  let mut processed = 0usize;
  let mut page_num = 0usize;

  loop {
    let page = stripe.list_payment_intents(since.timestamp(), starting_after.as_deref()).await?;
    page_num += 1;
    if page.data.is_empty() {
      break;
    }
    let last_id = page.data.last().map(|pi| pi.id.clone());

    for pi in &page.data {
      if let Some(limit) = args.limit {
        if processed >= limit {
          return Ok(());
        }
      }
      if pi.status != "succeeded" {
        continue;
      }
      let pi_id = pi.id.clone();
      // A one-off credit-pack PI carries our `user_token` metadata; subscription
      // PIs have empty metadata. The ledger `credit_banked` match is a backstop
      // for any historical pack PI that lacks metadata.
      let is_credit_pack = pi.metadata.contains_key("user_token")
        || ledger_by_id.get(&pi_id).map(|l| l.entry_type == "credit_banked").unwrap_or(false);
      if !is_credit_pack {
        stats.skipped += 1;
        continue;
      }
      processed += 1;

      let customer_id = pi.customer.clone();
      let charge_id = pi.latest_charge.clone();
      let occurred_at = DateTime::from_timestamp(pi.created, 0).unwrap_or_else(Utc::now);
      let mut maybe_user = resolve_user(
        pi.metadata.get("user_token").map(|s| s.as_str()),
        &pi_id, customer_id.as_deref(), ledger_by_id, user_by_customer,
      );
      if maybe_user.is_none() && args.deep_attribution {
        maybe_user = deep_resolve_user(stripe, read_pool, customer_cache, customer_id.as_deref(), None).await;
      }

      match maybe_user {
        Some(user) => {
          upsert_event(write_pool, args.dry_run, UpsertInput {
            event_type: PaymentEventType::CreditPackPurchase,
            amount_usd_cents: pi.amount_received,
            source_object_id: &pi_id,
            invoice_id: None,
            payment_intent_id: Some(&pi_id),
            charge_id: charge_id.as_deref(),
            customer_id: customer_id.as_deref(),
            user: &user,
            ledger: ledger_by_id.get(&pi_id),
            is_production: pi.livemode,
            occurred_at,
          })
          .await?;
          stats.credit_packs += 1;
        }
        None => unattributed.push(UnattributedRow {
          kind: "credit_pack",
          stripe_id: pi_id.clone(),
          amount_usd_cents: pi.amount_received,
          customer_id: customer_id.clone(),
          occurred_at,
        }),
      }
    }

    info!(
      "  payment_intents page {page_num}: {} fetched | packs={} skipped={} unattributed={}",
      page.data.len(), stats.credit_packs, stats.skipped, unattributed.len(),
    );
    if !page.has_more {
      break;
    }
    starting_after = last_id;
  }
  info!("PaymentIntents done: {} credit-pack event(s) across {page_num} page(s).", stats.credit_packs);
  Ok(())
}

async fn backfill_invoices(
  stripe: &StripeApi,
  read_pool: &Pool<MySql>,
  write_pool: &Pool<MySql>,
  since: DateTime<Utc>,
  args: &BackfillUserSpendEventsArgs,
  ledger_by_id: &HashMap<String, LedgerPaymentRef>,
  user_by_customer: &HashMap<String, UserToken>,
  customer_cache: &mut HashMap<String, Option<UserToken>>,
  stats: &mut Stats,
  unattributed: &mut Vec<UnattributedRow>,
) -> AnyhowResult<()> {
  info!("Enumerating Stripe paid invoices (subscriptions) since {} …", since.format("%Y-%m-%d"));
  let mut starting_after: Option<String> = None;
  let mut processed = 0usize;
  let mut page_num = 0usize;

  loop {
    let page = stripe.list_paid_invoices(since.timestamp(), starting_after.as_deref()).await?;
    page_num += 1;
    if page.data.is_empty() {
      break;
    }
    let last_id = page.data.last().and_then(|inv| inv.id.clone());

    for inv in &page.data {
      if let Some(limit) = args.limit {
        if processed >= limit {
          return Ok(());
        }
      }
      // Only subscription creation + renewal are in scope (prorations / manual
      // invoices are skipped, matching the webhook write-path).
      let event_type = match inv.billing_reason.as_deref() {
        Some("subscription_create") => PaymentEventType::SubscriptionInitial,
        Some("subscription_cycle") => PaymentEventType::SubscriptionRenewal,
        _ => {
          stats.skipped += 1;
          continue;
        }
      };
      let inv_id = match inv.id.clone() {
        Some(id) => id,
        None => {
          stats.skipped += 1;
          continue;
        }
      };
      processed += 1;

      let customer_id = inv.customer.clone();
      let occurred_at = DateTime::from_timestamp(inv.created, 0).unwrap_or_else(Utc::now);
      let mut maybe_user = resolve_user(
        invoice_metadata_user_token(inv),
        &inv_id, customer_id.as_deref(), ledger_by_id, user_by_customer,
      );
      if maybe_user.is_none() && args.deep_attribution {
        maybe_user = deep_resolve_user(
          stripe, read_pool, customer_cache, customer_id.as_deref(), inv.customer_email.as_deref(),
        )
        .await;
      }

      match maybe_user {
        Some(user) => {
          upsert_event(write_pool, args.dry_run, UpsertInput {
            event_type,
            amount_usd_cents: inv.amount_paid,
            source_object_id: &inv_id,
            invoice_id: Some(&inv_id),
            payment_intent_id: None,
            charge_id: None,
            customer_id: customer_id.as_deref(),
            user: &user,
            ledger: ledger_by_id.get(&inv_id),
            is_production: inv.livemode,
            occurred_at,
          })
          .await?;
          stats.subscriptions += 1;
        }
        None => unattributed.push(UnattributedRow {
          kind: "subscription",
          stripe_id: inv_id.clone(),
          amount_usd_cents: inv.amount_paid,
          customer_id: customer_id.clone(),
          occurred_at,
        }),
      }
    }

    info!(
      "  invoices page {page_num}: {} fetched | subscriptions={} skipped={} unattributed={}",
      page.data.len(), stats.subscriptions, stats.skipped, unattributed.len(),
    );
    if !page.has_more {
      break;
    }
    starting_after = last_id;
  }
  info!("Invoices done: {} subscription event(s) across {page_num} page(s).", stats.subscriptions);
  Ok(())
}

// ---- Helpers ----

/// Attribute a payment to a user, in order of reliability:
///   1. Stripe object metadata `user_token` (set at checkout).
///   2. The wallet ledger by Stripe id (`wallets.owner_user_token`) — this is
///      the "other half" that covers fulfilled subscriptions, which the customer
///      links table does NOT reliably have.
///   3. `user_stripe_customer_links` by customer id — LAST resort (sparse for
///      subscriptions).
fn resolve_user(
  metadata_user_token: Option<&str>,
  stripe_object_id: &str,
  customer_id: Option<&str>,
  ledger_by_id: &HashMap<String, LedgerPaymentRef>,
  user_by_customer: &HashMap<String, UserToken>,
) -> Option<UserToken> {
  if let Some(user_token) = metadata_user_token {
    if !user_token.is_empty() {
      return Some(UserToken(user_token.to_string()));
    }
  }
  if let Some(ledger) = ledger_by_id.get(stripe_object_id) {
    return Some(ledger.owner_user_token.clone());
  }
  if let Some(customer_id) = customer_id {
    if let Some(user_token) = user_by_customer.get(customer_id) {
      return Some(user_token.clone());
    }
  }
  None
}

/// Extract our `user_token` from an invoice. Subscription invoices usually carry
/// it on the subscription/line-item metadata, NOT the top-level invoice metadata
/// (which is typically empty), so we check all three locations.
fn invoice_metadata_user_token(inv: &Invoice) -> Option<&str> {
  if let Some(v) = inv.metadata.get("user_token") {
    if !v.is_empty() {
      return Some(v.as_str());
    }
  }
  if let Some(sd) = inv.parent.as_ref().and_then(|p| p.subscription_details.as_ref()) {
    if let Some(v) = sd.metadata.get("user_token") {
      if !v.is_empty() {
        return Some(v.as_str());
      }
    }
  }
  if let Some(line) = inv.lines.data.get(0) {
    if let Some(v) = line.metadata.get("user_token") {
      if !v.is_empty() {
        return Some(v.as_str());
      }
    }
  }
  None
}

/// Deep attribution (opt-in): when the cheap path fails, interrogate Stripe.
/// (1) invoice email -> users; (2) retrieve the Stripe Customer and use its
/// `user_token` metadata, then its email -> users. Customer retrieval is cached.
async fn deep_resolve_user(
  stripe: &StripeApi,
  read_pool: &Pool<MySql>,
  customer_cache: &mut HashMap<String, Option<UserToken>>,
  customer_id: Option<&str>,
  invoice_email: Option<&str>,
) -> Option<UserToken> {
  if let Some(email) = invoice_email {
    if let Some(user) = lookup_user_token_by_email(read_pool, email).await {
      return Some(user);
    }
  }

  let customer_id = customer_id?;
  if let Some(cached) = customer_cache.get(customer_id) {
    return cached.clone();
  }

  let mut resolved: Option<UserToken> = None;
  match stripe.retrieve_customer(customer_id).await {
    Ok(customer) if !customer.deleted => {
      if let Some(user_token) = customer.metadata.get("user_token") {
        if !user_token.is_empty() {
          resolved = Some(UserToken(user_token.clone()));
        }
      }
      if resolved.is_none() {
        if let Some(email) = &customer.email {
          resolved = lookup_user_token_by_email(read_pool, email).await;
        }
      }
    }
    Ok(_deleted) => {}
    Err(err) => warn!("deep attribution: retrieve customer {customer_id} failed: {err:?}"),
  }

  customer_cache.insert(customer_id.to_string(), resolved.clone());
  resolved
}

async fn lookup_user_token_by_email(read_pool: &Pool<MySql>, email: &str) -> Option<UserToken> {
  match backfill_get_user_token_by_email(BackfillGetUserTokenByEmailArgs {
    email_address: email,
    mysql_executor: read_pool,
    phantom: PhantomData,
  })
  .await
  {
    Ok(user) => user,
    Err(err) => {
      warn!("deep attribution: email lookup for {email:?} failed: {err:?}");
      None
    }
  }
}

struct UpsertInput<'a> {
  event_type: PaymentEventType,
  amount_usd_cents: i64,
  source_object_id: &'a str,
  invoice_id: Option<&'a str>,
  payment_intent_id: Option<&'a str>,
  charge_id: Option<&'a str>,
  customer_id: Option<&'a str>,
  user: &'a UserToken,
  ledger: Option<&'a LedgerPaymentRef>,
  is_production: bool,
  occurred_at: DateTime<Utc>,
}

async fn upsert_event(write_pool: &Pool<MySql>, dry_run: bool, input: UpsertInput<'_>) -> AnyhowResult<()> {
  if dry_run {
    return Ok(());
  }
  insert_user_spend_event(InsertUserSpendEventArgs {
    payments_namespace: PaymentsNamespace::Artcraft,
    maybe_user_token: Some(input.user),
    event_type: input.event_type,
    amount_usd_cents: input.amount_usd_cents,
    maybe_credits_granted: input.ledger.and_then(|l| u32::try_from(l.credits_delta).ok()),
    maybe_user_subscription_token: None,
    maybe_wallet_ledger_entry_token: input.ledger.map(|l| &l.ledger_token),
    payment_source: PaymentSource::Stripe,
    maybe_source_object_id: Some(input.source_object_id),
    maybe_stripe_customer_id: input.customer_id,
    maybe_stripe_invoice_id: input.invoice_id,
    maybe_stripe_payment_intent_id: input.payment_intent_id,
    maybe_stripe_charge_id: input.charge_id,
    maybe_stripe_event_id: None, // backfill has no originating webhook event
    is_production: input.is_production,
    payment_occurred_at: input.occurred_at,
    mysql_executor: write_pool,
    phantom: PhantomData,
  })
  .await?;
  Ok(())
}

fn write_unattributed_report(path: &str, rows: &[UnattributedRow]) -> AnyhowResult<()> {
  let mut file = File::create(path)?;
  writeln!(file, "kind,stripe_object_id,amount_usd_cents,stripe_customer_id,occurred_at,reason")?;
  for row in rows {
    writeln!(
      file,
      "{},{},{},{},{},no user_token in metadata/ledger/customer_link",
      row.kind,
      row.stripe_id,
      row.amount_usd_cents,
      row.customer_id.as_deref().unwrap_or(""),
      row.occurred_at.to_rfc3339(),
    )?;
  }
  if !rows.is_empty() {
    warn!("{} payment(s) could not be linked to a user — see {}", rows.len(), path);
  }
  Ok(())
}

fn parse_since(s: &str) -> AnyhowResult<DateTime<Utc>> {
  let date = NaiveDate::parse_from_str(s, "%Y-%m-%d")
    .map_err(|err| anyhow::anyhow!("invalid --since {s:?} (want YYYY-MM-DD): {err}"))?;
  let naive = date
    .and_hms_opt(0, 0, 0)
    .ok_or_else(|| anyhow::anyhow!("invalid time for --since {s:?}"))?;
  Ok(Utc.from_utc_datetime(&naive))
}

#[derive(Default)]
struct Stats {
  credit_packs: usize,
  subscriptions: usize,
  skipped: usize,
}

struct UnattributedRow {
  kind: &'static str,
  stripe_id: String,
  amount_usd_cents: i64,
  customer_id: Option<String>,
  occurred_at: DateTime<Utc>,
}
