use crate::configs::stripe_artcraft_metadata_keys::{STRIPE_ARTCRAFT_METADATA_EMAIL, STRIPE_ARTCRAFT_METADATA_USERNAME, STRIPE_ARTCRAFT_METADATA_USER_TOKEN};
use crate::configs::subscriptions::get_artcraft_subscription_by_slug_and_env::get_artcraft_subscription_by_slug_and_env;
use crate::endpoints::webhook::common::stripe_artcraft_webhook_error::StripeArtcraftWebhookError;
use crate::stripe_requests::stripe_lookup_subscription_from_subscription_id::stripe_lookup_subscription_from_subscription_id;
use crate::utils::artcraft_stripe_config::ArtcraftStripeConfigWithClient;
use crate::utils::common_web_error::CommonWebError;
use actix_web::web::{Data, Json};
use actix_web::{web, HttpRequest};
use artcraft_api_defs::stripe_artcraft::create_subscription_checkout::{PlanBillingCadence, StripeArtcraftCreateSubscriptionCheckoutRequest, StripeArtcraftCreateSubscriptionCheckoutResponse};
use artcraft_api_defs::stripe_artcraft::customer_portal_switch_plan::{PlanBillingCadenceConfirmation, StripeArtcraftCustomerPortalSwitchPlanRequest, StripeArtcraftCustomerPortalSwitchPlanResponse};
use component_traits::traits::internal_user_lookup::InternalUserLookup;
use enums::common::payments_namespace::PaymentsNamespace;
use log::{error, info, warn};
use mysql_queries::queries::users::user_subscriptions::find_subscription_for_owner_user::{find_subscription_for_owner_user_using_connection, UserSubscription};
use reusable_types::server_environment::ServerEnvironment;
use sqlx::MySqlPool;
use std::collections::HashMap;
use std::str::FromStr;
use std::sync::Arc;
use stripe_billing::billing_portal_session::{CreateBillingPortalSession, CreateBillingPortalSessionFlowData, CreateBillingPortalSessionFlowDataAfterCompletion, CreateBillingPortalSessionFlowDataAfterCompletionRedirect, CreateBillingPortalSessionFlowDataAfterCompletionType, CreateBillingPortalSessionFlowDataSubscriptionCancel, CreateBillingPortalSessionFlowDataSubscriptionCancelRetention, CreateBillingPortalSessionFlowDataSubscriptionCancelRetentionCouponOffer, CreateBillingPortalSessionFlowDataSubscriptionCancelRetentionType, CreateBillingPortalSessionFlowDataSubscriptionUpdate, CreateBillingPortalSessionFlowDataSubscriptionUpdateConfirm, CreateBillingPortalSessionFlowDataSubscriptionUpdateConfirmItems, CreateBillingPortalSessionFlowDataType};
use stripe_billing::BillingPortalSession;
use stripe_checkout::checkout_session::{CreateCheckoutSession, CreateCheckoutSessionAutomaticTax, CreateCheckoutSessionLineItems, CreateCheckoutSessionSubscriptionData};
use stripe_checkout::CheckoutSessionMode;
use stripe_core::CustomerId;
use tokens::tokens::users::UserToken;
use user_traits_component::traits::internal_session_cache_purge::InternalSessionCachePurge;

pub async fn stripe_artcraft_customer_portal_switch_plan_handler(
  http_request: HttpRequest,
  request: Json<StripeArtcraftCustomerPortalSwitchPlanRequest>,
  stripe_config: Data<ArtcraftStripeConfigWithClient>,
  server_environment: Data<ServerEnvironment>,
  internal_user_lookup: Data<dyn InternalUserLookup>,
  mysql_pool: Data<MySqlPool>,
) -> Result<Json<StripeArtcraftCustomerPortalSwitchPlanResponse>, CommonWebError>
{
  let mut mysql_connection = mysql_pool
      .acquire()
      .await
      .map_err(|err| {
        error!("Could not acquire mysql connection: {:?}", err);
        CommonWebError::ServerError
      })?;

  let maybe_user_metadata = internal_user_lookup
      .lookup_user_from_http_request(&http_request)
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

  let user_token = UserToken::new_from_str(&user_metadata.user_token);

  let result = find_subscription_for_owner_user_using_connection(
    &user_token,
    PaymentsNamespace::Artcraft,
    &mut mysql_connection
  ).await;

  let subscription = match result {
    Err(err) => {
      error!("Error looking up user's ({}) existing subscription: {:?}", &user_metadata.user_token, err);
      return Err(CommonWebError::ServerError); // NB: This was probably *our* fault.
    }
    Ok(None) => {
      return Err(CommonWebError::BadInputWithSimpleMessage("user has no active subscription".to_string()))
    }
    Ok(Some(subscription)) => subscription,
  };

  // TODO: Set the configuration id.

  let flow_data = update_confirm(
    &request,
    &subscription,
    &stripe_config,
    **server_environment,
  ).await?;

  let mut portal_builder = CreateBillingPortalSession::new(subscription.stripe_customer_id.clone())
      .return_url(stripe_config.portal_return_url.clone()) // TODO: This can be a different URL.
      .flow_data(flow_data);

  let portal_session = portal_builder
      .send(&stripe_config.client)
      .await
      .map_err(|err| {
        error!("Stripe Error: {:?}", err);
        CommonWebError::ServerError
      })?;

  Ok(Json(StripeArtcraftCustomerPortalSwitchPlanResponse {
    success: true,
    stripe_portal_url: portal_session.url,
  }))
}

async fn update_confirm(
  request: &StripeArtcraftCustomerPortalSwitchPlanRequest,
  user_subscription: &UserSubscription,
  stripe_config: &ArtcraftStripeConfigWithClient,
  server_environment: ServerEnvironment,
) -> Result<CreateBillingPortalSessionFlowData, CommonWebError>
{
  let slug = match request.plan {
    None => return Err(CommonWebError::BadInputWithSimpleMessage("no plan supplied".to_string())),
    Some(slug) => slug,
  };

  let cadence = match request.cadence {
    None => return Err(CommonWebError::BadInputWithSimpleMessage("no cadence supplied".to_string())),
    Some(cadence) => cadence,
  };

  let new_plan = get_artcraft_subscription_by_slug_and_env(slug, server_environment);

  let new_price_id = match cadence {
    PlanBillingCadenceConfirmation::Monthly => new_plan.monthly_price_id.clone(),
    PlanBillingCadenceConfirmation::Yearly => new_plan.yearly_price_id.clone(),
  };

  let existing_subscription_id = user_subscription.stripe_subscription_id.clone();
  let existing_product_id = user_subscription.stripe_product_id.clone();

  let existing_subscription = stripe_lookup_subscription_from_subscription_id(
    &existing_subscription_id,
    &stripe_config.client
  ).await.map_err(|err| {
    error!("Error looking up existing subscription {} for user {}: {:?}",
      &existing_subscription_id,
      &user_subscription.user_token,
      err
    );
    CommonWebError::ServerError
  })?;

  info!("Switching user {} (stripe customer {}) with existing subscription {} and product {} to new plan {} with price ID {}",
    &user_subscription.user_token,
    &user_subscription.stripe_customer_id,
    &existing_subscription_id,
    &existing_product_id,
    &slug,
    &new_price_id,
  );

  Ok(CreateBillingPortalSessionFlowData {
    type_: CreateBillingPortalSessionFlowDataType::SubscriptionUpdateConfirm,
    subscription_update_confirm: Some(
      CreateBillingPortalSessionFlowDataSubscriptionUpdateConfirm {
        subscription: existing_subscription_id,
        items: vec![CreateBillingPortalSessionFlowDataSubscriptionUpdateConfirmItems {
          id: existing_subscription.stripe_subscription_item_id.clone(),
          price: Some(new_price_id.to_string()),
          quantity: Some(1),
        }],
        discounts: None,
      }
    ),
    after_completion: Some(CreateBillingPortalSessionFlowDataAfterCompletion {
      type_: CreateBillingPortalSessionFlowDataAfterCompletionType::Redirect,
      redirect: Some(CreateBillingPortalSessionFlowDataAfterCompletionRedirect {
        return_url: stripe_config.portal_return_url.clone(), // TODO: This can be a different URL.
      }),
      hosted_confirmation: None,
    }),
    subscription_cancel: None,
    subscription_update: None,
  })
}
