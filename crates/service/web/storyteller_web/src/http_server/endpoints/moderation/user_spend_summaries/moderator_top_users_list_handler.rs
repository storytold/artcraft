use std::marker::PhantomData;
use std::sync::Arc;

use actix_web::web::{Json, Query};
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::moderation::user_spend_summaries::top_users_list::{
  ModeratorTopUsersListQueryParams, ModeratorTopUsersListResponse, TopUserEntry, TopUsersWindow,
};
use mysql_queries::queries::user_spend_summaries::list_top_users_by_net_spend::{
  list_top_users_by_net_spend, ListTopUsersByNetSpendArgs,
};

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::moderation::resolve_payments_namespace;
use crate::http_server::user_lookup::user_session::require_moderator::require_moderator;
use crate::state::server_state::ServerState;

const PAGE_SIZE: i64 = 200;

/// List top spenders, sorted by net spend over the requested window. Moderators only.
#[utoipa::path(
  get,
  tag = "Moderation",
  path = "/v1/moderation/user_spend_summaries/top_users_list",
  params(
    ModeratorTopUsersListQueryParams,
  ),
  responses(
    (status = 200, description = "Success", body = ModeratorTopUsersListResponse),
    (status = 401, description = "Unauthorized"),
    (status = 500, description = "Server error"),
  ),
)]
pub async fn moderator_top_users_list_handler(
  http_request: HttpRequest,
  query: Query<ModeratorTopUsersListQueryParams>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<ModeratorTopUsersListResponse>, CommonWebError> {
  let _user_session = require_moderator(&http_request, &server_state.session_checker, &server_state.mysql_pool).await?;

  let payments_namespace = resolve_payments_namespace(query.payments_namespace.as_deref())?;
  let window = query.window.unwrap_or(TopUsersWindow::Lifetime);
  let offset = query.offset.unwrap_or(0);

  let rows = list_top_users_by_net_spend(ListTopUsersByNetSpendArgs {
    payments_namespace: payments_namespace.to_str(),
    window: window.as_query_key(),
    limit: PAGE_SIZE,
    offset: offset.min(i64::MAX as u64) as i64,
    mysql_executor: &server_state.mysql_pool,
    phantom: PhantomData,
  })
  .await
  .map_err(|err| {
    warn!("Failed to list top users by net spend: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let maybe_next_offset = if rows.len() as i64 == PAGE_SIZE {
    Some(offset + PAGE_SIZE as u64)
  } else {
    None
  };

  let users = rows
    .into_iter()
    .map(|r| TopUserEntry {
      user_token: r.user_token,
      username: r.username,
      display_name: r.display_name,
      email_gravatar_hash: r.email_gravatar_hash,
      lifetime_net_spend_usd_cents: r.lifetime_net_spend_usd_cents,
      net_spend_7d_usd_cents: r.net_spend_7d_usd_cents,
      net_spend_14d_usd_cents: r.net_spend_14d_usd_cents,
      net_spend_30d_usd_cents: r.net_spend_30d_usd_cents,
      net_spend_60d_usd_cents: r.net_spend_60d_usd_cents,
      net_spend_90d_usd_cents: r.net_spend_90d_usd_cents,
      net_spend_this_year_usd_cents: r.net_spend_this_year_usd_cents,
      is_active_subscriber: r.is_active_subscriber,
      maybe_reengagement_score: r.maybe_reengagement_score,
    })
    .collect();

  Ok(Json(ModeratorTopUsersListResponse {
    success: true,
    window: window.as_query_key().to_string(),
    users,
    maybe_next_offset,
  }))
}
