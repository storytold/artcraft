use crate::configs::stripe_artcraft_metadata_keys::{STRIPE_ARTCRAFT_METADATA_EMAIL, STRIPE_ARTCRAFT_METADATA_USERNAME, STRIPE_ARTCRAFT_METADATA_USER_TOKEN};
use crate::endpoints::checkout_with_user_signup::creation_payload::CreationPayload;
use crate::utils::artcraft_stripe_config::ArtcraftStripeConfigWithClient;
use crate::utils::common_web_error::CommonWebError;
use crate::utils::create_checkout::create_subscription_checkout_session::{create_subscription_checkout_session, CreateSubscriptionCheckoutSessionArgs};
use actix_web::web::Data;
use component_traits::traits::internal_user_lookup::UserMetadata;
use enums_db::common::payments_namespace::PaymentsNamespace;
use log::{error, info, warn};
use mysql_queries::queries::users::user_stripe_customer_links::find_user_stripe_customer_link::find_user_stripe_customer_link_using_connection;
use mysql_queries::queries::users::user_subscriptions::find_subscription_for_owner_user::find_subscription_for_owner_user_using_connection;
use sqlx::pool::PoolConnection;
use sqlx::MySql;
use std::collections::HashMap;
use std::str::FromStr;
use stripe_checkout::checkout_session::{CreateCheckoutSession, CreateCheckoutSessionAutomaticTax, CreateCheckoutSessionLineItems, CreateCheckoutSessionSavedPaymentMethodOptions, CreateCheckoutSessionSavedPaymentMethodOptionsAllowRedisplayFilters, CreateCheckoutSessionSavedPaymentMethodOptionsPaymentMethodSave, CreateCheckoutSessionSubscriptionData};
use stripe_shared::{CheckoutSession, CheckoutSessionMode, CustomerId, PriceId};

pub (super) async fn user_exists_case(
  price_id: &PriceId,
  user_metadata: &UserMetadata,
  mysql_connection: &mut PoolConnection<MySql>,
  stripe_config: &ArtcraftStripeConfigWithClient,
) -> Result<CreationPayload, CommonWebError> {

  // NB: Currently the stripe customer id field in the `users` table is only for FakeYou subscriptions,
  // so we need to look up any existing Artcraft subscription separately. This is needed to pre-fill
  // the Stripe billing form.
  let maybe_active_subscription = find_subscription_for_owner_user_using_connection(
    &user_metadata.user_token_typed,
    PaymentsNamespace::Artcraft,
    mysql_connection
  ).await.map_err(|err| {
    error!("Error looking up user's ({}) existing subscription: {:?}", &user_metadata.user_token_typed, err);
    CommonWebError::ServerError // NB: This was probably *our* fault.
  })?;

  if maybe_active_subscription.is_some() {
    return Err(CommonWebError::BadInputWithSimpleMessage(
      "user already has an active subscription plan; use the portal to update the plan"
          .to_string()))
  }

  // NB: This works, but it feels really weird to have the customer's old email shown in a
  //     completely immutable state in the stripe checkout form.
  //
  // let maybe_inactive_subscription = find_possibly_inactive_first_subscription_for_owner_user_using_connection(
  //   &user_metadata.user_token_typed,
  //   PaymentsNamespace::Artcraft,
  //   &mut mysql_connection
  // ).await.map_err(|err| {
  //   error!("Error looking up user's ({}) possibly existing inactive subscription: {:?}",
  //     &user_metadata.user_token_typed, err);
  //   CommonWebError::ServerError // NB: This was probably *our* fault.
  // })?;
  // let maybe_existing_inactive_stripe_customer_id = maybe_inactive_subscription.as_ref()
  //     .map(|sub| sub.stripe_customer_id.as_str());

  let mut maybe_existing_stripe_customer_id = None;

  let result = find_user_stripe_customer_link_using_connection(
    &user_metadata.user_token_typed,
    PaymentsNamespace::Artcraft,
    mysql_connection
  ).await;

  // NB: Fail silently.
  if let Ok(Some(link)) = result {
    maybe_existing_stripe_customer_id = CustomerId::from_str(&link.stripe_customer_id).ok();
  } else if let Err(err) = result {
    warn!("Error looking up user's ({}) existing stripe customer link: {:?}", &user_metadata.user_token_typed, err);
  }

  let checkout_session = create_subscription_checkout_session(CreateSubscriptionCheckoutSessionArgs {
    subscription_price_id: price_id,
    maybe_existing_stripe_customer_id: maybe_existing_stripe_customer_id.as_ref(),
    user_token: &user_metadata.user_token_typed,
    username: user_metadata.username.as_deref(),
    user_email: user_metadata.user_email.as_deref(),
    stripe_client: &stripe_config.client,
    success_url: &stripe_config.checkout_success_url,
    cancel_url: &stripe_config.checkout_cancel_url,
  }).await?;

  Ok(CreationPayload {
    checkout_session,
    maybe_new_user_metadata: None,
  })
}
