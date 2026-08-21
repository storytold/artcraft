use std::marker::PhantomData;
use std::sync::Arc;

use actix_web::web::{Json, Query};
use actix_web::{web, HttpRequest};
use chrono::{Duration, Utc};
use log::warn;

use artcraft_api_defs::moderation::top_spenders::list::{
  ModeratorListTopSpendersQueryParams, ModeratorListTopSpendersResponse, TopSpenderEntry, TopSpendersWindow,
};
use mysql_queries::queries::user_spend_events::list_top_spenders_for_window::{
  list_top_spenders_for_window, ListTopSpendersForWindowArgs,
};

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::user_lookup::user_session::require_moderator::require_moderator;
use crate::state::server_state::ServerState;

const PAGE_SIZE: i64 = 100;

const DEFAULT_WINDOW: TopSpendersWindow = TopSpendersWindow::ThirtyDays;

/// Top spenders aggregated over a rolling time window, biggest net spend first.
/// Moderators only.
#[utoipa::path(
  get,
  tag = "Moderation",
  path = "/v1/moderation/top_spenders/list",
  params(
    ModeratorListTopSpendersQueryParams,
  ),
  responses(
    (status = 200, description = "Success", body = ModeratorListTopSpendersResponse),
    (status = 400, description = "Invalid window"),
    (status = 401, description = "Unauthorized"),
    (status = 500, description = "Server error"),
  ),
)]
pub async fn moderator_list_top_spenders_handler(
  http_request: HttpRequest,
  query: Query<ModeratorListTopSpendersQueryParams>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<ModeratorListTopSpendersResponse>, CommonWebError> {
  let _user_session = require_moderator(&http_request, &server_state.session_checker, &server_state.mysql_pool).await?;

  let window = query.window.unwrap_or(DEFAULT_WINDOW);
  let window_duration = Duration::hours(window.as_hours());

  let offset = query.offset.unwrap_or(0);

  let rows = list_top_spenders_for_window(ListTopSpendersForWindowArgs {
    window_start: Utc::now() - window_duration,
    maybe_payments_namespace: query.payments_namespace.as_deref(),
    limit: PAGE_SIZE,
    offset: offset.min(i64::MAX as u64) as i64,
    mysql_executor: &server_state.mysql_pool,
    phantom: PhantomData,
  })
  .await
  .map_err(|err| {
    warn!("Failed to list top spenders: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let maybe_next_offset = if rows.len() as i64 == PAGE_SIZE {
    Some(offset + PAGE_SIZE as u64)
  } else {
    None
  };

  let spenders = rows
    .into_iter()
    .map(|r| TopSpenderEntry {
      user_token: r.user_token,
      username: r.username,
      display_name: r.display_name,
      email_gravatar_hash: r.email_gravatar_hash,
      gross_spend_usd_cents: r.gross_spend_usd_cents,
      refund_usd_cents: r.refund_usd_cents,
      net_spend_usd_cents: r.net_spend_usd_cents,
      payment_count: r.payment_count,
      credits_granted: r.credits_granted,
    })
    .collect();

  Ok(Json(ModeratorListTopSpendersResponse {
    success: true,
    window,
    spenders,
    maybe_next_offset,
  }))
}
