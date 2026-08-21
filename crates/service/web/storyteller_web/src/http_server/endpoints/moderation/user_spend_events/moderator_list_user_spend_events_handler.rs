use std::marker::PhantomData;
use std::sync::Arc;

use actix_web::web::{Json, Query};
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::moderation::user_spend_events::list::{
  ModeratorListUserSpendEventsQueryParams, ModeratorListUserSpendEventsResponse, UserSpendEventListEntry,
};
use mysql_queries::queries::user_spend_events::list_user_spend_events_for_moderation::{
  list_user_spend_events_for_moderation, ListUserSpendEventsForModerationArgs,
};

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::user_lookup::user_session::require_moderator::require_moderator;
use crate::state::server_state::ServerState;

const PAGE_SIZE: i64 = 200;

/// List spend events, most recent payment date first, with the spender's display info.
/// Moderators only.
#[utoipa::path(
  get,
  tag = "Moderation",
  path = "/v1/moderation/user_spend_events/list",
  params(
    ModeratorListUserSpendEventsQueryParams,
  ),
  responses(
    (status = 200, description = "Success", body = ModeratorListUserSpendEventsResponse),
    (status = 401, description = "Unauthorized"),
    (status = 500, description = "Server error"),
  ),
)]
pub async fn moderator_list_user_spend_events_handler(
  http_request: HttpRequest,
  query: Query<ModeratorListUserSpendEventsQueryParams>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<ModeratorListUserSpendEventsResponse>, CommonWebError> {
  let _user_session = require_moderator(&http_request, &server_state.session_checker, &server_state.mysql_pool).await?;

  let offset = query.offset.unwrap_or(0);

  let rows = list_user_spend_events_for_moderation(ListUserSpendEventsForModerationArgs {
    maybe_payments_namespace: query.payments_namespace.as_deref(),
    limit: PAGE_SIZE,
    offset: offset.min(i64::MAX as u64) as i64,
    mysql_executor: &server_state.mysql_pool,
    phantom: PhantomData,
  })
  .await
  .map_err(|err| {
    warn!("Failed to list user spend events: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let maybe_next_offset = if rows.len() as i64 == PAGE_SIZE {
    Some(offset + PAGE_SIZE as u64)
  } else {
    None
  };

  let events = rows
    .into_iter()
    .map(|r| UserSpendEventListEntry {
      token: r.token,
      payments_namespace: r.payments_namespace,
      maybe_user_token: r.maybe_user_token,
      maybe_username: r.maybe_username,
      maybe_display_name: r.maybe_display_name,
      maybe_email_gravatar_hash: r.maybe_email_gravatar_hash,
      event_type: r.event_type,
      amount_usd_cents: r.amount_usd_cents,
      maybe_credits_granted: r.maybe_credits_granted,
      payment_source: r.payment_source,
      maybe_source_object_id: r.maybe_source_object_id,
      maybe_stripe_invoice_id: r.maybe_stripe_invoice_id,
      maybe_stripe_payment_intent_id: r.maybe_stripe_payment_intent_id,
      maybe_stripe_charge_id: r.maybe_stripe_charge_id,
      maybe_stripe_customer_id: r.maybe_stripe_customer_id,
      is_production: r.is_production,
      payment_occurred_at: r.payment_occurred_at,
      created_at: r.created_at,
    })
    .collect();

  Ok(Json(ModeratorListUserSpendEventsResponse {
    success: true,
    events,
    maybe_next_offset,
  }))
}
