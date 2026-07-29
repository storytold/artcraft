use std::marker::PhantomData;
use std::sync::Arc;

use actix_web::web::{Json, Query};
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::moderation::user_daily_spends::user_daily_spends_list::{
  ModeratorUserDailySpendsQueryParams, ModeratorUserDailySpendsResponse, UserDailySpendEntry,
};
use mysql_queries::queries::user_daily_spends::list_user_daily_spends::{
  list_user_daily_spends, ListUserDailySpendsArgs,
};
use tokens::tokens::users::UserToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::moderation::resolve_payments_namespace;
use crate::http_server::user_lookup::user_session::require_moderator::require_moderator;
use crate::state::server_state::ServerState;

const DEFAULT_LIMIT: u32 = 200;
const MAX_LIMIT: u32 = 5000;

/// List a user's daily spend rows, most recent payment date first. Moderators only.
#[utoipa::path(
  get,
  tag = "Moderation",
  path = "/v1/moderation/user_daily_spends/user/{user_token}",
  params(
    ("user_token" = String, Path, description = "The user's token"),
    ModeratorUserDailySpendsQueryParams,
  ),
  responses(
    (status = 200, description = "Success", body = ModeratorUserDailySpendsResponse),
    (status = 401, description = "Unauthorized"),
    (status = 500, description = "Server error"),
  ),
)]
pub async fn moderator_user_daily_spends_handler(
  http_request: HttpRequest,
  path: web::Path<String>,
  query: Query<ModeratorUserDailySpendsQueryParams>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<ModeratorUserDailySpendsResponse>, CommonWebError> {
  let _user_session = require_moderator(&http_request, &server_state.session_checker, &server_state.mysql_pool).await?;

  let user_token = UserToken(path.into_inner());
  let payments_namespace = resolve_payments_namespace(query.payments_namespace.as_deref())?;
  let limit = query.limit.unwrap_or(DEFAULT_LIMIT).min(MAX_LIMIT);
  let offset = query.offset.unwrap_or(0);

  let rows = list_user_daily_spends(ListUserDailySpendsArgs {
    user_token: &user_token,
    payments_namespace,
    limit: limit as i64,
    offset: offset.min(i64::MAX as u64) as i64,
    mysql_executor: &server_state.mysql_pool,
    phantom: PhantomData,
  })
  .await
  .map_err(|err| {
    warn!("Failed to list user daily spends: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let maybe_next_offset = if rows.len() as u32 == limit {
    Some(offset + limit as u64)
  } else {
    None
  };

  let records = rows
    .into_iter()
    .map(|r| UserDailySpendEntry {
      payments_namespace: r.payments_namespace.to_str().to_string(),
      spend_date: r.spend_date,
      subscription_spend_usd_cents: r.subscription_spend_usd_cents,
      credits_spend_usd_cents: r.credits_spend_usd_cents,
      gross_spend_usd_cents: r.gross_spend_usd_cents,
      refund_usd_cents: r.refund_usd_cents,
      net_spend_usd_cents: r.net_spend_usd_cents,
      payment_count: r.payment_count,
      credits_granted: r.credits_granted,
      created_at: r.created_at,
      updated_at: r.updated_at,
    })
    .collect();

  Ok(Json(ModeratorUserDailySpendsResponse {
    success: true,
    user_token,
    records,
    maybe_next_offset,
  }))
}
