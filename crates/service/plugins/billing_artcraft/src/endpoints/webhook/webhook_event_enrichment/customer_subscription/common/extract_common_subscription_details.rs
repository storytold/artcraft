use crate::billing_action_fulfillment::artcraft_billing_action::{ArtcraftBillingAction, UpsertableSubscriptionDetails};
use crate::configs::get_artcraft_product_by_stripe_id_and_env::get_artcraft_product_by_stripe_id_and_env;
use crate::configs::stripe_artcraft_generic_product_info::StripeArtcraftGenericProductInfo;
use crate::endpoints::webhook::common::enriched_webhook_event::EnrichedWebhookEvent;
use crate::endpoints::webhook::common::stripe_artcraft_webhook_error::StripeArtcraftWebhookError;
use crate::endpoints::webhook::common::webhook_event_log_summary::WebhookEventLogSummary;
use crate::endpoints::webhook::webhook_event_enrichment::customer_subscription::common::calculate_subscription_end_date::calculate_subscription_end_date;
use crate::endpoints::webhook::webhook_event_enrichment::customer_subscription::common::subscription_summary_extractor::subscription_summary_extractor;
use log::{error, warn};
use server_environment::ServerEnvironment;
use stripe_shared::Subscription;

pub struct EventLogAndSubscriptionDetails {
  pub event_log_summary: WebhookEventLogSummary,
  pub subscription_details: UpsertableSubscriptionDetails,
}

pub fn extract_common_subscription_details(
  subscription: &Subscription,
  server_environment: ServerEnvironment,
) -> Result<EventLogAndSubscriptionDetails, StripeArtcraftWebhookError> {
  let summary = subscription_summary_extractor(subscription)
      .map_err(|err| {
        let reason = format!("Error extracting subscription from payload: {:?}", err);
        error!("{}", reason);
        StripeArtcraftWebhookError::ServerError(reason) // NB: This was probably *our* fault.
      })?;

  let event_log_summary = WebhookEventLogSummary {
    maybe_user_token: summary.user_token.clone(),
    maybe_event_entity_id: Some(summary.stripe_subscription_id.clone()),
    maybe_stripe_customer_id: Some(summary.stripe_customer_id.clone()),
    action_was_taken: false,
    should_ignore_retry: false,
  };

  let maybe_product = get_artcraft_product_by_stripe_id_and_env(
    &summary.stripe_product_id, server_environment);

  let product = match maybe_product {
    Some(StripeArtcraftGenericProductInfo::Subscription(subscription)) => subscription,
    Some(StripeArtcraftGenericProductInfo::CreditsPack(credits_pack)) => {
      error!("Received a non-subscription credits pack product ({}). This should not happen.", &credits_pack.slug.to_str());
      return Err(StripeArtcraftWebhookError::BadRequest("wrong product type".to_string()));
    }
    None => {
      error!("No matching product for stripe product ID: {}", &summary.stripe_product_id);
      return Err(StripeArtcraftWebhookError::BadRequest("no matching product".to_string()));
    }
  };

  // TODO: Multiple ways to get this; better ways to get this
  let user_token = match &summary.user_token {
    Some(token) => token.clone(),
    None => {
      warn!("No user token found in subscription metadata. Cannot proceed.");
      return Err(StripeArtcraftWebhookError::BadRequest("no user token in subscription event".to_string()));
    }
  };

  let calculated_end_date = calculate_subscription_end_date(&summary);


  let subscription_details = UpsertableSubscriptionDetails {
    // Unique Stripe foreign key
    stripe_customer_id: summary.stripe_customer_id,

    // Other Stripe foreign keys
    stripe_subscription_id: summary.stripe_subscription_id,
    stripe_price_id: summary.stripe_price_id,
    stripe_product_id: summary.stripe_product_id.clone(), // TODO: Avoid clone.

    // Artcraft info
    subscription: product.clone(), // TODO: Avoid clone
    owner_user_token: user_token,

    // Status
    stripe_subscription_status: summary.stripe_subscription_status,

    // Timing data
    stripe_billing_cycle_anchor: summary.stripe_billing_cycle_anchor,
    stripe_recurring_interval: summary.subscription_interval,
    calculated_subscription_expires_at: calculated_end_date,
    subscription_start_at: summary.subscription_start_date,
    current_billing_period_start_at: summary.current_billing_period_start,
    current_billing_period_end_at: summary.current_billing_period_end,
    maybe_cancel_at: summary.maybe_cancel_at,
    maybe_canceled_at: summary.maybe_canceled_at,

    // Misc
    stripe_is_production: summary.stripe_is_production,
  };

  Ok(EventLogAndSubscriptionDetails {
    event_log_summary,
    subscription_details,
  })
}