use std::fmt;
use std::sync::Arc;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::common_responses::media::media_links_builder::MediaLinksBuilder;
use crate::state::server_state::ServerState;
use actix_web::web::{Json, Path};
use actix_web::{web, HttpMessage, HttpRequest, HttpResponse};
use artcraft_api_defs::credits::get_session_credits::GetSessionCreditsResponse;
use artcraft_api_defs::subscriptions::get_session_subscription::{GetSessionSubscriptionResponse, SubscriptionInfo};
use chrono::{DateTime, Utc};
use enums::common::payments_namespace::PaymentsNamespace;
use log::{error, warn};
use mysql_queries::queries::users::user_subscriptions::find_subscription_for_owner_user::find_subscription_for_owner_user_using_connection;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::prompts::PromptToken;
use utoipa::ToSchema;

/// For the URL PathInfo
#[derive(Deserialize, ToSchema)]
pub struct GetSessionSubscriptionPathInfo {
  namespace: PaymentsNamespace,
}

/// Get subscription for the payment namespace.
///
/// Use this instead of the older endpoints,
///
///  - GET /v1/billing/active_subscription (legacy, for FakeYou)
///  - GET /v1/app_state (quite a lot of FakeYou state)
///
#[utoipa::path(
  get,
  tag = "Subscriptions",
  path = "/v1/subscriptions/namespace/{namespace}",
  responses(
    (status = 200, description = "Success", body = GetSessionSubscriptionResponse),
  ),
  params(
    ("path" = GetSessionSubscriptionPathInfo, description = "Path for Request")
  )
)]
pub async fn get_session_subscription_handler(
  http_request: HttpRequest,
  path: Path<GetSessionSubscriptionPathInfo>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<Json<GetSessionSubscriptionResponse>, CommonWebError>
{
  let mut mysql_connection = server_state.mysql_pool
      .acquire()
      .await
      .map_err(|err| {
        error!("Error acquiring MySQL connection: {:?}", err);
        CommonWebError::from_error(err)
      })?;

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session_from_connection(&http_request, &mut mysql_connection)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        CommonWebError::from_error(e)
      })?;

  let user_token = match maybe_user_session {
    Some(session) => session.user_token,
    None => return Err(CommonWebError::NotAuthorized),
  };

  let maybe_subscription = find_subscription_for_owner_user_using_connection(
    &user_token,
    path.namespace,
    &mut mysql_connection
  ).await.map_err(|err| {
    error!("Error looking up user's ({}) existing subscription: {:?}", &user_token, err);
    CommonWebError::from_error(err) // NB: This was probably *our* fault.
  })?;

  Ok(Json(GetSessionSubscriptionResponse {
    success: true,
    active_subscription: maybe_subscription.map(|sub| {
      let mut next_bill_date = None;
      let mut subscription_end_date = None;

      // cancel_at > canceled_at - [normal] subscription was terminated and expires (after the canceled_at date, perhaps in the future)
      // cancel_at < canceled_at - [???] - ???

      match (sub.maybe_cancel_at, sub.maybe_canceled_at) {
        (Some(cancel_at), Some(canceled_at)) => {
          // NB: `canceled_at` is when the user canceled the subscription, not necessarily when it expires.
          // TODO: Not sure this is the correct logic.
          subscription_end_date = Some(cancel_at);
        },
        (Some(cancel_at), None) => {
          // Canceling at end of period.
          subscription_end_date = Some(cancel_at);
        },
        (None, Some(canceled_at)) => {
          // Canceled already.
          subscription_end_date = Some(canceled_at);
        },
        (None, None) => {
          // Active subscription.
          next_bill_date = Some(sub.current_billing_period_end_at);
        },
      }

      //if sub.maybe_cancel_at.is_none() && sub.maybe_canceled_at.is_none() {
      //  next_bill_date = Some(sub.current_billing_period_end_at);
      //}

      SubscriptionInfo {
        namespace: sub.subscription_namespace,
        product_slug: sub.subscription_product_slug,
        subscription_token: sub.token,
        next_bill_at: next_bill_date,
        subscription_end_at: subscription_end_date,
      }
    }),
  }))
}
