use crate::billing_action_fulfillment::artcraft_billing_action::ArtcraftBillingAction;
use crate::endpoints::webhook::common::enriched_webhook_event::EnrichedWebhookEvent;
use crate::endpoints::webhook::common::stripe_artcraft_webhook_error::StripeArtcraftWebhookError;
use crate::endpoints::webhook::webhook_event_enrichment::customer_subscription::common::extract_common_subscription_details::extract_common_subscription_details;
use server_environment::ServerEnvironment;
use stripe_shared::Subscription;

/// Handle event type: 'customer.subscription.created'
/// Sent when the subscription is created. The subscription status may be incomplete if customer
/// authentication is required to complete the payment or if you set payment_behavior to
/// default_incomplete. For more details, read about subscription payment behavior.
pub async fn customer_subscription_created_extractor(
  subscription: &Subscription,
  server_environment: ServerEnvironment,
) -> Result<EnrichedWebhookEvent, StripeArtcraftWebhookError> {

  let summary = extract_common_subscription_details(subscription, server_environment)?;

  Ok(EnrichedWebhookEvent {
    maybe_billing_action: Some(ArtcraftBillingAction::SubscriptionCreated(summary.subscription_details)),
    webhook_event_log_summary: summary.event_log_summary,
  })
}
