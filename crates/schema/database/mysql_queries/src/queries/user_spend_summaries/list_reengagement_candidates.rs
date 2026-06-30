use std::marker::PhantomData;

use chrono::{DateTime, Utc};
use sqlx::{Executor, MySql};

use tokens::tokens::users::UserToken;

/// A re-engagement candidate: a lapsed spender (score > 0) joined to display info.
pub struct ReengagementCandidate {
  pub user_token: UserToken,
  pub username: String,
  pub display_name: String,
  pub email_gravatar_hash: String,
  pub reengagement_score: u32,
  pub lifetime_net_spend_usd_cents: u64,
  pub maybe_last_payment_at: Option<DateTime<Utc>>,
  pub maybe_days_since_last_payment: Option<u32>,
  pub maybe_weeks_since_last_spend: Option<u32>,
  pub is_active_subscriber: bool,
}

pub struct ListReengagementCandidatesArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub payments_namespace: &'e str,
  pub limit: i64,
  pub offset: i64,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Users that need re-engagement, highest re-engagement score first.
pub async fn list_reengagement_candidates<'e, 'c: 'e, E>(
  args: ListReengagementCandidatesArgs<'e, 'c, E>,
) -> Result<Vec<ReengagementCandidate>, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let rows = sqlx::query_as!(
    ReengagementCandidate,
    r#"
SELECT
  s.user_token AS `user_token!: UserToken`,
  u.username AS `username!`,
  u.display_name AS `display_name!`,
  u.email_gravatar_hash AS `email_gravatar_hash!`,
  s.maybe_reengagement_score AS `reengagement_score!: u32`,
  s.lifetime_net_spend_usd_cents,
  s.last_payment_at AS `maybe_last_payment_at: DateTime<Utc>`,
  s.days_since_last_payment AS `maybe_days_since_last_payment: u32`,
  s.weeks_since_last_spend AS `maybe_weeks_since_last_spend: u32`,
  s.is_active_subscriber AS `is_active_subscriber: bool`
FROM user_spend_summaries s
JOIN users u ON u.token = s.user_token
WHERE s.payments_namespace = ?
  AND s.maybe_reengagement_score > 0
ORDER BY s.maybe_reengagement_score DESC, s.id ASC
LIMIT ? OFFSET ?
    "#,
    args.payments_namespace,
    args.limit,
    args.offset,
  )
    .fetch_all(args.mysql_executor)
    .await?;

  Ok(rows)
}
