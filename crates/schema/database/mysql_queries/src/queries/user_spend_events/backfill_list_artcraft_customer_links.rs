use std::marker::PhantomData;

use sqlx::{Executor, MySql, Row};

use tokens::tokens::users::UserToken;

/// A (stripe_customer_id -> user_token) link in the ArtCraft payments namespace,
/// used as the final fallback to attribute a Stripe-enumerated payment to a user
/// when neither the object metadata nor the ledger yields a user token.
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
///
/// NB: runtime `sqlx::query()` (read replica; keeps the offline cache out of it).
pub async fn backfill_list_artcraft_customer_links<'c, E>(
  args: BackfillListCustomerLinksArgs<'c, E>,
) -> Result<Vec<ArtcraftCustomerLink>, sqlx::Error>
where
  E: Executor<'c, Database = MySql>,
{
  let rows = sqlx::query(
    r#"
SELECT stripe_customer_id, user_token
FROM user_stripe_customer_links
WHERE payments_namespace = 'artcraft'
    "#,
  )
    .fetch_all(args.mysql_executor)
    .await?;

  let mut out = Vec::with_capacity(rows.len());
  for row in rows {
    out.push(ArtcraftCustomerLink {
      stripe_customer_id: row.try_get("stripe_customer_id")?,
      user_token: UserToken(row.try_get("user_token")?),
    });
  }

  Ok(out)
}
