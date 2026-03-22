use crate::errors::select_optional_record_error::SelectOptionalRecordError;
use crate::types::query_map::QueryMap;
use enums_db::common::payments_namespace::PaymentsNamespace;
use sqlx;
use sqlx::mysql::MySqlRow;
use sqlx::pool::PoolConnection;
use sqlx::MySql;
use tokens::tokens::user_subscriptions::UserSubscriptionToken;
use tokens::tokens::users::UserToken;

pub struct PossiblyInactiveUserSubscription {
  pub token: UserSubscriptionToken,
  
  pub user_token: UserToken,

  pub subscription_namespace: PaymentsNamespace,
  pub subscription_product_slug: String,
  
  pub stripe_subscription_status: String,

  pub stripe_customer_id: String,
  pub stripe_product_id: String,
  pub stripe_subscription_id: String,
}

/// This is for restarting subscriptions after they have expired.
/// 
/// Technically, there may be more than one subscription record.
/// We sort the results and only return the first active artcraft subscription
/// by numeric ID so we should have a consistent view.
pub async fn find_possibly_inactive_first_subscription_for_owner_user_using_connection(
  user_token: &UserToken,
  namespace: PaymentsNamespace,
  connection: &mut PoolConnection<MySql>,
) -> Result<Option<PossiblyInactiveUserSubscription>, SelectOptionalRecordError> {

  let query = query_only_active(user_token, namespace);

  let result = query
      .fetch_optional(&mut **connection)
      .await;

  let maybe_result = map_result(result)?;

  if let Some(result) = maybe_result {
    return Ok(Some(result));
  }

  let query = query_possibly_inactive(user_token, namespace);

  let result = query
      .fetch_optional(&mut **connection)
      .await;

  map_result(result)
}


/// This is for restarting subscriptions after they have expired.
/// (See notes above.)
pub async fn find_possibly_inactive_first_subscription_for_owner_user_using_transaction(
  user_token: &UserToken,
  namespace: PaymentsNamespace,
  transaction: &mut sqlx::Transaction<'_, MySql>,
) -> Result<Option<PossiblyInactiveUserSubscription>, SelectOptionalRecordError> {

  let query = query_only_active(user_token, namespace);

  let result = query
      .fetch_optional(&mut **transaction)
      .await;

  let maybe_result = map_result(result)?;
  
  if let Some(result) = maybe_result {
    return Ok(Some(result));
  }

  let query = query_possibly_inactive(user_token, namespace);

  let result = query
      .fetch_optional(&mut **transaction)
      .await;

  map_result(result)
}

fn map_result(result: Result<Option<RawUserSubscription>, sqlx::Error>) -> Result<Option<PossiblyInactiveUserSubscription>, SelectOptionalRecordError> {
  match result {
    Ok(Some(record)) => Ok(Some(PossiblyInactiveUserSubscription {
      token: record.token,
      user_token: record.user_token,
      subscription_namespace: record.subscription_namespace,
      subscription_product_slug: record.subscription_product_slug,
      stripe_customer_id: record.maybe_stripe_customer_id
          .ok_or_else(|| SelectOptionalRecordError::RequiredFieldWasNull("maybe_stripe_customer_id"))?,
      stripe_product_id: record.maybe_stripe_product_id
          .ok_or_else(|| SelectOptionalRecordError::RequiredFieldWasNull("maybe_stripe_product_id"))?,
      stripe_subscription_id: record.maybe_stripe_subscription_id
          .ok_or_else(|| SelectOptionalRecordError::RequiredFieldWasNull("maybe_stripe_subscription_id"))?,
      stripe_subscription_status: record.maybe_stripe_subscription_status
          .ok_or_else(|| SelectOptionalRecordError::RequiredFieldWasNull("maybe_stripe_subscription_status"))?,
    })),
    Ok(None) => Ok(None),
    Err(e) => Err(e.into()),
  }
}

fn query_only_active(user_token: &UserToken, namespace: PaymentsNamespace)
  -> QueryMap<impl Send + FnMut(MySqlRow) -> Result<RawUserSubscription, sqlx::Error>>
{
  // NB: We want to eventually support multiple subscriptions per user (eg. company use case),
  // so we do not have a unique key on user token (but we do on stripe subscription id).
  // In the meantime, to ensure we use the same subscription each time, we order by id and
  // take the first one.
  sqlx::query_as!(
    RawUserSubscription,
    r#"
SELECT
  token as `token: tokens::tokens::user_subscriptions::UserSubscriptionToken`,
  user_token as `user_token: tokens::tokens::users::UserToken`,
  subscription_namespace as `subscription_namespace: enums_db::common::payments_namespace::PaymentsNamespace`,
  subscription_product_slug,
  maybe_stripe_subscription_status,
  maybe_stripe_customer_id,
  maybe_stripe_product_id,
  maybe_stripe_subscription_id

FROM user_subscriptions

WHERE
  user_token = ?
  AND subscription_namespace = ?
  AND maybe_stripe_customer_id IS NOT NULL
  AND maybe_stripe_subscription_id IS NOT NULL
  AND maybe_stripe_subscription_status IS NOT NULL
  AND maybe_stripe_subscription_status NOT IN ('canceled', 'incomplete_expired')
  AND subscription_expires_at > CURRENT_TIMESTAMP
  ORDER BY id ASC
  LIMIT 1
    "#,
    user_token.as_str(),
    namespace.to_str(),
  )
}

fn query_possibly_inactive(user_token: &UserToken, namespace: PaymentsNamespace)
  -> QueryMap<impl Send + FnMut(MySqlRow) -> Result<RawUserSubscription, sqlx::Error>>
{
  // NB: We want to eventually support multiple subscriptions per user (eg. company use case),
  // so we do not have a unique key on user token (but we do on stripe subscription id).
  // In the meantime, to ensure we use the same subscription each time, we order by id and
  // take the first one.
  sqlx::query_as!(
    RawUserSubscription,
    r#"
SELECT
  token as `token: tokens::tokens::user_subscriptions::UserSubscriptionToken`,
  user_token as `user_token: tokens::tokens::users::UserToken`,
  subscription_namespace as `subscription_namespace: enums_db::common::payments_namespace::PaymentsNamespace`,
  subscription_product_slug,
  maybe_stripe_subscription_status,
  maybe_stripe_customer_id,
  maybe_stripe_product_id,
  maybe_stripe_subscription_id

FROM user_subscriptions

WHERE
  user_token = ?
  AND subscription_namespace = ?
  AND maybe_stripe_customer_id IS NOT NULL
  AND maybe_stripe_subscription_id IS NOT NULL
  AND maybe_stripe_subscription_status IS NOT NULL
  ORDER BY id ASC
  LIMIT 1
    "#,
    user_token.as_str(),
    namespace.to_str(),
  )
}


#[derive(sqlx::FromRow)]
struct RawUserSubscription {
  token: UserSubscriptionToken,
  
  user_token: UserToken,

  subscription_namespace: PaymentsNamespace,
  subscription_product_slug: String,
  
  maybe_stripe_subscription_status: Option<String>,

  maybe_stripe_customer_id: Option<String>,
  maybe_stripe_product_id: Option<String>,
  maybe_stripe_subscription_id: Option<String>,
}
