use std::collections::BTreeSet;
use std::fmt;
use std::iter::FromIterator;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::{Data, Json, Path};
use actix_web::{HttpRequest, HttpResponse};
use log::warn;
use redis::{Client, Commands};
use utoipa::ToSchema;

use enums::by_table::users::user_feature_flag::UserFeatureFlag;
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::queries::users::user::get::get_user_token_by_username::get_user_token_by_username;
use mysql_queries::queries::users::user::update::set_user_feature_flags::{set_user_feature_flags, SetUserFeatureFlagArgs};
use mysql_queries::queries::users::user_profiles::get_user_profile_by_token::get_user_profile_by_token;
use tokens::tokens::users::UserToken;

use crate::http_server::session::lookup::user_session_feature_flags::UserSessionFeatureFlags;
use artcraft_api_defs::common::responses::simple_generic_json_success::SimpleGenericJsonSuccess;
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::http_server::web_utils::response_success_helpers::simple_json_success;
use crate::state::server_state::ServerState;

/// For the URL PathInfo
#[derive(Deserialize, ToSchema)]
pub struct EditUserFeatureFlagPathInfo {
  username_or_token: String,
}

#[derive(Deserialize, ToSchema)]
pub struct EditUserFeatureFlagsRequest {
  action: EditUserFeatureFlagsOption,
}

#[derive(Deserialize, ToSchema)]
pub enum EditUserFeatureFlagsOption {
  /// Add the following flags to the user, keeping any existing flags.
  AddFlags {
    flags: Vec<UserFeatureFlag>
  },
  /// Remove the following flags from the user, keeping any other existing flags not listed below.
  RemoveFlags {
    flags: Vec<UserFeatureFlag>
  },
  /// Keep only the following flags on the user, but only if they're already present.
  KeepFlags {
    flags: Vec<UserFeatureFlag>
  },
  /// Set the exact set of flags below, discarding any existing state.
  SetExactFlags {
    flags: Vec<UserFeatureFlag>
  },
  /// Clear all flags from the user.
  ClearAllFlags,
}

#[derive(Debug, ToSchema)]
pub enum EditUserFeatureFlagsError {
  BadInput(String),
  ServerError,
  Unauthorized,
}

impl ResponseError for EditUserFeatureFlagsError {
  fn status_code(&self) -> StatusCode {
    match *self {
      EditUserFeatureFlagsError::BadInput(_) => StatusCode::BAD_REQUEST,
      EditUserFeatureFlagsError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
      EditUserFeatureFlagsError::Unauthorized => StatusCode::UNAUTHORIZED,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      EditUserFeatureFlagsError::BadInput(reason) => reason.to_string(),
      EditUserFeatureFlagsError::ServerError => "server error".to_string(),
      EditUserFeatureFlagsError::Unauthorized => "unauthorized".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for EditUserFeatureFlagsError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

#[utoipa::path(
  post,
  tag = "Moderation",
  path = "/v1/moderation/user_feature_flags/{username_or_token}",
  responses(
    (status = 200, description = "Success", body = SimpleGenericJsonSuccess),
    (status = 401, description = "Unauthorized", body = EditUserFeatureFlagsError),
    (status = 404, description = "Not found", body = EditUserFeatureFlagsError),
    (status = 500, description = "Server error", body = EditUserFeatureFlagsError),
  ),
  params(
    ("path" = EditUserFeatureFlagPathInfo, description = "Path for Request"),
    ("request" = EditUserFeatureFlagsRequest, description = "Payload for Request"),
  )
)]
pub async fn edit_user_feature_flags_handler(
  http_request: HttpRequest,
  path: Path<EditUserFeatureFlagPathInfo>,
  request: Json<EditUserFeatureFlagsRequest>,
  server_state: Data<Arc<ServerState>>,
  //redis_ttl_cache: Data<RedisTtlCache>,
  redis_pool: Data<r2d2::Pool<Client>>,
) -> Result<HttpResponse, EditUserFeatureFlagsError> {

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        EditUserFeatureFlagsError::ServerError
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      return Err(EditUserFeatureFlagsError::Unauthorized);
    }
  };

  if !user_session.can_ban_users {
    warn!("user is not allowed to add bans: {:?}", user_session.user_token.as_str());
    return Err(EditUserFeatureFlagsError::Unauthorized);
  }

  let username_or_token = path.username_or_token.trim();

  let user_token;

  if username_or_token.starts_with(UserToken::token_prefix()) || username_or_token.starts_with("U:") {
    user_token = UserToken::new_from_str(username_or_token);
  } else {
    user_token = get_user_token_by_username(&username_or_token, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Could not get user token by username: {:?}", e);
        EditUserFeatureFlagsError::ServerError
      })?
      .ok_or_else(|| {
        EditUserFeatureFlagsError::ServerError
      })?;
  }

  let user_profile = get_user_profile_by_token(&user_token, &server_state.mysql_pool)
    .await
    .map_err(|e| {
      warn!("Could not get user session by token: {:?}", e);
      EditUserFeatureFlagsError::ServerError
    })?
    .ok_or_else(|| {
      EditUserFeatureFlagsError::ServerError
    })?;

  let mut user_feature_flags =
      UserSessionFeatureFlags::new(user_profile.maybe_feature_flags.as_deref());

  match &request.action {
    EditUserFeatureFlagsOption::AddFlags { flags } => {
      user_feature_flags.add_flags(flags.iter().cloned());
    }
    EditUserFeatureFlagsOption::RemoveFlags { flags } => {
      let flags = BTreeSet::from_iter(flags.iter().cloned());
      user_feature_flags.remove_flags(&flags);
    }
    EditUserFeatureFlagsOption::KeepFlags { flags } => {
      let flags = BTreeSet::from_iter(flags.iter().cloned());
      user_feature_flags.keep_flags(&flags);
    }
    EditUserFeatureFlagsOption::SetExactFlags { flags } => {
      user_feature_flags.set_flags(flags.iter().cloned());
    }
    EditUserFeatureFlagsOption::ClearAllFlags => {
      user_feature_flags.clear_flags();
    }
  }

  let ip_address = get_request_ip(&http_request);

  set_user_feature_flags(SetUserFeatureFlagArgs {
    subject_user_token: &user_profile.user_token,
    maybe_feature_flags: user_feature_flags.maybe_serialize_string().as_deref(),
    maybe_mod_user_token: Some(&user_session.user_token),
    ip_address: &ip_address,
    mysql_pool: &server_state.mysql_pool,
  }).await
    .map_err(|e| {
      warn!("Could not set flags: {:?}", e);
      EditUserFeatureFlagsError::ServerError
    })?;

  //if let Ok(mut redis) = redis_ttl_cache.get_connection() {
  //  // TODO(bt,2024-04-20): This should be coordinated with other code.
  //  let cache_key = format!("cache:userProfile:{}", user_profile.username);
  //  let _r = redis.delete_from_cache(&cache_key);
  //}

  if let Ok(mut redis) = redis_pool.get() {
    // TODO(bt,2024-04-20): This should be coordinated with other code.
    let cache_key = format!("cache:userProfile:{}", user_profile.username);
    let _r : Result<Option<String>, _> = redis.del(&cache_key);
  }

  Ok(simple_json_success())
}
