use clap::Parser;

/// Flags for the `backfill-user-spend-events` sub-command.
///
/// Parsed from the args AFTER the sub-command token, e.g.:
///   db-backfill backfill-user-spend-events --since 2026-02-01 --dry-run
#[derive(Parser, Debug, Clone)]
#[command(name = "backfill-user-spend-events")]
pub struct BackfillUserSpendEventsArgs {
  /// Only backfill payments whose Stripe object was created on/after this UTC
  /// date (YYYY-MM-DD). Payments effectively start in February.
  #[arg(long, default_value = "2026-02-01")]
  pub since: String,

  /// Plan only: enumerate + resolve + report, but do NOT upsert anything.
  #[arg(long, default_value_t = false)]
  pub dry_run: bool,

  /// CSV path where payments that could not be linked to a user account are
  /// written (one row each) for manual follow-up.
  #[arg(long, default_value = "unattributed_payments.csv")]
  pub unattributed_report: String,

  /// Optional cap on the number of Stripe objects processed per type. For
  /// testing against the read replica without walking the whole account.
  #[arg(long)]
  pub limit: Option<usize>,

  /// For payments that don't resolve to a user via metadata / ledger / customer
  /// links, additionally interrogate Stripe: retrieve the Customer and use its
  /// `user_token` metadata, then fall back to matching the customer/invoice
  /// email against our users table. Costs extra Stripe API calls (cached per
  /// customer), so it's opt-in.
  #[arg(long, default_value_t = false)]
  pub deep_attribution: bool,
}

/// Parse the sub-command flags. The first element of `args()` is the binary and
/// the second is the sub-command token; skipping one leaves the sub-command
/// token as clap's "binary name" (ignored) followed by the flags.
pub fn parse_backfill_user_spend_events_args() -> BackfillUserSpendEventsArgs {
  BackfillUserSpendEventsArgs::parse_from(std::env::args().skip(1))
}
