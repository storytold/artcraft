use crate::billing_action_fulfillment::artcraft_billing_action::{ArtcraftBillingAction, SubscriptionPaidEvent, WalletCreditsPurchaseEvent};
use crate::configs::get_artcraft_product_by_stripe_id_and_env::get_artcraft_product_by_stripe_id_and_env;
use crate::configs::stripe_artcraft_generic_product_info::StripeArtcraftGenericProductInfo;
use crate::endpoints::webhook::common::enriched_webhook_event::EnrichedWebhookEvent;
use crate::endpoints::webhook::common::stripe_artcraft_webhook_error::StripeArtcraftWebhookError;
use crate::endpoints::webhook::common::webhook_event_log_summary::WebhookEventLogSummary;
use crate::stripe_requests::stripe_lookup_subscription_from_subscription_id::stripe_lookup_subscription_from_subscription_id;
use crate::utils::expand_ids::expand_customer_id::expand_customer_id;
use crate::utils::expand_ids::expand_subscription_id::expand_subscription_id;
use crate::utils::metadata::get_metadata_user_token::get_metadata_user_token;
use crate::utils::stripe_event_descriptor::StripeEventDescriptor;
use log::{error, info, warn};
use server_environment::ServerEnvironment;
use stripe::Client;
use stripe_shared::{Invoice, InvoiceBillingReason, InvoiceStatus};
use stripe_types::Expandable;

// Handle event type: 'invoice.paid'
//
// Invoices are generated for subscriptions, not one-off charges and purchases.
//
// https://stripe.com/docs/billing/subscriptions/webhooks :
//
// Sent when the invoice is successfully paid. You can provision access to your product when you
// receive this event and the subscription `status` is `active`.
//
// https://stripe.com/docs/billing/subscriptions/webhooks#active-subscriptions :
//
// 1. A few days prior to renewal, your site receives an invoice.upcoming event at the webhook
//    endpoint. You can listen for this event to add extra invoice items to the upcoming invoice.
// 2. Your site receives an invoice.paid event.
// 3. Your webhook endpoint finds the customer the payment was made for.
// 4. Your webhook endpoint updates the customer’s access expiration date in your database to the
//    appropriate date in the future (plus a day or two for leeway).
//
pub async fn invoice_paid_extractor(
  stripe_event_descriptor: &StripeEventDescriptor,
  invoice: &Invoice,
  server_environment: ServerEnvironment,
  stripe_client: &Client,
) -> Result<EnrichedWebhookEvent, StripeArtcraftWebhookError> {

  let maybe_user_token = invoice.metadata
      .as_ref()
      .map(|metadata| get_metadata_user_token(metadata))
      .flatten();

  let maybe_stripe_customer_id  = invoice.customer
      .as_ref()
      .map(|c| expand_customer_id(c));

  // NB: We probably don't have a root-level subscription since this is a webhook.
  let mut maybe_stripe_subscription_id = invoice.subscription
      .as_ref()
      .map(|s| expand_subscription_id(s));

  // NB: But we probably do have a parent object.
  if maybe_stripe_subscription_id.is_none() {
    maybe_stripe_subscription_id = invoice.parent
        .as_ref()
        .map(|parent| parent.subscription_details.as_ref())
        .flatten()
        .map(|parent_sub| parent_sub.subscription.id().to_string());
  }

  let mut event_log_summary = WebhookEventLogSummary {
    maybe_stripe_customer_id,
    maybe_user_token,
    maybe_event_entity_id: None,
    action_was_taken: false,
    should_ignore_retry: true,
  };

  let is_paid = match invoice.status {
    Some(InvoiceStatus::Paid) => true,
    _ => false,
  };

  if !is_paid {
    info!("{} : invoice is not paid...", stripe_event_descriptor);
    return Ok(EnrichedWebhookEvent::from_actionless_log(event_log_summary));
  }

  match invoice.billing_reason {
    Some(InvoiceBillingReason::SubscriptionCycle) => {}, // Typical renewal invoice
    Some(InvoiceBillingReason::SubscriptionUpdate) => {
      // NB: The logic for handling prorations will be a little bit involved. We can do this later.
      // For now, let's stick to "at end of billing cycle" updates.
      warn!("Skipping likely invoice proration.");
      return Ok(EnrichedWebhookEvent::from_actionless_log(event_log_summary));
    },
    _ => {},
  }

  let subscription_id = match maybe_stripe_subscription_id {
    Some(subscription_id) => subscription_id,
    None => {
      info!("{} : invoice is not for a subscription; skipping ...", stripe_event_descriptor);
      return Ok(EnrichedWebhookEvent::from_actionless_log(event_log_summary));
    }
  };

  info!("Calling Stripe to look up subscription info...");

  let subscription = stripe_lookup_subscription_from_subscription_id(
    &subscription_id, stripe_client).await?;

  // TODO: Multiple ways to get this; better ways to get this
  let user_token = match &subscription.maybe_user_token {
    Some(token) => token.clone(),
    None => {
      warn!("No user token found in subscription metadata. Cannot proceed.");
      return Err(StripeArtcraftWebhookError::BadRequest("no user token in subscription metadata".to_string()));
    }
  };

  let maybe_product = get_artcraft_product_by_stripe_id_and_env(
    &subscription.stripe_product_id, server_environment);

  let product = match maybe_product {
    Some(StripeArtcraftGenericProductInfo::Subscription(subscription)) => subscription,
    Some(StripeArtcraftGenericProductInfo::CreditsPack(credits_pack)) => {
      error!("Received a non-subscription credits pack product ({}). This should not happen.", &credits_pack.slug.to_str());
      return Err(StripeArtcraftWebhookError::BadRequest("wrong product type".to_string()));
    }
    None => {
      error!("No matching product for stripe product ID: {}", &subscription.stripe_product_id);
      return Err(StripeArtcraftWebhookError::BadRequest("no matching product".to_string()));
    }
  };

  let ledger_event_ref = invoice.id
      .as_ref()
      .map(|id| id.to_string())
      .unwrap_or_else(|| stripe_event_descriptor.stripe_event_id.clone());

  info!("{} : invoice paid is for subscription.", stripe_event_descriptor);
  

  Ok(EnrichedWebhookEvent {
    maybe_billing_action: Some(ArtcraftBillingAction::SubscriptionPaid(SubscriptionPaidEvent {
      stripe_subscription_id: subscription_id,
      artcraft_subscription: product.clone(),
      stripe_customer_id: subscription.stripe_customer_id,
      stripe_product_id: subscription.stripe_product_id,
      stripe_price_id: subscription.stripe_price_id,
      owner_user_token: user_token,
      stripe_subscription_status: subscription.stripe_subscription_status,
      stripe_recurring_interval: subscription.subscription_interval,
      stripe_billing_cycle_anchor: subscription.stripe_billing_cycle_anchor,
      stripe_is_production: subscription.stripe_is_production,
      subscription_start_at: subscription.subscription_start_date,
      current_billing_period_start_at: subscription.current_billing_period_start,
      current_billing_period_end_at: subscription.current_billing_period_end,
      calculated_subscription_expires_at: subscription.current_billing_period_end, // TODO: This is incorrect. Use `calculate_subscription_end_date`.
      maybe_cancel_at: subscription.maybe_cancel_at,
      maybe_canceled_at: subscription.maybe_canceled_at,
      ledger_event_ref: Some(ledger_event_ref),
      customer_email: invoice.customer_email.clone(),
    })),
    webhook_event_log_summary: event_log_summary,
  })
}
