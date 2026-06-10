use std::sync::Arc;

use actix_web::web::{Json, Path};
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::moderation::user_stripe_data::moderator_get_user_stripe_customer_ids::{
  ModeratorGetUserStripeCustomerIdsPathInfo,
  ModeratorGetUserStripeCustomerIdsResponse,
  ModeratorStripeCustomerIdSource,
  ModeratorUserStripeCustomerIdEntry,
};
use mysql_queries::queries::users::user_stripe_customer_links::list_user_stripe_customer_links_for_user::list_user_stripe_customer_links_for_user;
use enums::common::payments_namespace::PaymentsNamespace;
use mysql_queries::queries::users::user_subscriptions::list_stripe_customer_ids_for_user_subscriptions::list_stripe_customer_ids_for_user_subscriptions;
use tokens::tokens::users::UserToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::web_utils::user_session::require_moderator::{require_moderator, UseDatabase};
use crate::state::server_state::ServerState;

/// Get all stripe customer ids on file for a user (moderation)
#[utoipa::path(
  get,
  tag = "Moderation",
  path = "/v1/moderation/user_stripe_data/{user_token}/customer_ids",
  responses(
    (status = 200, description = "Success", body = ModeratorGetUserStripeCustomerIdsResponse),
    (status = 401, description = "Unauthorized"),
    (status = 500, description = "Server error"),
  ),
  params(
    ("user_token" = UserToken, Path, description = "User token to look up"),
  )
)]
pub async fn moderator_get_user_stripe_customer_ids_handler(
  http_request: HttpRequest,
  path: Path<ModeratorGetUserStripeCustomerIdsPathInfo>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<ModeratorGetUserStripeCustomerIdsResponse>, CommonWebError> {

  let mut mysql_connection = server_state.mysql_pool
      .acquire()
      .await?;

  let _moderator_session = require_moderator(
    &http_request,
    &server_state,
    UseDatabase::FromPool(&mut mysql_connection),
  )
      .await
      .map_err(|_| CommonWebError::NotAuthorized)?;

  let customer_links = list_user_stripe_customer_links_for_user(&path.user_token, &mut mysql_connection)
      .await
      .map_err(|err| {
        warn!("moderator_get_user_stripe_customer_ids customer link query error: {:?}", err);
        CommonWebError::from_error(err)
      })?;

  let subscription_customer_ids = list_stripe_customer_ids_for_user_subscriptions(&path.user_token, &mut mysql_connection)
      .await
      .map_err(|err| {
        warn!("moderator_get_user_stripe_customer_ids subscription query error: {:?}", err);
        CommonWebError::from_error(err)
      })?;

  let mut customer_ids = Vec::with_capacity(customer_links.len() + subscription_customer_ids.len());

  customer_ids.extend(customer_links.into_iter().map(|link| ModeratorUserStripeCustomerIdEntry {
    stripe_dashboard_url: stripe_dashboard_customer_url(&server_state, link.payments_namespace, &link.stripe_customer_id),
    stripe_customer_id: link.stripe_customer_id,
    payments_namespace: link.payments_namespace,
    source: ModeratorStripeCustomerIdSource::CustomerLink,
  }));

  customer_ids.extend(subscription_customer_ids.into_iter().map(|subscription| ModeratorUserStripeCustomerIdEntry {
    stripe_dashboard_url: stripe_dashboard_customer_url(&server_state, subscription.subscription_namespace, &subscription.stripe_customer_id),
    stripe_customer_id: subscription.stripe_customer_id,
    payments_namespace: subscription.subscription_namespace,
    source: ModeratorStripeCustomerIdSource::Subscription,
  }));

  Ok(Json(ModeratorGetUserStripeCustomerIdsResponse {
    success: true,
    customer_ids,
  }))
}

/// Each payments namespace bills through a different Stripe account.
fn stripe_dashboard_customer_url(
  server_state: &ServerState,
  payments_namespace: PaymentsNamespace,
  stripe_customer_id: &str,
) -> String {
  let stripe_account_id = match payments_namespace {
    PaymentsNamespace::Artcraft => &server_state.stripe_artcraft.stripe_account_id,
    PaymentsNamespace::FakeYou => &server_state.stripe.stripe_account_id,
  };
  format!("https://dashboard.stripe.com/{}/customers/{}", stripe_account_id, stripe_customer_id)
}
