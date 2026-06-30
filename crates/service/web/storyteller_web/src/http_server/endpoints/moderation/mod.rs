pub mod alerts;
pub mod debug_logs;
pub mod info;
pub mod ip_bans;
pub mod jobs;
pub mod staff_audit_logs;
pub mod user;
pub mod user_bans;
pub mod user_emails;
pub mod user_feature_flags;
pub mod user_referrals;
pub mod user_sessions;
pub mod user_stripe_data;
pub mod wallet_ledger_entries;
pub mod wallets;
pub mod user_daily_spends;
pub mod user_spend_events;
pub mod user_spend_summaries;

use enums::common::payments_namespace::PaymentsNamespace;
use crate::http_server::common_responses::common_web_error::CommonWebError;

/// Resolve the optional `payments_namespace` query param, defaulting to `artcraft`.
pub(crate) fn resolve_payments_namespace(
  maybe_namespace: Option<&str>,
) -> Result<PaymentsNamespace, CommonWebError> {
  match maybe_namespace {
    None => Ok(PaymentsNamespace::Artcraft),
    Some(value) => PaymentsNamespace::from_str(value)
      .map_err(|_| CommonWebError::BadInputWithSimpleMessage("invalid payments_namespace".to_string())),
  }
}
