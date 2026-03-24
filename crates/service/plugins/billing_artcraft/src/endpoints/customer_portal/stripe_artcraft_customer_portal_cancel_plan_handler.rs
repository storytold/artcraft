use crate::configs::stripe_artcraft_metadata_keys::{STRIPE_ARTCRAFT_METADATA_EMAIL, STRIPE_ARTCRAFT_METADATA_USERNAME, STRIPE_ARTCRAFT_METADATA_USER_TOKEN};
use crate::configs::subscriptions::get_artcraft_subscription_by_slug_and_env::get_artcraft_subscription_by_slug_and_env;
use crate::endpoints::webhook::common::stripe_artcraft_webhook_error::StripeArtcraftWebhookError;
use crate::utils::artcraft_stripe_config::ArtcraftStripeConfigWithClient;
use crate::utils::common_web_error::CommonWebError;
use actix_web::web::{Data, Json};
use actix_web::{web, HttpRequest};
use artcraft_api_defs::stripe_artcraft::create_subscription_checkout::{PlanBillingCadence, StripeArtcraftCreateSubscriptionCheckoutRequest, StripeArtcraftCreateSubscriptionCheckoutResponse};
use artcraft_api_defs::stripe_artcraft::customer_portal_cancel_plan::{StripeArtcraftCustomerPortalCancelPlanRequest, StripeArtcraftCustomerPortalCancelPlanResponse};
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

pub async fn stripe_artcraft_customer_portal_cancel_plan_handler(
  http_request: HttpRequest,
  request: Json<StripeArtcraftCustomerPortalCancelPlanRequest>,
  stripe_config: Data<ArtcraftStripeConfigWithClient>,
  server_environment: Data<ServerEnvironment>,
  internal_user_lookup: Data<dyn InternalUserLookup>,
  mysql_pool: Data<MySqlPool>,
) -> Result<Json<StripeArtcraftCustomerPortalCancelPlanResponse>, CommonWebError>
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

  let portal_builder = CreateBillingPortalSession::new(subscription.stripe_customer_id.clone())
      .return_url(stripe_config.portal_return_url.clone()) // TODO: This can be a different URL.
      .flow_data(CreateBillingPortalSessionFlowData { 
        type_: CreateBillingPortalSessionFlowDataType::SubscriptionCancel,
        subscription_cancel: Some(
          CreateBillingPortalSessionFlowDataSubscriptionCancel {
            retention: None,
            subscription: subscription.stripe_subscription_id.clone(),
          }
        ),
        after_completion: Some(CreateBillingPortalSessionFlowDataAfterCompletion {
          type_: CreateBillingPortalSessionFlowDataAfterCompletionType::Redirect,
          redirect: Some(CreateBillingPortalSessionFlowDataAfterCompletionRedirect {
            return_url: stripe_config.portal_return_url.clone(), // TODO: This can be a different URL.
          }),
          hosted_confirmation: None,
        }),
        subscription_update: None,
        subscription_update_confirm: None,
      });

  let portal_session = portal_builder
      .send(&stripe_config.client)
      .await
      .map_err(|err| {
        error!("Stripe Error: {:?}", err);
        CommonWebError::ServerError
      })?;

  Ok(Json(StripeArtcraftCustomerPortalCancelPlanResponse {
    success: true,
    stripe_portal_url: portal_session.url,
  }))
}
