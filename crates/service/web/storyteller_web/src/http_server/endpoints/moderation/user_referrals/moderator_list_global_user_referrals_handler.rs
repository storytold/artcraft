use std::sync::Arc;

use actix_web::web::{Json, Query};
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::moderation::user_referrals::list_global_user_referrals::{
  InvitedUserDetails, ListGlobalUserReferralsQueryParams,
  ListGlobalUserReferralsSuccessResponse, ReferrerUserDetails, UserReferralResponse,
};
use mysql_queries::queries::user_referrals::list_global_user_referrals::{
  list_global_user_referrals, ListGlobalUserReferralsArgs,
};

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::web_utils::user_session::require_moderator::{
  require_moderator, UseDatabase,
};
use crate::state::server_state::ServerState;

const CURSOR_NAME: &str = "modusrref";
const DEFAULT_LIMIT: u32 = 100;
const MAX_LIMIT: u32 = 1000;

/// List all user referrals globally. Moderators only.
#[utoipa::path(
  get,
  tag = "Moderation",
  path = "/v1/moderation/user_referrals/list",
  params(
    ListGlobalUserReferralsQueryParams,
  ),
  responses(
    (status = 200, description = "Success", body = ListGlobalUserReferralsSuccessResponse),
    (status = 401, description = "Unauthorized"),
    (status = 500, description = "Server error"),
  ),
)]
pub async fn moderator_list_global_user_referrals_handler(
  http_request: HttpRequest,
  query: Query<ListGlobalUserReferralsQueryParams>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<ListGlobalUserReferralsSuccessResponse>, CommonWebError> {

  let _user_session = require_moderator(
    &http_request,
    &server_state,
    UseDatabase::GrabNewConnection,
  ).await.map_err(|err| {
    warn!("Moderator check failed: {:?}", err);
    CommonWebError::NotAuthorized
  })?;

  let limit = query.limit
    .unwrap_or(DEFAULT_LIMIT)
    .min(MAX_LIMIT);

  let maybe_cursor_id = match &query.cursor {
    None => None,
    Some(cursor_str) => {
      let decoded = server_state.opaque_cursors
        .decode_cursor_expecting_name(CURSOR_NAME, cursor_str)
        .map_err(|err| {
          warn!("Failed to decode cursor: {:?}", err);
          CommonWebError::BadInputWithSimpleMessage(
            "Invalid cursor".to_string())
        })?;
      decoded.last_id
    }
  };

  let records = list_global_user_referrals(
    ListGlobalUserReferralsArgs {
      maybe_cursor_id,
      limit,
      mysql_pool: &server_state.mysql_pool,
    },
  ).await.map_err(|err| {
    warn!("Failed to list user referrals: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let maybe_cursor = records.last().map(|last| {
    server_state.opaque_cursors
      .encode_last_id_cursor(CURSOR_NAME, last.id)
  }).transpose().map_err(|err| {
    warn!("Failed to encode cursor: {:?}", err);
    CommonWebError::server_error_with_message("Failed to encode cursor")
  })?;

  let referrals = records.into_iter().map(|r| {
    UserReferralResponse {
      invited_user: InvitedUserDetails {
        token: r.invited_user_token,
        username: r.invited_username,
        display_name: r.invited_display_name,
        email_address: r.invited_email_address,
      },
      referrer_user: ReferrerUserDetails {
        token: r.referrer_user_token,
        username: r.referrer_username,
        display_name: r.referrer_display_name,
      },
      maybe_referral_code_token: r.maybe_referral_code_token,
      maybe_referral_url: r.maybe_referral_url,
      maybe_landing_url: r.maybe_landing_url,
      created_at: r.created_at,
    }
  }).collect();

  Ok(Json(ListGlobalUserReferralsSuccessResponse {
    success: true,
    referrals,
    maybe_cursor,
  }))
}
