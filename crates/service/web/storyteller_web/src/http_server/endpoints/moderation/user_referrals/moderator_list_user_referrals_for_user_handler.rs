use std::sync::Arc;

use actix_web::web::{Json, Path, Query};
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::moderation::user_referrals::list_global_user_referrals::{
  InvitedUserDetails, ReferrerUserDetails, UserReferralResponse,
};
use artcraft_api_defs::moderation::user_referrals::list_user_referrals_for_user::{
  ListUserReferralsForUserPathInfo, ListUserReferralsForUserQueryParams,
  ListUserReferralsForUserSuccessResponse,
};
use mysql_queries::queries::user_referrals::list_user_referrals_for_user::{
  list_user_referrals_for_user, ListUserReferralsForUserArgs,
};

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::web_utils::user_session::require_moderator::{
  require_moderator, UseDatabase,
};
use crate::state::server_state::ServerState;

const CURSOR_NAME: &str = "modusrrefu";
const DEFAULT_LIMIT: u32 = 100;
const MAX_LIMIT: u32 = 1000;

/// List user referrals for a specific referrer user. Moderators only.
#[utoipa::path(
  get,
  tag = "Moderation",
  path = "/v1/moderation/user_referrals/user/{username}/list",
  params(
    ("username" = String, description = "The referrer's username"),
    ListUserReferralsForUserQueryParams,
  ),
  responses(
    (status = 200, description = "Success", body = ListUserReferralsForUserSuccessResponse),
    (status = 401, description = "Unauthorized"),
    (status = 500, description = "Server error"),
  ),
)]
pub async fn moderator_list_user_referrals_for_user_handler(
  http_request: HttpRequest,
  path: Path<ListUserReferralsForUserPathInfo>,
  query: Query<ListUserReferralsForUserQueryParams>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<ListUserReferralsForUserSuccessResponse>, CommonWebError> {

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

  let referrer_username = path.username.trim().to_lowercase();

  let records = list_user_referrals_for_user(
    ListUserReferralsForUserArgs {
      referrer_username: &referrer_username,
      maybe_cursor_id,
      limit,
      mysql_pool: &server_state.mysql_pool,
    },
  ).await.map_err(|err| {
    warn!("Failed to list user referrals for user: {:?}", err);
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

  Ok(Json(ListUserReferralsForUserSuccessResponse {
    success: true,
    referrals,
    maybe_cursor,
  }))
}
