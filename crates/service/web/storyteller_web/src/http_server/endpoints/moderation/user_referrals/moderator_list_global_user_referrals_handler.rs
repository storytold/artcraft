use std::sync::Arc;

use actix_web::web::{Json, Query};
use actix_web::{web, HttpRequest};
use chrono::{DateTime, Utc};
use log::warn;
use utoipa::{IntoParams, ToSchema};

use mysql_queries::queries::user_referrals::list_global_user_referrals::{
  list_global_user_referrals, ListGlobalUserReferralsArgs,
};
use tokens::tokens::user_referral_codes::UserReferralCodeToken;
use tokens::tokens::users::UserToken;

use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;
use crate::http_server::web_utils::user_session::require_moderator::{
  require_moderator, UseDatabase,
};
use crate::state::server_state::ServerState;

const CURSOR_NAME: &str = "modusrref";
const DEFAULT_LIMIT: u32 = 100;
const MAX_LIMIT: u32 = 1000;

// --- Request ---

#[derive(Deserialize, ToSchema, IntoParams)]
pub struct ListGlobalUserReferralsQueryParams {
  pub cursor: Option<String>,
  pub limit: Option<u32>,
}

// --- Response ---

#[derive(Serialize, ToSchema)]
pub struct ListGlobalUserReferralsSuccessResponse {
  pub success: bool,
  pub referrals: Vec<UserReferralResponse>,
  pub maybe_cursor: Option<String>,
}

#[derive(Serialize, ToSchema)]
pub struct UserReferralResponse {
  pub invited_user: InvitedUserDetails,
  pub referrer_user: ReferrerUserDetails,
  pub maybe_referral_code_token: Option<UserReferralCodeToken>,
  pub maybe_referral_url: Option<String>,
  pub maybe_landing_url: Option<String>,
  pub created_at: DateTime<Utc>,
}

#[derive(Serialize, ToSchema)]
pub struct InvitedUserDetails {
  pub token: UserToken,
  pub username: String,
  pub display_name: String,
  pub email_address: String,
}

#[derive(Serialize, ToSchema)]
pub struct ReferrerUserDetails {
  pub token: UserToken,
  pub username: String,
  pub display_name: String,
}

// --- Handler ---

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
) -> Result<Json<ListGlobalUserReferralsSuccessResponse>, AdvancedCommonWebError> {

  let _user_session = require_moderator(
    &http_request,
    &server_state,
    UseDatabase::GrabNewConnection,
  ).await.map_err(|err| {
    warn!("Moderator check failed: {:?}", err);
    AdvancedCommonWebError::NotAuthorized
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
          AdvancedCommonWebError::BadInputWithSimpleMessage(
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
    AdvancedCommonWebError::from_error(err)
  })?;

  let maybe_cursor = records.last().map(|last| {
    server_state.opaque_cursors
      .encode_last_id_cursor(CURSOR_NAME, last.id)
  }).transpose().map_err(|err| {
    warn!("Failed to encode cursor: {:?}", err);
    AdvancedCommonWebError::server_error_with_message("Failed to encode cursor")
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
