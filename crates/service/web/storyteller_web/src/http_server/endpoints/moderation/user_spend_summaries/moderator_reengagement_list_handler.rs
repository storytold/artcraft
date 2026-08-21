use std::marker::PhantomData;
use std::sync::Arc;

use actix_web::web::{Json, Query};
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::moderation::user_spend_summaries::reengagement_list::{
  ModeratorReengagementListQueryParams, ModeratorReengagementListResponse, ReengagementCandidateEntry,
};
use mysql_queries::queries::user_spend_summaries::list_reengagement_candidates::{
  list_reengagement_candidates, ListReengagementCandidatesArgs,
};

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::moderation::resolve_payments_namespace;
use crate::http_server::user_lookup::user_session::require_moderator::require_moderator;
use crate::state::server_state::ServerState;

const PAGE_SIZE: i64 = 200;

/// List users that need re-engagement (re-engagement score descending). Moderators only.
#[utoipa::path(
  get,
  tag = "Moderation",
  path = "/v1/moderation/user_spend_summaries/reengagement_list",
  params(
    ModeratorReengagementListQueryParams,
  ),
  responses(
    (status = 200, description = "Success", body = ModeratorReengagementListResponse),
    (status = 401, description = "Unauthorized"),
    (status = 500, description = "Server error"),
  ),
)]
pub async fn moderator_reengagement_list_handler(
  http_request: HttpRequest,
  query: Query<ModeratorReengagementListQueryParams>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<ModeratorReengagementListResponse>, CommonWebError> {
  let _user_session = require_moderator(&http_request, &server_state.session_checker, &server_state.mysql_pool).await?;

  let payments_namespace = resolve_payments_namespace(query.payments_namespace.as_deref())?;
  let offset = query.offset.unwrap_or(0);

  let rows = list_reengagement_candidates(ListReengagementCandidatesArgs {
    payments_namespace: payments_namespace.to_str(),
    limit: PAGE_SIZE,
    offset: offset.min(i64::MAX as u64) as i64,
    mysql_executor: &server_state.mysql_pool,
    phantom: PhantomData,
  })
  .await
  .map_err(|err| {
    warn!("Failed to list reengagement candidates: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let maybe_next_offset = if rows.len() as i64 == PAGE_SIZE {
    Some(offset + PAGE_SIZE as u64)
  } else {
    None
  };

  let candidates = rows
    .into_iter()
    .map(|r| ReengagementCandidateEntry {
      user_token: r.user_token,
      username: r.username,
      display_name: r.display_name,
      email_gravatar_hash: r.email_gravatar_hash,
      reengagement_score: r.reengagement_score,
      lifetime_net_spend_usd_cents: r.lifetime_net_spend_usd_cents,
      maybe_last_payment_at: r.maybe_last_payment_at,
      maybe_days_since_last_payment: r.maybe_days_since_last_payment,
      maybe_weeks_since_last_spend: r.maybe_weeks_since_last_spend,
      is_active_subscriber: r.is_active_subscriber,
    })
    .collect();

  Ok(Json(ModeratorReengagementListResponse {
    success: true,
    candidates,
    maybe_next_offset,
  }))
}
