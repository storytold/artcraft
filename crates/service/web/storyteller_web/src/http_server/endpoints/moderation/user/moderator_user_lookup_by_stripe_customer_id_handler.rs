use std::sync::Arc;

use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::moderation::user::user_lookup_by_stripe_customer_id::{
  ModeratorUserLookupByStripeCustomerIdEntry,
  ModeratorUserLookupByStripeCustomerIdRequest,
  ModeratorUserLookupByStripeCustomerIdResponse,
};
use mysql_queries::queries::users::user_subscriptions::lookup_users_by_stripe_customer_id::lookup_users_by_stripe_customer_id;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::web_utils::user_session::require_moderator::{require_moderator, UseDatabase};
use crate::state::server_state::ServerState;

/// Moderator User Lookup by Stripe Customer ID
#[utoipa::path(
  post,
  tag = "Moderation",
  path = "/v1/moderation/users/lookup_by_stripe_customer_id",
  request_body = ModeratorUserLookupByStripeCustomerIdRequest,
  responses(
    (status = 200, description = "Success", body = ModeratorUserLookupByStripeCustomerIdResponse),
    (status = 401, description = "Unauthorized"),
    (status = 500, description = "Server error"),
  ),
)]
pub async fn moderator_user_lookup_by_stripe_customer_id_handler(
  http_request: HttpRequest,
  request: Json<ModeratorUserLookupByStripeCustomerIdRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<ModeratorUserLookupByStripeCustomerIdResponse>, CommonWebError> {

  let _user_session = require_moderator(&http_request, &server_state, UseDatabase::GrabNewConnection)
    .await
    .map_err(|_| CommonWebError::NotAuthorized)?;

  let stripe_customer_id = request.stripe_customer_id.trim();

  if stripe_customer_id.is_empty() {
    return Ok(Json(ModeratorUserLookupByStripeCustomerIdResponse {
      success: true,
      users: vec![],
    }));
  }

  let results = lookup_users_by_stripe_customer_id(stripe_customer_id, &server_state.mysql_pool)
    .await
    .map_err(|err| {
      warn!("moderator_user_lookup_by_stripe_customer_id error: {:?}", err);
      CommonWebError::ServerError
    })?;

  let users = results.into_iter().map(|row| ModeratorUserLookupByStripeCustomerIdEntry {
    subscription_namespace: row.subscription_namespace,
    maybe_stripe_subscription_id: row.maybe_stripe_subscription_id,
    token: row.user_token,
    email_address: row.email_address,
    username: row.username,
    display_name: row.display_name,
  }).collect();

  Ok(Json(ModeratorUserLookupByStripeCustomerIdResponse {
    success: true,
    users,
  }))
}
