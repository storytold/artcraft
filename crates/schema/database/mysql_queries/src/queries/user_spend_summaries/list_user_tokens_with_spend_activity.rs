use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use enums::common::payments_namespace::PaymentsNamespace;
use tokens::tokens::users::UserToken;

/// A (user, namespace) pair that has at least one `user_spend_events` row.
pub struct UserActivityKey {
  pub user_token: UserToken,
  pub payments_namespace: PaymentsNamespace,
}

/// Keyset cursor over (user_token, payments_namespace). Start with empty strings.
pub struct ListUserTokensWithSpendActivityArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub after_user_token: &'e str,
  pub after_payments_namespace: &'e str,
  pub limit: i64,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

pub async fn list_user_tokens_with_spend_activity<'e, 'c: 'e, E>(
  args: ListUserTokensWithSpendActivityArgs<'e, 'c, E>,
) -> Result<Vec<UserActivityKey>, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let rows = sqlx::query_as!(
    UserActivityKey,
    r#"
SELECT DISTINCT
  maybe_user_token   AS `user_token!: UserToken`,
  payments_namespace AS `payments_namespace!: PaymentsNamespace`
FROM user_spend_events
WHERE maybe_user_token IS NOT NULL
  AND (maybe_user_token > ?
       OR (maybe_user_token = ? AND payments_namespace > ?))
ORDER BY maybe_user_token, payments_namespace
LIMIT ?
    "#,
    args.after_user_token,
    args.after_user_token,
    args.after_payments_namespace,
    args.limit,
  )
    .fetch_all(args.mysql_executor)
    .await?;

  Ok(rows)
}
