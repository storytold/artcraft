use anyhow::anyhow;
use chrono::NaiveDateTime;
use enums_db::common::payments_namespace::PaymentsNamespace;
use errors::AnyhowResult;
use reusable_types::stripe::stripe_recurring_interval::StripeRecurringInterval;
use reusable_types::stripe::stripe_subscription_status::StripeSubscriptionStatus;
use sqlx::pool::PoolConnection;
use sqlx::{MySql, MySqlPool, Transaction};
use sqlx::mysql::MySqlArguments;
use sqlx::query::Query;
use tokens::tokens::user_subscriptions::UserSubscriptionToken;

// TODO: Make a trait with default impls to handle common query concerns.

pub struct UpsertUserSubscriptionWithInvoicePaidStatus<'a> {
  /// Stripe's assigned ID for the subscription
  /// This acts as an externally-provided unique key for records in this table.
  pub stripe_subscription_id: &'a str,

  /// Internal user token
  pub user_token: &'a str,

  /// True if the `invoice.paid` signal was received from Stripe.
  /// False if the `invoice.payment_failed` signal was received.
  pub invoice_is_paid: bool,

  /// The platform key, eg. "artcraft", "fakeyou", "storyteller_stream", "symphonia", etc.
  pub subscription_namespace: PaymentsNamespace,

  /// The name of the product the user is subscribing to within the category.
  pub subscription_product_slug: &'a str,

  pub maybe_stripe_customer_id: Option<&'a str>,

  pub maybe_stripe_product_id: Option<&'a str>,
  pub maybe_stripe_price_id: Option<&'a str>,

  pub maybe_stripe_recurring_interval : Option<StripeRecurringInterval>,
  pub maybe_stripe_subscription_status: Option<StripeSubscriptionStatus>,
  pub maybe_stripe_is_production: Option<bool>,

  /// When the subscription was created in Stripe.
  /// This may predate Stripe's subscription object `created` field due to backdating.
  pub subscription_start_at: NaiveDateTime,

  // Which day of the month, month of the year, etc. to anchor the subscription against.
  // See the Stripe docs for more.
  pub maybe_stripe_billing_cycle_anchor: Option<NaiveDateTime>,

  // Billing periods for the subscription...

  pub current_billing_period_start_at: NaiveDateTime,
  pub current_billing_period_end_at: NaiveDateTime,

  /// When the subscription is set to expire.
  /// This controls whether it is active or not.
  pub subscription_expires_at: NaiveDateTime,

  // Subscription cancellation (future and past)
  pub maybe_cancel_at: Option<NaiveDateTime>,
  pub maybe_canceled_at: Option<NaiveDateTime>,
}

impl <'a> UpsertUserSubscriptionWithInvoicePaidStatus<'a> {

  pub async fn upsert(&'a self, mysql_pool: &MySqlPool) -> AnyhowResult<()> {
    let mut conn = mysql_pool.acquire().await?;
    self.upsert_with_connection(&mut conn).await
  }
  
  pub async fn upsert_with_connection(&'a self, mysql_connection: &mut PoolConnection<MySql>) -> AnyhowResult<()> {
    let query = self.query();

    let query_result = query.execute(&mut **mysql_connection).await;

    let _record_id = match query_result {
      Ok(res) => res.last_insert_id(),
      Err(err) => return Err(anyhow!("Error upserting subscription record: {:?}", err)),
    };

    Ok(())
  }

  pub async fn upsert_with_transaction(&'a self, transaction: &mut Transaction<'_, MySql>) -> AnyhowResult<()> {
    let query = self.query();

    let query_result = query.execute(&mut **transaction).await;

    let _record_id = match query_result {
      Ok(res) => res.last_insert_id(),
      Err(err) => return Err(anyhow!("Error upserting subscription record: {:?}", err)),
    };

    Ok(())
  }
  
  
  fn query(&self) -> Query<MySql, MySqlArguments> {
    let token = UserSubscriptionToken::generate().to_string();

    // NB: The following behaviors are intentional
    //  - We only set the "token" initially.
    //  - Likewise, the stripe_subscription_id will remain constant.
    //  - The user token is updated to the new value so long as we don't
    //    attempt to set it to null or empty.
    //  - The various subscription dates, expiry, and statuses can change.
    //  - The product and price can change (eg. upgrades, downgrades).
    //  - Other "static" fields do not need to change on update, either.
    sqlx::query!(
        r#"
INSERT INTO user_subscriptions
SET
  token = ?,

  maybe_stripe_invoice_is_paid = ?,

  user_token = ?,
  subscription_namespace = ?,
  subscription_product_slug = ?,

  maybe_stripe_subscription_id = ?,
  maybe_stripe_customer_id = ?,

  maybe_stripe_product_id = ?,
  maybe_stripe_price_id = ?,

  maybe_stripe_recurring_interval = ?,
  maybe_stripe_subscription_status = ?,
  maybe_stripe_is_production = ?,
  
  maybe_stripe_billing_cycle_anchor = ?,

  subscription_start_at = ?,
  current_billing_period_start_at = ?,
  current_billing_period_end_at = ?,
  subscription_expires_at = ?,
  maybe_cancel_at = ?,
  maybe_canceled_at = ?,

  version = version + 1

ON DUPLICATE KEY UPDATE
  maybe_stripe_invoice_is_paid = ?,

  subscription_namespace = ?,
  subscription_product_slug= ?,

  maybe_stripe_product_id = ?,
  maybe_stripe_price_id = ?,

  maybe_stripe_recurring_interval = ?,
  maybe_stripe_subscription_status = ?,
    
  maybe_stripe_billing_cycle_anchor = ?,

  current_billing_period_start_at = ?,
  current_billing_period_end_at = ?,
  subscription_expires_at = ?,
  maybe_cancel_at = ?,
  maybe_canceled_at = ?,

  version = version + 1
        "#,
      // Insert
      token,

      self.invoice_is_paid,

      self.user_token,
      self.subscription_namespace.to_str(),
      self.subscription_product_slug,

      self.stripe_subscription_id,
      self.maybe_stripe_customer_id,

      self.maybe_stripe_product_id,
      self.maybe_stripe_price_id,

      self.maybe_stripe_recurring_interval.as_deref(),
      self.maybe_stripe_subscription_status.as_deref(),
      self.maybe_stripe_is_production,
      
      self.maybe_stripe_billing_cycle_anchor,

      self.subscription_start_at,
      self.current_billing_period_start_at,
      self.current_billing_period_end_at,
      self.subscription_expires_at,
      self.maybe_cancel_at,
      self.maybe_canceled_at,

      // Upsert
      self.invoice_is_paid,

      self.subscription_namespace,
      self.subscription_product_slug,

      self.maybe_stripe_product_id,
      self.maybe_stripe_price_id,

      self.maybe_stripe_recurring_interval.as_deref(),
      self.maybe_stripe_subscription_status.as_deref(),
      
      self.maybe_stripe_billing_cycle_anchor,

      self.current_billing_period_start_at,
      self.current_billing_period_end_at,
      self.subscription_expires_at,
      self.maybe_cancel_at,
      self.maybe_canceled_at,
    )
  }
}
