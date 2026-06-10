use crate::utils::enum_conversion::recurring_interval_to_reusable_type::recurring_interval_to_reusable_type;
use crate::utils::enum_conversion::subscription_status_to_reusable_type::subscription_status_to_reusable_type;
use crate::utils::expand_ids::expand_customer_id::expand_customer_id;
use crate::utils::expand_ids::expand_product_id::expand_product_id;
use crate::utils::metadata::get_metadata_user_token::get_metadata_user_token;
use anyhow::anyhow;
use chrono::NaiveDateTime;
use errors::AnyhowResult;
use reusable_types::stripe::stripe_recurring_interval::StripeRecurringInterval;
use reusable_types::stripe::stripe_subscription_status::StripeSubscriptionStatus;
use stripe_shared::{Subscription, SubscriptionStatus};
use tokens::tokens::users::UserToken;

// TODO: Code reuse with `lookup_subscription_from_subscription_id`.

#[derive(Clone, Debug)]
pub struct SubscriptionSummary {
  /// Our own internal user token, if it was attached to the subscription.
  pub user_token: Option<UserToken>,

  // Stripe foreign keys

  pub stripe_subscription_id: String,
  pub stripe_customer_id: String,
  pub stripe_product_id: String,
  pub stripe_price_id: String,
  
  /// Stripe production flag.
  pub stripe_is_production: bool,

  /// The state of the subscription: active, cancelled, and other states.
  pub stripe_subscription_status: StripeSubscriptionStatus,

  /// We really only care about this when subscriptions are scheduled to be terminated.
  /// Do we let the user continue receiving service in a grace period, or cut it off immediately
  /// at the scheduled service end date?
  /// (This avoids adding extra service days as a grace period.)
  pub cancel_at_period_end: bool,

  pub subscription_is_active: bool,
  pub subscription_interval: StripeRecurringInterval,

  // Which day of the month / month of the year to anchor the subscription against.
  // See the Stripe docs.
  pub stripe_billing_cycle_anchor: NaiveDateTime,

  /// When the subscription was "created" in Stripe (including any backdating)
  pub subscription_start_date: NaiveDateTime,

  // The updated billing period for the subscription
  pub current_billing_period_start: NaiveDateTime,
  pub current_billing_period_end: NaiveDateTime,

  // When the subscription will be (or was) canceled
  pub maybe_cancel_at: Option<NaiveDateTime>,
  pub maybe_canceled_at: Option<NaiveDateTime>,
}

/// Extract only the subscription details we care about
/// This should be unit testable against raw webhook JSON.
pub fn subscription_summary_extractor(subscription: &Subscription) -> AnyhowResult<SubscriptionSummary> {
  let subscription_id = subscription.id.to_string();

  // NB: Our internal user token.
  let maybe_user_token = get_metadata_user_token(&subscription.metadata);

  if subscription.items.data.len() != 1 {
    return Err(anyhow!("Too many items in subscription {} : {}",
      subscription_id, subscription.items.data.len()));
  }

  let item = match subscription.items.data.first() {
    None => return Err(anyhow!("Could not get first item in subscription {}", subscription_id)),
    Some(line_item) => line_item,
  };

  let price = item.price.clone();
  let product_id = expand_product_id(&price.product);

  let recurring = match &price.recurring {
    None => return Err(anyhow!("Could not get interval in subscription {}", subscription_id)),
    Some(recurring) => recurring,
  };

  // NB: period start and end dates were moved out of the root object and into the line items
  let start_date = NaiveDateTime::from_timestamp(subscription.start_date, 0);
  let period_start = NaiveDateTime::from_timestamp(item.current_period_start, 0);
  let period_end = NaiveDateTime::from_timestamp(item.current_period_end, 0);

  let stripe_billing_cycle_anchor = NaiveDateTime::from_timestamp(subscription.billing_cycle_anchor, 0);

  let maybe_cancel_at = subscription.cancel_at.map(|t| NaiveDateTime::from_timestamp(t, 0));
  let maybe_canceled_at = subscription.canceled_at.map(|t| NaiveDateTime::from_timestamp(t, 0));

  Ok(SubscriptionSummary {
    user_token: maybe_user_token,
    stripe_subscription_id: subscription_id,
    stripe_is_production: subscription.livemode,
    stripe_customer_id: expand_customer_id(&subscription.customer),
    stripe_subscription_status: subscription_status_to_reusable_type(subscription.status),
    cancel_at_period_end: subscription.cancel_at_period_end,
    stripe_product_id: product_id,
    stripe_price_id: price.id.to_string(),
    subscription_is_active: subscription.status == SubscriptionStatus::Active,
    subscription_interval: recurring_interval_to_reusable_type(recurring.interval),
    subscription_start_date: start_date,
    current_billing_period_start: period_start,
    current_billing_period_end: period_end,
    stripe_billing_cycle_anchor,
    maybe_cancel_at,
    maybe_canceled_at,
  })
}

#[cfg(test)]
mod tests {
  use crate::endpoints::webhook::webhook_event_enrichment::customer_subscription::common::subscription_summary_extractor::subscription_summary_extractor;
  use reusable_types::stripe::stripe_recurring_interval::StripeRecurringInterval;
  use reusable_types::stripe::stripe_subscription_status::StripeSubscriptionStatus;
  use stripe_shared::Subscription;
  use tokens::tokens::users::UserToken;

  #[test]
  fn test_subscription_summary_extractor_on_create_event() {
    // NB: Actual raw test data from Stripe to our webhook
    let json = r#"
      {"id":"sub_1LhA3MEU5se17MekeWvmTNyk","automatic_tax":{"enabled":false},
      "billing_cycle_anchor":1662979188,"cancel_at_period_end":false,
      "collection_method":"charge_automatically","created":1662979188,"current_period_end":1665571188,
      "current_period_start":1662979188,"customer":"cus_MQ03py0gWUh0Ox","currency":"usd","default_tax_rates":[],"discounts":[],
      "invoice_settings":{"issuer":{"type":"self"}},
      "items":{"data":[{"id":"si_MQ03hadVNfRnaS","created":1662979188,"current_period_end":1665571188,
      "current_period_start":1662979188,"deleted":false,"discounts":[],
      "plan":{"id":"price_1LeDnKEU5se17MekVr1iYYNf","object":"plan","active":true,"amount":700,"amount_decimal":"700","billing_scheme":"per_unit","created":1662278586,"currency":"usd","interval":"month","interval_count":1,"livemode":false,"metadata":{},"product":"prod_MMxi2J5y69VPbO","usage_type":"licensed"},"metadata":{},
      "price":{"id":"price_1LeDnKEU5se17MekVr1iYYNf","active":true,"billing_scheme":"per_unit",
      "created":1662278586,"currency":"usd","deleted":false,"livemode":false,"metadata":{},
      "product":"prod_MMxi2J5y69VPbO","recurring":{"interval":"month","interval_count":1,
      "usage_type":"licensed"},"tax_behavior":"exclusive","type":"recurring","unit_amount":700,
      "unit_amount_decimal":"700"},"quantity":1,"subscription":"sub_1LhA3MEU5se17MekeWvmTNyk",
      "tax_rates":[]}],"has_more":false,"total_count":1,
      "url":"/v1/subscription_items?subscription=sub_1LhA3MEU5se17MekeWvmTNyk"},
      "latest_invoice":"in_1LhA3MEU5se17MekUqOhZ9cu","livemode":false,
      "metadata":{"email":"email@email.com","username":"username","user_token":"U:TOKEN"},
      "payment_settings":{"save_default_payment_method":"off"},"start_date":1662979188,
      "status":"incomplete"}
    "#;

    let subscription = serde_json::from_str::<Subscription>(json).unwrap();

    let summary= subscription_summary_extractor(&subscription).unwrap();

    assert_eq!(summary.user_token, Some(UserToken::new_from_str("U:TOKEN")));
    assert_eq!(summary.stripe_subscription_id, "sub_1LhA3MEU5se17MekeWvmTNyk".to_string());
    assert_eq!(summary.stripe_subscription_status, StripeSubscriptionStatus::Incomplete);
    assert_eq!(summary.cancel_at_period_end, false);
    assert_eq!(summary.subscription_is_active, false);
    assert_eq!(summary.stripe_customer_id, "cus_MQ03py0gWUh0Ox".to_string());
    assert_eq!(summary.stripe_product_id, "prod_MMxi2J5y69VPbO".to_string());
    assert_eq!(summary.stripe_price_id, "price_1LeDnKEU5se17MekVr1iYYNf".to_string());
    assert_eq!(summary.subscription_interval, StripeRecurringInterval::Month);
    assert_eq!(summary.stripe_is_production, false);
    assert_eq!(summary.subscription_start_date.to_string(), "2022-09-12 10:39:48".to_string());
    assert_eq!(summary.current_billing_period_start.to_string(), "2022-09-12 10:39:48".to_string());
    assert_eq!(summary.current_billing_period_end.to_string(), "2022-10-12 10:39:48".to_string());
    assert_eq!(summary.maybe_cancel_at, None);
    assert_eq!(summary.maybe_canceled_at, None);
  }

  #[test]
  fn test_subscription_summary_extractor_on_update_event() {
    // NB: Actual raw test data from Stripe to our webhook
    let json = r#"
      {"id":"sub_1Lh1wvEU5se17Mekx72OzAzs","automatic_tax":{"enabled":false},
      "billing_cycle_anchor":1662948037,
      "cancel_at_period_end":false,"collection_method":"charge_automatically","created":1662948037,
      "current_period_end":1665540037,"current_period_start":1662948037,
      "customer":"cus_MPrgIen5Wh6QKG",
      "default_payment_method":"pm_1Lh1wtEU5se17MekpirKtMJm","currency":"usd","default_tax_rates":[],"discounts":[],
      "invoice_settings":{"issuer":{"type":"self"}},
      "items":{"data":[{"id":"si_MPrgTAV333Nq7c","created":1662948037,"current_period_end":1665540037,
      "current_period_start":1662948037,"deleted":false,"discounts":[],
      "plan":{"id":"price_1LeDnKEU5se17MekVr1iYYNf","object":"plan","active":true,"amount":700,"amount_decimal":"700","billing_scheme":"per_unit","created":1662278586,"currency":"usd","interval":"month","interval_count":1,"livemode":false,"metadata":{},"product":"prod_MMxi2J5y69VPbO","usage_type":"licensed"},"metadata":{},
      "price":{"id":"price_1LeDnKEU5se17MekVr1iYYNf","active":true,"billing_scheme":"per_unit",
      "created":1662278586,"currency":"usd","deleted":false,"livemode":false,"metadata":{},
      "product":"prod_MMxi2J5y69VPbO","recurring":{"interval":"month","interval_count":1,
      "usage_type":"licensed"},"tax_behavior":"exclusive","type":"recurring","unit_amount":700,
      "unit_amount_decimal":"700"},"quantity":1,"subscription":"sub_1Lh1wvEU5se17Mekx72OzAzs",
      "tax_rates":[]}],"has_more":false,"total_count":1,
      "url":"/v1/subscription_items?subscription=sub_1Lh1wvEU5se17Mekx72OzAzs"},
      "latest_invoice":"in_1Lh1wvEU5se17MekU99NMi1W","livemode":false,
      "metadata":{"username":"echelon","user_token":"U:token","email":"email@address.com"},
      "payment_settings":{"save_default_payment_method":"off"},
      "start_date":1662948037,"status":"active"}
    "#;

    let subscription = serde_json::from_str::<Subscription>(json).unwrap();

    let summary= subscription_summary_extractor(&subscription).unwrap();

    assert_eq!(summary.user_token, Some(UserToken::new_from_str("U:token")));
    assert_eq!(summary.stripe_subscription_id, "sub_1Lh1wvEU5se17Mekx72OzAzs".to_string());
    assert_eq!(summary.stripe_subscription_status, StripeSubscriptionStatus::Active);
    assert_eq!(summary.cancel_at_period_end, false);
    assert_eq!(summary.subscription_is_active, true);
    assert_eq!(summary.stripe_customer_id, "cus_MPrgIen5Wh6QKG".to_string());
    assert_eq!(summary.stripe_product_id, "prod_MMxi2J5y69VPbO".to_string());
    assert_eq!(summary.stripe_price_id, "price_1LeDnKEU5se17MekVr1iYYNf".to_string());
    assert_eq!(summary.subscription_interval, StripeRecurringInterval::Month);
    assert_eq!(summary.stripe_is_production, false);
    assert_eq!(summary.subscription_start_date.to_string(), "2022-09-12 02:00:37".to_string());
    assert_eq!(summary.current_billing_period_start.to_string(), "2022-09-12 02:00:37".to_string());
    assert_eq!(summary.current_billing_period_end.to_string(), "2022-10-12 02:00:37".to_string());
    assert_eq!(summary.maybe_cancel_at, None);
    assert_eq!(summary.maybe_canceled_at, None);
  }

  #[test]
  fn test_subscription_summary_extractor_on_control_panel_immediate_delete_event() {
    // NB: Actual raw test data from Stripe to our webhook
    let json = r#"
      {"id":"sub_1LhA3MEU5se17MekeWvmTNyk","automatic_tax":{"enabled":false},
      "billing_cycle_anchor":1662979188,"cancel_at_period_end":false,"canceled_at":1662979740,
      "collection_method":"charge_automatically","created":1662979188,"current_period_end":1665571188,
      "current_period_start":1662979188,"customer":"cus_MQ03py0gWUh0Ox",
      "default_payment_method":"pm_1LhA3LEU5se17MekViNvoYAx","currency":"usd","default_tax_rates":[],"discounts":[],
      "invoice_settings":{"issuer":{"type":"self"}},
      "ended_at":1662979740,"items":{"data":[{"id":"si_MQ03hadVNfRnaS","created":1662979188,
      "current_period_end":1665571188,"current_period_start":1662979188,
      "deleted":false,"discounts":[],
      "plan":{"id":"price_1LeDnKEU5se17MekVr1iYYNf","object":"plan","active":true,"amount":700,"amount_decimal":"700","billing_scheme":"per_unit","created":1662278586,"currency":"usd","interval":"month","interval_count":1,"livemode":false,"metadata":{},"product":"prod_MMxi2J5y69VPbO","usage_type":"licensed"},"metadata":{},"price":{"id":"price_1LeDnKEU5se17MekVr1iYYNf","active":true,
      "billing_scheme":"per_unit","created":1662278586,"currency":"usd","deleted":false,
      "livemode":false,"metadata":{},"product":"prod_MMxi2J5y69VPbO",
      "recurring":{"interval":"month","interval_count":1,"usage_type":"licensed"},
      "tax_behavior":"exclusive","type":"recurring","unit_amount":700,"unit_amount_decimal":"700"},
      "quantity":1,"subscription":"sub_1LhA3MEU5se17MekeWvmTNyk","tax_rates":[]}],"has_more":false,
      "total_count":1,
      "url":"/v1/subscription_items?subscription=sub_1LhA3MEU5se17MekeWvmTNyk"},
      "latest_invoice":"in_1LhA3MEU5se17MekUqOhZ9cu","livemode":false,
      "metadata":{"email":"email@email.com","username":"username","user_token":"U:TOKEN"},
      "payment_settings":{"save_default_payment_method":"off"},"start_date":1662979188,
      "status":"canceled"}
    "#;

    let subscription = serde_json::from_str::<Subscription>(json).unwrap();

    let summary= subscription_summary_extractor(&subscription).unwrap();

    assert_eq!(summary.user_token, Some(UserToken::new_from_str("U:TOKEN")));
    assert_eq!(summary.stripe_subscription_id, "sub_1LhA3MEU5se17MekeWvmTNyk".to_string());
    assert_eq!(summary.stripe_subscription_status, StripeSubscriptionStatus::Canceled);
    assert_eq!(summary.cancel_at_period_end, false);
    assert_eq!(summary.subscription_is_active, false);
    assert_eq!(summary.stripe_customer_id, "cus_MQ03py0gWUh0Ox".to_string());
    assert_eq!(summary.stripe_product_id, "prod_MMxi2J5y69VPbO".to_string());
    assert_eq!(summary.stripe_price_id, "price_1LeDnKEU5se17MekVr1iYYNf".to_string());
    assert_eq!(summary.subscription_interval, StripeRecurringInterval::Month);
    assert_eq!(summary.stripe_is_production, false);
    assert_eq!(summary.subscription_start_date.to_string(), "2022-09-12 10:39:48".to_string());
    assert_eq!(summary.current_billing_period_start.to_string(), "2022-09-12 10:39:48".to_string());
    assert_eq!(summary.current_billing_period_end.to_string(), "2022-10-12 10:39:48".to_string());
    assert_eq!(summary.maybe_cancel_at, None);
    assert_eq!(summary.maybe_canceled_at.map(|t| t.to_string()), Some("2022-09-12 10:49:00".to_string()));
  }

  #[test]
  fn test_subscription_summary_extractor_on_control_panel_cancel_at_end_of_billing_period() {
    // NB: This test data was taken from the Stripe control panel
    let json = r#"
      {
        "id": "sub_1Lj3PKEU5se17MekHrr1isFH",
        "object": "subscription",
        "application": null,
        "application_fee_percent": null,
        "automatic_tax": {
          "enabled": false
        },
        "billing_cycle_anchor": 1663430298,
        "billing_thresholds": null,
        "cancel_at": 1666022298,
        "cancel_at_period_end": true,
        "canceled_at": 1663575681,
        "collection_method": "charge_automatically",
        "created": 1663430298,
        "currency": "usd",
        "current_period_end": 1666022298,
        "current_period_start": 1663430298,
        "customer": "cus_MRxJT3KvFcAN6Z",
        "days_until_due": null,
        "default_payment_method": "pm_1Lj3PJEU5se17MekuWoSWsXu",
        "default_source": null,
        "default_tax_rates": [
        ],
        "description": null,
        "discount": null,
        "discounts": [
        ],
        "ended_at": null,
        "invoice_settings": {
          "issuer": {
            "type": "self"
          }
        },
        "items": {
          "object": "list",
          "data": [
            {
              "id": "si_MRxJErFpEt6eYS",
              "object": "subscription_item",
              "billing_thresholds": null,
              "created": 1663430298,
              "current_period_end": 1666022298,
              "current_period_start": 1663430298,
              "discounts": [],
              "metadata": {
              },
              "plan": {
                "id": "price_1LeDnKEU5se17MekVr1iYYNf",
                "object": "plan",
                "active": true,
                "aggregate_usage": null,
                "amount": 700,
                "amount_decimal": "700",
                "billing_scheme": "per_unit",
                "created": 1662278586,
                "currency": "usd",
                "interval": "month",
                "interval_count": 1,
                "livemode": false,
                "metadata": {
                },
                "nickname": null,
                "product": "prod_MMxi2J5y69VPbO",
                "tiers_mode": null,
                "transform_usage": null,
                "trial_period_days": null,
                "usage_type": "licensed"
              },
              "price": {
                "id": "price_1LeDnKEU5se17MekVr1iYYNf",
                "object": "price",
                "active": true,
                "billing_scheme": "per_unit",
                "created": 1662278586,
                "currency": "usd",
                "custom_unit_amount": null,
                "livemode": false,
                "lookup_key": null,
                "metadata": {
                },
                "nickname": null,
                "product": "prod_MMxi2J5y69VPbO",
                "recurring": {
                  "aggregate_usage": null,
                  "interval": "month",
                  "interval_count": 1,
                  "trial_period_days": null,
                  "usage_type": "licensed"
                },
                "tax_behavior": "exclusive",
                "tiers_mode": null,
                "transform_quantity": null,
                "type": "recurring",
                "unit_amount": 700,
                "unit_amount_decimal": "700"
              },
              "quantity": 1,
              "subscription": "sub_1Lj3PKEU5se17MekHrr1isFH",
              "tax_rates": [
              ]
            }
          ],
          "has_more": false,
          "total_count": 1,
          "url": "/v1/subscription_items?subscription=sub_1Lj3PKEU5se17MekHrr1isFH"
        },
        "latest_invoice": "in_1Lj3PKEU5se17MekkCjCtx0X",
        "livemode": false,
        "metadata": {
          "email": "e@mail.com",
          "user_token": "U:USER_TOKEN_VALUE",
          "username": "rust_test"
        },
        "next_pending_invoice_item_invoice": null,
        "pause_collection": null,
        "payment_settings": {
          "payment_method_options": null,
          "payment_method_types": null,
          "save_default_payment_method": "off"
        },
        "pending_invoice_item_interval": null,
        "pending_setup_intent": null,
        "pending_update": null,
        "plan": {
          "id": "price_1LeDnKEU5se17MekVr1iYYNf",
          "object": "plan",
          "active": true,
          "aggregate_usage": null,
          "amount": 700,
          "amount_decimal": "700",
          "billing_scheme": "per_unit",
          "created": 1662278586,
          "currency": "usd",
          "interval": "month",
          "interval_count": 1,
          "livemode": false,
          "metadata": {
          },
          "nickname": null,
          "product": "prod_MMxi2J5y69VPbO",
          "tiers_mode": null,
          "transform_usage": null,
          "trial_period_days": null,
          "usage_type": "licensed"
        },
        "quantity": 1,
        "schedule": null,
        "start_date": 1663430298,
        "status": "active",
        "test_clock": null,
        "transfer_data": null,
        "trial_end": null,
        "trial_start": null
      }
    "#;

    let subscription = serde_json::from_str::<Subscription>(json).unwrap();

    let summary= subscription_summary_extractor(&subscription).unwrap();

    // NB: It was scheduled to cancel at the end of the billing period and remains active for now
    //  These are the fields we don't expect to be impacted as the subscription remains active.
    assert_eq!(summary.user_token, Some(UserToken::new_from_str("U:USER_TOKEN_VALUE")));
    assert_eq!(summary.stripe_subscription_id, "sub_1Lj3PKEU5se17MekHrr1isFH".to_string());
    assert_eq!(summary.stripe_customer_id, "cus_MRxJT3KvFcAN6Z".to_string());
    assert_eq!(summary.stripe_product_id, "prod_MMxi2J5y69VPbO".to_string());
    assert_eq!(summary.stripe_price_id, "price_1LeDnKEU5se17MekVr1iYYNf".to_string());
    assert_eq!(summary.subscription_interval, StripeRecurringInterval::Month);
    assert_eq!(summary.stripe_is_production, false);
    assert_eq!(summary.subscription_start_date.to_string(), "2022-09-17 15:58:18".to_string());
    assert_eq!(summary.current_billing_period_start.to_string(), "2022-09-17 15:58:18".to_string());
    assert_eq!(summary.current_billing_period_end.to_string(), "2022-10-17 15:58:18".to_string());

    // NB: It was scheduled to cancel at the end of the billing period and remains active for now
    //  These are the updated fields of interest pertinent to this kind of update.
    assert_eq!(summary.stripe_subscription_status, StripeSubscriptionStatus::Active);
    assert_eq!(summary.cancel_at_period_end, true);
    assert_eq!(summary.subscription_is_active, true);
    assert_eq!(summary.maybe_cancel_at.map(|t| t.to_string()), Some("2022-10-17 15:58:18".to_string()));
    assert_eq!(summary.maybe_canceled_at.map(|t| t.to_string()), Some("2022-09-19 08:21:21".to_string()));
  }
}
