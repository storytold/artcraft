use crate::errors::select_optional_record_error::SelectOptionalRecordError;
use crate::helpers::boolean_converters::nullable_i8_to_bool_default_false;
use crate::types::query_map::QueryMap;
use chrono::{DateTime, Utc};
use enums_db::common::payments_namespace::PaymentsNamespace;
use sqlx;
use sqlx::mysql::MySqlRow;
use sqlx::pool::PoolConnection;
use sqlx::MySql;
use enums_db::common::stripe_subscription_status::StripeSubscriptionStatus;
use tokens::tokens::user_subscriptions::UserSubscriptionToken;
use tokens::tokens::users::UserToken;

pub struct UserSubscription {
  pub token: UserSubscriptionToken,
  
  pub user_token: UserToken,

  pub subscription_namespace: PaymentsNamespace,
  pub subscription_product_slug: String,

  pub stripe_customer_id: String,
  pub stripe_product_id: String,
  pub stripe_subscription_id: String,
  pub stripe_subscription_status: StripeSubscriptionStatus,
  pub stripe_invoice_is_paid: bool,

  /// When the subscription was created (Stripe's POV, not our db record),
  /// though even Stripe might have backdated it. It defaults to our DB record
  /// created timestamp until Stripe updates it.
  pub subscription_start_at: DateTime<Utc>,

  /// This is the authoritative timestamp for when the subscription expires.
  pub subscription_expires_at: DateTime<Utc>,

  /// When the current billing period ends (either auto-renew/rebill date or auto-cancel/cancellation date).
  pub current_billing_period_end_at: DateTime<Utc>,

  /// If the subscription is set to expire (perhaps in the future), this is the date it will expire.
  /// TODO: Determine if this is set on expired, payment invalid, or canceled subscriptions where the date
  ///  is backdated ahead of `maybe_canceled_at`.
  pub maybe_cancel_at: Option<DateTime<Utc>>,

  /// This might be *before* the subscription is canceled, depending on stripe setup and
  /// the cancellation algorithm used. Eg. a year-long subscription that ends next year
  /// might be maybe_canceled_at a few days ago, but set to `maybe_cancel_at` next year.
  pub maybe_canceled_at: Option<DateTime<Utc>>,
}

/// Technically, there may be more than one subscription record.
/// We sort the results and only return the first active artcraft subscription
/// by numeric ID so we should have a consistent view.
pub async fn find_subscription_for_owner_user_using_connection(
  user_token: &UserToken,
  namespace: PaymentsNamespace,
  connection: &mut PoolConnection<MySql>,
) -> Result<Option<UserSubscription>, SelectOptionalRecordError> {

  let query = query(user_token, namespace);

  let result = query
      .fetch_optional(&mut **connection)
      .await;

  map_result(result)
}


pub async fn find_subscription_for_owner_user_using_transaction(
  user_token: &UserToken,
  namespace: PaymentsNamespace,
  transaction: &mut sqlx::Transaction<'_, MySql>,
) -> Result<Option<UserSubscription>, SelectOptionalRecordError> {

  let query = query(user_token, namespace);

  let result = query
      .fetch_optional(&mut **transaction)
      .await;

  map_result(result)
}

fn map_result(result: Result<Option<RawUserSubscription>, sqlx::Error>) -> Result<Option<UserSubscription>, SelectOptionalRecordError> {
  match result {
    Ok(Some(record)) => Ok(Some(UserSubscription {
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
      stripe_invoice_is_paid: nullable_i8_to_bool_default_false(record.maybe_stripe_invoice_is_paid),
      subscription_start_at: record.subscription_start_at,
      subscription_expires_at: record.subscription_expires_at,
      current_billing_period_end_at: record.current_billing_period_end_at,
      maybe_cancel_at: record.maybe_cancel_at,
      maybe_canceled_at: record.maybe_canceled_at,
    })),
    Ok(None) => Ok(None),
    Err(e) => Err(e.into()),
  }
}

fn query(user_token: &UserToken, namespace: PaymentsNamespace)
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
  maybe_stripe_customer_id,
  maybe_stripe_product_id,
  maybe_stripe_subscription_id,
  maybe_stripe_subscription_status as `maybe_stripe_subscription_status: enums_db::common::stripe_subscription_status::StripeSubscriptionStatus`,
  maybe_stripe_invoice_is_paid,
  subscription_start_at,
  subscription_expires_at,
  current_billing_period_end_at,
  maybe_cancel_at,
  maybe_canceled_at

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


#[derive(sqlx::FromRow)]
struct RawUserSubscription {
  token: UserSubscriptionToken,
  
  user_token: UserToken,

  subscription_namespace: PaymentsNamespace,
  subscription_product_slug: String,

  maybe_stripe_customer_id: Option<String>,
  maybe_stripe_product_id: Option<String>,
  maybe_stripe_subscription_id: Option<String>,
  maybe_stripe_subscription_status: Option<StripeSubscriptionStatus>,
  maybe_stripe_invoice_is_paid: Option<i8>,

  subscription_start_at: DateTime<Utc>,
  subscription_expires_at: DateTime<Utc>,

  current_billing_period_end_at: DateTime<Utc>,

  maybe_cancel_at: Option<DateTime<Utc>>,
  maybe_canceled_at: Option<DateTime<Utc>>,
}
