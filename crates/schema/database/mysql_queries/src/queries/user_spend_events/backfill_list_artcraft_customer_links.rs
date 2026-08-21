use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use tokens::tokens::users::UserToken;

/// A (stripe_customer_id -> user_token) link in the ArtCraft payments namespace.
/// NB: this table is sparse for subscriptions, so it is the LAST-resort fallback
/// for attribution (Stripe metadata and the wallet ledger come first).
pub struct ArtcraftCustomerLink {
  pub stripe_customer_id: String,
  pub user_token: UserToken,
}

pub struct BackfillListCustomerLinksArgs<'c, E>
where
  E: Executor<'c, Database = MySql>,
{
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Load all ArtCraft `user_stripe_customer_links` for the backfill's in-memory
/// customer→user fallback map.
pub async fn backfill_list_artcraft_customer_links<'c, E>(
  args: BackfillListCustomerLinksArgs<'c, E>,
) -> Result<Vec<ArtcraftCustomerLink>, sqlx::Error>
where
  E: Executor<'c, Database = MySql>,
{
  let rows = sqlx::query_as!(
    ArtcraftCustomerLink,
    r#"
SELECT
  stripe_customer_id AS `stripe_customer_id!`,
  user_token         AS `user_token!: UserToken`
FROM user_stripe_customer_links
WHERE payments_namespace = 'artcraft'
    "#,
  )
    .fetch_all(args.mysql_executor)
    .await?;

  Ok(rows)
}
