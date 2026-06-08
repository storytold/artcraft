use std::marker::PhantomData;
use std::sync::Arc;

use actix_web::web::{Json, Path, Query};
use actix_web::{web, HttpRequest};
use chrono::{DateTime, Utc};
use log::warn;
use utoipa::{IntoParams, ToSchema};

use mysql_queries::queries::users::user::get::get_user_token_by_username::get_user_token_by_username;
use mysql_queries::queries::users::user_email_changes::list_user_email_changes_for_user::{
  list_user_email_changes_for_user, ListUserEmailChangesForUserArgs, UserDisplay,
  UserEmailChangeRow,
};
use tokens::tokens::users::UserToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::web_utils::user_session::require_moderator::{
  require_moderator, UseDatabase,
};
use crate::state::server_state::ServerState;

const CURSOR_NAME: &str = "modemchg";
const DEFAULT_LIMIT: u32 = 100;
const MAX_LIMIT: u32 = 1000;

// --- Path / Query ---

#[derive(Deserialize, ToSchema)]
pub struct ModeratorListUserEmailChangesForUserPathInfo {
  pub username: String,
}

#[derive(Deserialize, ToSchema, IntoParams)]
pub struct ModeratorListUserEmailChangesQueryParams {
  /// Opaque cursor from a previous page's `maybe_cursor`. Omit for the
  /// first page.
  pub cursor: Option<String>,

  /// Page size. Defaults to 100, capped at 1000.
  pub limit: Option<u32>,
}

// --- Response ---

#[derive(Serialize, ToSchema)]
pub struct ModeratorListUserEmailChangesSuccessResponse {
  pub success: bool,
  pub changes: Vec<ModeratorUserEmailChangeItem>,

  /// Opaque cursor for the next page. `None` means there are no more rows.
  pub maybe_cursor: Option<String>,
}

#[derive(Serialize, ToSchema)]
pub struct ModeratorUserEmailChangeItem {
  pub id: u64,
  pub user: ModeratorUserEmailChangeUserSummary,

  /// The user that performed the change. `None` for self-service changes
  /// or when the actor's `users` row has been hard-deleted.
  pub maybe_changed_by_user: Option<ModeratorUserEmailChangeUserSummary>,

  pub old_email: String,
  pub new_email: String,
  pub ip_address: String,
  pub created_at: DateTime<Utc>,
}

#[derive(Serialize, ToSchema)]
pub struct ModeratorUserEmailChangeUserSummary {
  pub user_token: UserToken,
  pub username: String,
  pub display_name: String,
  pub gravatar_hash: String,
}

// --- Handler ---

/// List recorded email-address changes for a given user, newest first.
/// Moderators only. Paginated via opaque cursor + limit.
#[utoipa::path(
  get,
  tag = "Moderation",
  path = "/v1/moderation/user_emails/list/{username}",
  params(
    ("username" = String, description = "Username of the user whose email history to list"),
    ModeratorListUserEmailChangesQueryParams,
  ),
  responses(
    (status = 200, description = "Success", body = ModeratorListUserEmailChangesSuccessResponse),
    (status = 400, description = "Bad cursor", body = CommonWebError),
    (status = 401, description = "Unauthorized", body = CommonWebError),
    (status = 404, description = "User not found", body = CommonWebError),
    (status = 500, description = "Server error", body = CommonWebError),
  ),
)]
pub async fn moderator_list_email_address_changes_for_user_handler(
  http_request: HttpRequest,
  path: Path<ModeratorListUserEmailChangesForUserPathInfo>,
  query: Query<ModeratorListUserEmailChangesQueryParams>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<ModeratorListUserEmailChangesSuccessResponse>, CommonWebError> {

  // 1. Require moderator.
  let _user_session = require_moderator(
    &http_request,
    &server_state,
    UseDatabase::GrabNewConnection,
  ).await.map_err(|err| {
    warn!("Moderator check failed: {:?}", err);
    CommonWebError::NotAuthorized
  })?;

  // 2. Resolve username → user_token. Not-found → 404; everything else → 500.
  let username = path.username.trim().to_lowercase();

  let user_token = get_user_token_by_username(&username, &server_state.mysql_pool)
    .await
    .map_err(|err| {
      warn!("Failed to resolve username {:?}: {:?}", username, err);
      CommonWebError::from_anyhow_error(err)
    })?
    .ok_or_else(|| {
      warn!("User not found: {:?}", username);
      CommonWebError::NotFound
    })?;

  // 3. Decode the page cursor, if any.
  let limit = query.limit.unwrap_or(DEFAULT_LIMIT).min(MAX_LIMIT);

  let maybe_cursor_id = match &query.cursor {
    None => None,
    Some(cursor_str) => {
      let decoded = server_state.opaque_cursors
        .decode_cursor_expecting_name(CURSOR_NAME, cursor_str)
        .map_err(|err| {
          warn!("Failed to decode cursor: {:?}", err);
          CommonWebError::BadInputWithSimpleMessage("Invalid cursor".to_string())
        })?;
      decoded.last_id
    }
  };

  // 4. Fetch the email-change history for that user.
  let rows = list_user_email_changes_for_user(ListUserEmailChangesForUserArgs {
    user_token: &user_token,
    maybe_cursor_id,
    limit,
    mysql_executor: &server_state.mysql_pool,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("Failed to list email changes for user {:?}: {:?}", username, err);
    CommonWebError::from_error(err)
  })?;

  // 5. Encode the next-page cursor from the last id, if there was one.
  let maybe_cursor = rows.last().map(|last| {
    server_state.opaque_cursors
      .encode_last_id_cursor(CURSOR_NAME, last.id)
  }).transpose().map_err(|err| {
    warn!("Failed to encode cursor: {:?}", err);
    CommonWebError::server_error_with_message("Failed to encode cursor")
  })?;

  let changes = rows.into_iter().map(to_response_item).collect();

  Ok(Json(ModeratorListUserEmailChangesSuccessResponse {
    success: true,
    changes,
    maybe_cursor,
  }))
}

fn to_response_item(row: UserEmailChangeRow) -> ModeratorUserEmailChangeItem {
  ModeratorUserEmailChangeItem {
    id: row.id,
    user: to_user_summary(row.user),
    maybe_changed_by_user: row.maybe_changed_by_user.map(to_user_summary),
    old_email: row.old_email,
    new_email: row.new_email,
    ip_address: row.ip_address,
    created_at: row.created_at,
  }
}

fn to_user_summary(display: UserDisplay) -> ModeratorUserEmailChangeUserSummary {
  ModeratorUserEmailChangeUserSummary {
    user_token: display.token,
    username: display.username,
    display_name: display.display_name,
    gravatar_hash: display.gravatar_hash,
  }
}
