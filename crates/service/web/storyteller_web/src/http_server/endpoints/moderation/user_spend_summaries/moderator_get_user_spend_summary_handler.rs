use std::marker::PhantomData;
use std::sync::Arc;

use actix_web::web::{Json, Query};
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::moderation::user_spend_summaries::get_summary::{
  ModeratorGetUserSpendSummaryQueryParams, ModeratorGetUserSpendSummaryResponse, UserSpendSummaryView,
};
use mysql_queries::queries::user_spend_summaries::get_user_spend_summary::{
  get_user_spend_summary, GetUserSpendSummaryArgs, UserSpendSummaryRecord,
};
use tokens::tokens::users::UserToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::moderation::resolve_payments_namespace;
use crate::http_server::user_lookup::user_session::require_moderator::require_moderator;
use crate::state::server_state::ServerState;

/// Get the full spend summary for a user. Moderators only.
#[utoipa::path(
  get,
  tag = "Moderation",
  path = "/v1/moderation/user_spend_summaries/summary/{user_token}",
  params(
    ("user_token" = String, Path, description = "The user's token"),
    ModeratorGetUserSpendSummaryQueryParams,
  ),
  responses(
    (status = 200, description = "Success", body = ModeratorGetUserSpendSummaryResponse),
    (status = 401, description = "Unauthorized"),
    (status = 500, description = "Server error"),
  ),
)]
pub async fn moderator_get_user_spend_summary_handler(
  http_request: HttpRequest,
  path: web::Path<String>,
  query: Query<ModeratorGetUserSpendSummaryQueryParams>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<ModeratorGetUserSpendSummaryResponse>, CommonWebError> {
  let _user_session = require_moderator(&http_request, &server_state.session_checker, &server_state.mysql_pool).await?;

  let user_token = UserToken(path.into_inner());
  let payments_namespace = resolve_payments_namespace(query.payments_namespace.as_deref())?;

  let maybe_record = get_user_spend_summary(GetUserSpendSummaryArgs {
    payments_namespace,
    user_token: &user_token,
    mysql_executor: &server_state.mysql_pool,
    phantom: PhantomData,
  })
  .await
  .map_err(|err| {
    warn!("Failed to get user spend summary: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  Ok(Json(ModeratorGetUserSpendSummaryResponse {
    success: true,
    maybe_summary: maybe_record.map(to_view),
  }))
}

fn to_view(r: UserSpendSummaryRecord) -> UserSpendSummaryView {
  UserSpendSummaryView {
    payments_namespace: r.payments_namespace.to_str().to_string(),
    user_token: r.user_token,
    lifetime_gross_spend_usd_cents: r.lifetime_gross_spend_usd_cents,
    lifetime_subscription_spend_usd_cents: r.lifetime_subscription_spend_usd_cents,
    lifetime_credits_spend_usd_cents: r.lifetime_credits_spend_usd_cents,
    lifetime_refund_usd_cents: r.lifetime_refund_usd_cents,
    lifetime_net_spend_usd_cents: r.lifetime_net_spend_usd_cents,
    lifetime_payment_count: r.lifetime_payment_count,
    lifetime_refund_count: r.lifetime_refund_count,
    maybe_first_payment_at: r.maybe_first_payment_at,
    first_spend_usd_cents: r.first_spend_usd_cents,
    maybe_last_payment_at: r.maybe_last_payment_at,
    last_spend_usd_cents: r.last_spend_usd_cents,
    maybe_days_since_first_payment: r.maybe_days_since_first_payment,
    maybe_days_since_last_payment: r.maybe_days_since_last_payment,
    net_spend_7d_usd_cents: r.net_spend_7d_usd_cents,
    net_spend_prev_7d_usd_cents: r.net_spend_prev_7d_usd_cents,
    net_spend_14d_usd_cents: r.net_spend_14d_usd_cents,
    net_spend_prev_14d_usd_cents: r.net_spend_prev_14d_usd_cents,
    net_spend_30d_usd_cents: r.net_spend_30d_usd_cents,
    net_spend_prev_30d_usd_cents: r.net_spend_prev_30d_usd_cents,
    net_spend_60d_usd_cents: r.net_spend_60d_usd_cents,
    net_spend_90d_usd_cents: r.net_spend_90d_usd_cents,
    net_spend_this_year_usd_cents: r.net_spend_this_year_usd_cents,
    avg_weekly_net_spend_4w_usd_cents: r.avg_weekly_net_spend_4w_usd_cents,
    avg_weekly_net_spend_12w_usd_cents: r.avg_weekly_net_spend_12w_usd_cents,
    active_weeks_in_last_4: r.active_weeks_in_last_4,
    active_weeks_in_last_8: r.active_weeks_in_last_8,
    active_weeks_in_last_12: r.active_weeks_in_last_12,
    active_weeks_in_last_24: r.active_weeks_in_last_24,
    active_weeks_in_last_52: r.active_weeks_in_last_52,
    consecutive_active_weeks: r.consecutive_active_weeks,
    consecutive_inactive_weeks: r.consecutive_inactive_weeks,
    maybe_weeks_since_last_spend: r.maybe_weeks_since_last_spend,
    is_active_subscriber: r.is_active_subscriber,
    maybe_subscription_interval: r.maybe_subscription_interval,
    maybe_reengagement_score: r.maybe_reengagement_score,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }
}
