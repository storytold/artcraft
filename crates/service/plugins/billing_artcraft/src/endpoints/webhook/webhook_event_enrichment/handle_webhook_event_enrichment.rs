use crate::endpoints::webhook::common::enriched_webhook_event::EnrichedWebhookEvent;
use crate::endpoints::webhook::common::stripe_artcraft_webhook_error::StripeArtcraftWebhookError;
use crate::endpoints::webhook::common::webhook_event_log_summary::WebhookEventLogSummary;
use crate::endpoints::webhook::webhook_event_enrichment::customer_subscription::customer_subscription_created_extractor::customer_subscription_created_extractor;
use crate::endpoints::webhook::webhook_event_enrichment::customer_subscription::customer_subscription_deleted_extractor::customer_subscription_deleted_extractor;
use crate::endpoints::webhook::webhook_event_enrichment::customer_subscription::customer_subscription_updated_extractor::customer_subscription_updated_extractor;
use crate::endpoints::webhook::webhook_event_enrichment::ignore_known_unwanted_events::ignore_known_unwanted_events;
use crate::endpoints::webhook::webhook_event_enrichment::invoice::invoice_paid_extractor::invoice_paid_extractor;
use crate::endpoints::webhook::webhook_event_enrichment::invoice::invoice_payment_failed_extractor::invoice_payment_failed_extractor;
use crate::endpoints::webhook::webhook_event_enrichment::payment_intent::payment_intent_succeeded_extractor::payment_intent_succeeded_extractor;
use crate::utils::stripe_event_descriptor::StripeEventDescriptor;
use log::{info, warn};
use server_environment::ServerEnvironment;
use sqlx::pool::PoolConnection;
use sqlx::{MySql, Transaction};
use stripe::Client;
use stripe_webhook::{Event, EventObject};

pub async fn handle_webhook_event_enrichment(
  stripe_event_descriptor: &StripeEventDescriptor,
  stripe_client: &Client,
  server_environment: ServerEnvironment,
  webhook_payload: Event,
) -> Result<EnrichedWebhookEvent, StripeArtcraftWebhookError> {

  if let Some(summary) = ignore_known_unwanted_events(&webhook_payload) {
    return Ok(EnrichedWebhookEvent {
      maybe_billing_action: None,
      webhook_event_log_summary: summary,
    });
  }

  let mut unhandled_event_type = false;

  let mut webhook_summary = WebhookEventLogSummary {
    maybe_user_token: None,
    maybe_event_entity_id: None,
    maybe_stripe_customer_id: None,
    action_was_taken: false,
    should_ignore_retry: false,
  };

  match webhook_payload.data.object {

    // =============== PAYMENT INTENTS ===============

    EventObject::PaymentIntentSucceeded(payment_intent) => {
      // `payment_intent.succeeded` is responsible for enabling one-off payments (eg. credits packs).
      // We'll ignore any payment intents from subscription invoices and let other event handlers
      // fulfill subscription states.
      info!("Event {}, data: {:?}", stripe_event_descriptor, payment_intent);

      return payment_intent_succeeded_extractor(
        &payment_intent,
        server_environment,
        stripe_client,
      ).await;
    }

    // =============== INVOICES ===============

    EventObject::InvoicePaid(invoice) => {
      // Invoices are for subscriptions, not one-off charges and purchases.
      // This is the *required* event that enables the subscription!
      // These are fired on an interval - whatever the billing cadence is.
      info!("Event: {}, data: {:?}", stripe_event_descriptor, invoice);

      return invoice_paid_extractor(
        &stripe_event_descriptor,
        &invoice,
        server_environment,
        stripe_client
      ).await;
    }

    EventObject::InvoicePaymentFailed(_invoice) => {
      // TODO: Halt service.
      //  When we detect invoice payment failures, we need to disable subscription services.
      // info!("Event: {:?}, data: {:?}", stripe_event_descriptor, invoice);
    }

    EventObject::InvoiceCreated(_invoice) => {
      // TODO: We need to respond to this so we don't hold payments up by 72 hours!
      //  See: https://stripe.com/docs/billing/subscriptions/webhooks
    }

    // =============== CUSTOMER SUBSCRIPTIONS ===============

    EventObject::CustomerSubscriptionCreated(subscription) => {
      // DO NOT USE TO PROVISION SERVICE.
      //
      // Sent when the subscription is created. The subscription status may be incomplete if customer
      // authentication is required to complete the payment or if you set payment_behavior to
      // default_incomplete. For more details, read about subscription payment behavior.
      ///
      // This can be used to upsert the subscription record, but may be `incomplete` and unpaid.
      // This is good for the overall subscription state, renewal dates, etc.
      //
      info!("Event: {}, data: {:?}", stripe_event_descriptor, subscription);
      return customer_subscription_created_extractor(
        &subscription,
        server_environment,
      ).await;
    }

    EventObject::CustomerSubscriptionUpdated(subscription) => {
      info!("Event: {}, data: {:?}", stripe_event_descriptor, subscription);
      return customer_subscription_updated_extractor(
        &subscription,
        server_environment,
      ).await;
    }

    EventObject::CustomerSubscriptionDeleted(subscription) => {
      info!("Event: {}, data: {:?}", stripe_event_descriptor, subscription);
      return customer_subscription_deleted_extractor(
        &subscription,
        server_environment,
      ).await;
    }

    // =============== Ignored ===============

    _ => {
      unhandled_event_type = true;
    },
  }

  // To play with the payload contents as JSON:
  // let json = serde_json::ser::to_string(&event_payload).unwrap();
  // info!("event payload as json: {}", json);

  if unhandled_event_type {
    warn!("Unhandled Stripe webhook event : {}", &stripe_event_descriptor);
  }

  Ok(EnrichedWebhookEvent {
    maybe_billing_action: None,
    webhook_event_log_summary: webhook_summary,
  })
}
