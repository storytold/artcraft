use crate::configs::credits_packs::get_artcraft_credits_pack_by_slug_and_env::get_artcraft_credits_pack_by_slug_and_env;
use crate::configs::stripe_artcraft_metadata_keys::{STRIPE_ARTCRAFT_METADATA_EMAIL, STRIPE_ARTCRAFT_METADATA_USERNAME, STRIPE_ARTCRAFT_METADATA_USER_TOKEN};
use crate::configs::subscriptions::get_artcraft_subscription_by_slug_and_env::get_artcraft_subscription_by_slug_and_env;
use crate::endpoints::webhook::common::stripe_artcraft_webhook_error::StripeArtcraftWebhookError;
use crate::utils::artcraft_stripe_config::ArtcraftStripeConfigWithClient;
use crate::utils::common_web_error::CommonWebError;
use actix_web::web::{Data, Json};
use actix_web::{web, HttpRequest};
use artcraft_api_defs::stripe_artcraft::create_credits_pack_checkout::{StripeArtcraftCreateCreditsPackCheckoutRequest, StripeArtcraftCreateCreditsPackCheckoutResponse};
use artcraft_api_defs::stripe_artcraft::create_subscription_checkout::{PlanBillingCadence, StripeArtcraftCreateSubscriptionCheckoutRequest, StripeArtcraftCreateSubscriptionCheckoutResponse};
use component_traits::traits::internal_user_lookup::InternalUserLookup;
use enums::common::payments_namespace::PaymentsNamespace;
use log::{error, info, warn};
use mysql_queries::queries::users::user_stripe_customer_links::find_user_stripe_customer_link::find_user_stripe_customer_link_using_connection;
use mysql_queries::queries::users::user_subscriptions::find_subscription_for_owner_user::find_subscription_for_owner_user_using_connection;
use reusable_types::server_environment::ServerEnvironment;
use sqlx::MySqlPool;
use std::collections::HashMap;
use std::str::FromStr;
use std::sync::Arc;
use stripe_checkout::checkout_session::{CreateCheckoutSession, CreateCheckoutSessionAutomaticTax, CreateCheckoutSessionCustomerCreation, CreateCheckoutSessionLineItems, CreateCheckoutSessionLineItemsAdjustableQuantity, CreateCheckoutSessionPaymentIntentData, CreateCheckoutSessionPaymentIntentDataSetupFutureUsage, CreateCheckoutSessionSavedPaymentMethodOptions, CreateCheckoutSessionSavedPaymentMethodOptionsAllowRedisplayFilters, CreateCheckoutSessionSavedPaymentMethodOptionsPaymentMethodSave, CreateCheckoutSessionSubscriptionData};
use stripe_checkout::CheckoutSessionMode;
use stripe_core::CustomerId;
use stripe_shared::CheckoutSessionCustomerCreation;
use user_traits_component::traits::internal_session_cache_purge::InternalSessionCachePurge;
//use utoipa::ToSchema;

// /// Create a Stripe Checkout session and return the redirect URL in Json.
// #[utoipa::path(
//   get,
//   tag = "Stripe (Artcraft)",
//   path = "/v1/stripe_artcraft/checkout/credits_pack",
//   params(
//     ("request" = CreateCheckoutSessionRequest, description = "Payload for Request"),
//   ),
//   responses(
//     (status = 200, description = "Success Delete", body = CreateCheckoutSessionSuccessResponse),
//   ),
// )]
pub async fn stripe_artcraft_create_credits_pack_checkout_handler(
  http_request: HttpRequest,
  request: Json<StripeArtcraftCreateCreditsPackCheckoutRequest>,
  stripe_config: Data<ArtcraftStripeConfigWithClient>,
  server_environment: Data<ServerEnvironment>,
  internal_user_lookup: Data<dyn InternalUserLookup>,
  internal_session_cache_purge: Data<dyn InternalSessionCachePurge>,
  mysql_pool: Data<MySqlPool>,
) -> Result<Json<StripeArtcraftCreateCreditsPackCheckoutResponse>, CommonWebError>
{
  let slug = match request.credits_pack {
    None => return Err(CommonWebError::BadInputWithSimpleMessage("no credits pack supplied".to_string())),
    Some(slug) => slug,
  };

  let credits_pack = get_artcraft_credits_pack_by_slug_and_env(slug, **server_environment);

  let mut mysql_connection = mysql_pool
      .acquire()
      .await
      .map_err(|err| {
        error!("Could not acquire mysql connection: {:?}", err);
        CommonWebError::ServerError
      })?;

  let maybe_user_metadata = internal_user_lookup
      .lookup_user_from_http_request_and_mysql_connection(&http_request, &mut mysql_connection)
      .await
      .map_err(|err| {
        error!("Error looking up user: {:?}", err);
        CommonWebError::ServerError // NB: This was probably *our* fault.
      })?;

  // NB: Our integration relies on an internal user token being present.
  let user_metadata = match maybe_user_metadata {
    None => return Err(CommonWebError::NotAuthorized),
    Some(user_metadata) => user_metadata,
  };

  // NB: Currently the stripe customer id field in the `users` table is only for FakeYou subscriptions,
  // so we need to look up any existing Artcraft subscription separately. This is needed to pre-fill
  // the Stripe billing form.
  let maybe_subscription = find_subscription_for_owner_user_using_connection(
    &user_metadata.user_token_typed,
    PaymentsNamespace::Artcraft,
    &mut mysql_connection
  ).await.map_err(|err| {
    error!("Error looking up user's ({}) existing subscription: {:?}", &user_metadata.user_token_typed, err);
    CommonWebError::ServerError // NB: This was probably *our* fault.
  })?;

  // NB: Prefer the user<->customer link on the subscription object.
  let mut maybe_existing_stripe_customer_id = maybe_subscription.as_ref()
      .map(|sub| sub.stripe_customer_id.as_str())
      .map(|customer_id|  CustomerId::from_str(customer_id).ok()) // NB: Infallible parse
      .flatten();

  if maybe_existing_stripe_customer_id.is_none() {
    let result = find_user_stripe_customer_link_using_connection(
      &user_metadata.user_token_typed,
      PaymentsNamespace::Artcraft,
      &mut mysql_connection
    ).await;

    // NB: Fail silently.
    if let Ok(Some(link)) = result {
      maybe_existing_stripe_customer_id = CustomerId::from_str(&link.stripe_customer_id).ok();
    } else if let Err(err) = result {
      warn!("Error looking up user's ({}) existing stripe customer link: {:?}", &user_metadata.user_token_typed, err);
    }
  }

  let success_url = stripe_config.checkout_success_url.clone();
  let cancel_url = stripe_config.checkout_cancel_url.clone();

  let checkout_session = {
    let mut metadata = HashMap::new();

    metadata.insert(STRIPE_ARTCRAFT_METADATA_USER_TOKEN.to_string(), user_metadata.user_token.to_string());

    if let Some(username) = user_metadata.username.as_deref() {
      metadata.insert(STRIPE_ARTCRAFT_METADATA_USERNAME.to_string(), username.to_string());
    }

    if let Some(user_email) = user_metadata.user_email.as_deref() {
      metadata.insert(STRIPE_ARTCRAFT_METADATA_EMAIL.to_string(), user_email.to_string());
    }

    let mut checkout_builder = CreateCheckoutSession::new()
        .success_url(&success_url)
        .cancel_url(&cancel_url)
        .mode(CheckoutSessionMode::Payment)
        .line_items(vec![
          CreateCheckoutSessionLineItems {
            price: Some(credits_pack.price_id.to_string()),
            quantity: Some(1),
            adjustable_quantity: Some(
              CreateCheckoutSessionLineItemsAdjustableQuantity {
                enabled: true,
                minimum: Some(1),
                maximum: Some(100),
              }
            ),
            ..Default::default()
          }
        ])
        .allow_promotion_codes(true)// Allow promo codes / coupons
        .automatic_tax(CreateCheckoutSessionAutomaticTax {
          enabled: true, // This will ask for the customer's location
          liability: None,
        })
        .metadata(metadata.clone())
        .payment_intent_data(CreateCheckoutSessionPaymentIntentData {
          metadata: Some(metadata),
          // Without an existing customer id or a customer_creation flag, this will wind up associated
          // with a "Guest" and be difficult to reuse.
          setup_future_usage: Some(CreateCheckoutSessionPaymentIntentDataSetupFutureUsage::OnSession),
          ..Default::default()
        });

    if let Some(customer_id) = maybe_existing_stripe_customer_id {
      info!("Adding existing stripe customer id to checkout session: {}", customer_id.as_str());
      checkout_builder = checkout_builder.customer(customer_id);

      // If we try to set this without a customer, the checkout session will blow up.
      // Stripe won't let us use `saved_payment_method_options` without an existing customer,
      // at least for one-off payments. Subscriptions allow this to be set in either case.
      checkout_builder = checkout_builder
          .saved_payment_method_options(CreateCheckoutSessionSavedPaymentMethodOptions {
            // The user can choose to tick a checkbox that saves their card for redisplay later.
            payment_method_save: Some(CreateCheckoutSessionSavedPaymentMethodOptionsPaymentMethodSave::Enabled),
            // Without any items, we do not get card redisplay.
            // All three values seems to enable redisplay.
            // I haven't tested individual enum values.
            // The user can choose to tick a checkbox that saves their card for redisplay later.
            allow_redisplay_filters: Some(vec![
              CreateCheckoutSessionSavedPaymentMethodOptionsAllowRedisplayFilters::Always,
              CreateCheckoutSessionSavedPaymentMethodOptionsAllowRedisplayFilters::Limited,
              CreateCheckoutSessionSavedPaymentMethodOptionsAllowRedisplayFilters::Unspecified,
            ])
          });
    } else {
      // If we don't have an existing customer_id, we want to create a new customer.
      // If we don't do that, the "customer" winds up as a "Guest" customer.
      // The only danger in forcefully creating a new customer is that we might create
      // duplicates (which Stripe won't merge) if we can't catch and consolidate across
      // all events.
      checkout_builder = checkout_builder
          .customer_creation(CreateCheckoutSessionCustomerCreation::Always);
    }

    let checkout_session = checkout_builder
        .send(&stripe_config.client)
        .await
        .map_err(|err| {
          error!("Stripe Error: {:?}", err);
          CommonWebError::ServerError
        })?;

    checkout_session
  };

  let url = checkout_session.url.ok_or(CommonWebError::ServerError)?;

  // Best effort to delete Redis session cache
  // internal_session_cache_purge.best_effort_purge_session_cache(&http_request);

  Ok(Json(StripeArtcraftCreateCreditsPackCheckoutResponse{
    success: true,
    stripe_checkout_redirect_url: url,
  }))
}
