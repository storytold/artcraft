use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use enums::common::payments_namespace::PaymentsNamespace;
use tokens::tokens::users::UserToken;

/// Keyset page of distinct user tokens with spend activity in one namespace.
/// Ordered by `user_token`; start with an empty `after_user_token`.
pub struct ListUserTokensWithSpendActivityArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub payments_namespace: PaymentsNamespace,
  pub after_user_token: &'e str,
  pub limit: i64,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

pub async fn list_user_tokens_with_spend_activity<'e, 'c: 'e, E>(
  args: ListUserTokensWithSpendActivityArgs<'e, 'c, E>,
) -> Result<Vec<UserToken>, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let rows = sqlx::query_scalar!(
    r#"
SELECT DISTINCT maybe_user_token AS `user_token!: UserToken`
FROM user_spend_events
WHERE maybe_user_token IS NOT NULL
  AND is_production = TRUE
  AND payments_namespace = ?
  AND maybe_user_token > ?
ORDER BY maybe_user_token
LIMIT ?
    "#,
    args.payments_namespace.to_str(),
    args.after_user_token,
    args.limit,
  )
    .fetch_all(args.mysql_executor)
    .await?;

  Ok(rows)
}
