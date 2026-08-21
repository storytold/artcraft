use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use enums::common::payments_namespace::PaymentsNamespace;

pub struct ListPaymentsNamespacesWithSpendActivityArgs<'c, E>
where
  E: Executor<'c, Database = MySql>,
{
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// The distinct payment namespaces that have any attributed spend activity.
pub async fn list_payments_namespaces_with_spend_activity<'c, E>(
  args: ListPaymentsNamespacesWithSpendActivityArgs<'c, E>,
) -> Result<Vec<PaymentsNamespace>, sqlx::Error>
where
  E: Executor<'c, Database = MySql>,
{
  let rows = sqlx::query_scalar!(
    r#"
SELECT DISTINCT payments_namespace AS `payments_namespace!: PaymentsNamespace`
FROM user_spend_events
WHERE maybe_user_token IS NOT NULL
  AND is_production = TRUE
    "#,
  )
    .fetch_all(args.mysql_executor)
    .await?;

  Ok(rows)
}
