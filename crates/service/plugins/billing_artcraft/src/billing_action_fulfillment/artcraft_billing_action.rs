use crate::configs::credits_packs::stripe_artcraft_credits_pack_info::StripeArtcraftCreditsPackInfo;
use crate::configs::subscriptions::stripe_artcraft_subscription_info::StripeArtcraftSubscriptionInfo;
use chrono::{DateTime, NaiveDateTime, Utc};
use enums::by_table::user_spend_events::payment_event_type::PaymentEventType;
use reusable_types::stripe::stripe_recurring_interval::StripeRecurringInterval;
use reusable_types::stripe::stripe_subscription_status::StripeSubscriptionStatus;
use tokens::tokens::users::UserToken;
use tokens::tokens::wallets::WalletToken;

pub enum ArtcraftBillingAction {
  /// An ignorable event.
  IgnorableEvent,

  /// A user purchased wallet credits.
  WalletCreditsPurchase(WalletCreditsPurchaseEvent),

  SubscriptionCreated(UpsertableSubscriptionDetails),
  SubscriptionUpdated(UpsertableSubscriptionDetails),
  SubscriptionDeleted(UpsertableSubscriptionDetails),
  
  SubscriptionPaid(SubscriptionPaidEvent),

  CustomerCreated(UserCustomerLink),
  CustomerUpdated(UserCustomerLink),

  // TODO:
  SubscriptionRenewalBillingFailed,
  SubscriptionRenewalBillingSucceeded,
  SubscriptionCanceled,
}

pub struct UserCustomerLink {
  pub user_token: UserToken,
  pub stripe_customer_id: String,
}

pub struct WalletCreditsPurchaseEvent {
  pub owner_user_token: UserToken,

  // We might have sent the wallet to stripe.
  // If not, we'll need to look it up or create one.
  pub maybe_wallet_token: Option<WalletToken>,

  pub pack: StripeArtcraftCreditsPackInfo,

  // NB: This is a multiplier on the pack's base value.
  pub quantity: u64,
  
  /// Token to track in the wallet_ledger_events
  pub ledger_event_ref: Option<String>,

  /// Also potentially save to `user_stripe_customer_links` table.
  pub maybe_stripe_customer_id: Option<String>,

  /// USD cents actually collected (Stripe `payment_intent.amount_received`).
  pub amount_usd_cents: i64,

  /// Stripe livemode.
  pub is_production: bool,

  /// When the money moved (Stripe `payment_intent.created`).
  pub payment_occurred_at: DateTime<Utc>,

  /// The successful charge behind the payment intent, if present.
  pub maybe_stripe_charge_id: Option<String>,

  /// The Stripe webhook event id (`evt_...`) that produced this row.
  pub maybe_stripe_event_id: Option<String>,
}


pub struct UpsertableSubscriptionDetails {
  /// Stripe's subscription_id is a unique foreign key  in the `users_subscriptions` table!
  pub stripe_subscription_id: String,

  // Other stripe foreign keys ...

  pub stripe_customer_id: String,
  pub stripe_product_id: String,
  pub stripe_price_id: String,

  /// Artcraft subscription product
  pub subscription: StripeArtcraftSubscriptionInfo,

  /// Artcraft user
  pub owner_user_token: UserToken,

  /// The state of the subscription: active, cancelled, and other states.
  pub stripe_subscription_status: StripeSubscriptionStatus,

  pub stripe_recurring_interval : StripeRecurringInterval,

  // Which day of the month / month of the year to anchor the subscription against.
  // See the Stripe docs.
  pub stripe_billing_cycle_anchor: NaiveDateTime,

  pub stripe_is_production: bool,

  /// When the subscription was "created" in Stripe (including any backdating)
  pub subscription_start_at: NaiveDateTime,

  // The updated billing period for the subscription
  pub current_billing_period_start_at: NaiveDateTime,
  pub current_billing_period_end_at: NaiveDateTime,

  /// When the subscription is set to expire.
  /// TODO: - maybe not - This controls whether it is active or not.
  pub calculated_subscription_expires_at: NaiveDateTime,

  // Subscription cancellation (future and past)
  /// TODO: - maybe not - This controls whether it is active or not.
  pub maybe_cancel_at: Option<NaiveDateTime>,
  pub maybe_canceled_at: Option<NaiveDateTime>,
}

pub struct SubscriptionPaidEvent {
  /// Stripe's subscription_id is a unique foreign key  in the `users_subscriptions` table!
  pub stripe_subscription_id: String,

  // Other stripe foreign keys ...

  pub stripe_customer_id: String,
  pub stripe_product_id: String,
  pub stripe_price_id: String,

  /// Artcraft subscription product
  pub artcraft_subscription: StripeArtcraftSubscriptionInfo,

  /// Artcraft user
  pub owner_user_token: UserToken,

  /// The state of the subscription: active, cancelled, and other states.
  pub stripe_subscription_status: StripeSubscriptionStatus,

  pub stripe_recurring_interval : StripeRecurringInterval,

  // Which day of the month / month of the year to anchor the subscription against.
  // See the Stripe docs.
  pub stripe_billing_cycle_anchor: NaiveDateTime,

  pub stripe_is_production: bool,

  /// When the subscription was "created" in Stripe (including any backdating)
  pub subscription_start_at: NaiveDateTime,

  // The updated billing period for the subscription
  pub current_billing_period_start_at: NaiveDateTime,
  pub current_billing_period_end_at: NaiveDateTime,

  /// When the subscription is set to expire.
  /// TODO: - maybe not - This controls whether it is active or not.
  pub calculated_subscription_expires_at: NaiveDateTime,

  // Subscription cancellation (future and past)
  /// TODO: - maybe not - This controls whether it is active or not.
  pub maybe_cancel_at: Option<NaiveDateTime>,
  pub maybe_canceled_at: Option<NaiveDateTime>,

  /// Token to track in the wallet_ledger_events
  pub ledger_event_ref: Option<String>,
  
  /// For eagerly created user records (in the new checkout flow), we need to update the user's email.
  /// We started creating user accounts without a username, email, and password - so we need to collect it here.
  pub customer_email: Option<String>,

  /// USD cents actually collected (Stripe `invoice.amount_paid`).
  pub amount_usd_cents: i64,

  /// Whether this is the first paid invoice (initial) or a renewal.
  pub payment_event_type: PaymentEventType,

  /// When the money moved (Stripe `invoice.created`).
  pub payment_occurred_at: DateTime<Utc>,

  /// The Stripe webhook event id (`evt_...`) that produced this row.
  pub maybe_stripe_event_id: Option<String>,
}
