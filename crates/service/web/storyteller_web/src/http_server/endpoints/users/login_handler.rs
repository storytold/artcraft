use std::fmt;
use std::fmt::Formatter;
use std::marker::PhantomData;

use actix_artcraft::sessions::user_sessions::http_user_session_manager::HttpUserSessionManager;
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::{web, HttpRequest, HttpResponse};
use chrono::{Duration, Utc};
use enums::by_table::staff_audit_logs::staff_audit_action::StaffAuditAction;
use enums::by_table::staff_audit_logs::staff_audit_entity_type::StaffAuditEntityType;
use http_server_common::request::get_request_ip::get_request_ip;
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use log::{info, warn};
use mysql_queries::queries::staff_audit_logs::insert_staff_audit_log::{
  insert_staff_audit_log, InsertStaffAuditLogArgs,
};
use mysql_queries::queries::user_impersonation_requests::lookup_user_impersonation_request::lookup_user_impersonation_request;
use mysql_queries::queries::user_impersonation_requests::mark_impersonation_token_as_redeemed::{
  mark_impersonation_token_as_redeemed, MarkImpersonationTokenAsRedeemedArgs,
};
use mysql_queries::queries::users::user::get::lookup_user_for_login_by_email::lookup_user_for_login_by_email;
use mysql_queries::queries::users::user::get::lookup_user_for_login_by_username::lookup_user_for_login_by_username;
use mysql_queries::queries::users::user_sessions::create_impersonated_user_session::{
  create_impersonated_user_session, CreateImpersonatedUserSessionArgs,
};
use mysql_queries::queries::users::user_sessions::create_user_session::create_user_session;
use password::bcrypt_confirm_password::bcrypt_confirm_password;
use sqlx::MySqlPool;
use tokens::tokens::user_sessions::UserSessionToken;
use utoipa::ToSchema;

use artcraft_api_defs::users::login::{LoginErrorType, LoginRequest, LoginSuccessResponse};
use password::errors::password_confirm_error::PasswordConfirmError;
use tokens::tokens::users::UserToken;
use crate::http_server::session::lookup::user_session_feature_flags::UserSessionFeatureFlags;
use crate::util::enroll_in_studio::enroll_in_studio;

#[derive(Serialize, Debug, ToSchema)]
pub struct LoginErrorResponse {
  pub success: bool,
  pub error_type: LoginErrorType,
  pub error_message: String,
}

// NB: Not using DeriveMore since Clion doesn't understand it.
impl fmt::Display for LoginErrorResponse {
  fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self.error_type)
  }
}

impl ResponseError for LoginErrorResponse {
  fn status_code(&self) -> StatusCode {
    match self.error_type {
      LoginErrorType::InvalidCredentials => StatusCode::UNAUTHORIZED,
      LoginErrorType::AccountNeedsPassword => StatusCode::UNAUTHORIZED,
      LoginErrorType::ServerError=> StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    serialize_as_json_error(self)
  }
}

impl LoginErrorResponse {
  fn invalid_credentials() -> Self {
    Self {
      success: false,
      error_type: LoginErrorType::InvalidCredentials,
      error_message: "invalid credentials".to_string()
    }
  }
  
  fn server_error() -> Self {
    Self {
      success: false,
      error_type: LoginErrorType::ServerError,
      error_message: "server error".to_string()
    }
  }

  fn account_without_password() -> Self {
    Self {
      success: false,
      error_type: LoginErrorType::AccountNeedsPassword,
      error_message: "account was created without a password; please try password reset".to_string()
    }
  }
}

#[utoipa::path(
  post,
  tag = "Users",
  path = "/v1/login",
  responses(
    (status = 200, description = "Found", body = LoginSuccessResponse),
    (status = 401, description = "Invalid credentials", body = LoginErrorResponse),
    (status = 500, description = "Server error", body = LoginErrorResponse),
  ),
  params(
    ("request" = LoginRequest, description = "Payload for Request"),
  )
)]
pub async fn login_handler(
  http_request: HttpRequest,
  request: web::Json<LoginRequest>,
  session_cookie_manager: web::Data<HttpUserSessionManager>,
  mysql_pool: web::Data<MySqlPool>,
) -> Result<HttpResponse, LoginErrorResponse>
{
  let check_username_or_email = request.username_or_email.to_lowercase();

  // TODO(bt,2023-11-12): I need to prevent user lookup attacks.
  let maybe_user = if check_username_or_email.contains("@") {
    lookup_user_for_login_by_email(&check_username_or_email, &mysql_pool).await
  } else {
    lookup_user_for_login_by_username(&check_username_or_email, &mysql_pool).await
  };

  let user = match maybe_user {
    Ok(Some(user)) => user,
    Ok(None) => {
      return Err(LoginErrorResponse::invalid_credentials());
    }
    Err(err) =>  {
      warn!("Login lookup error: {:?}", err);
      return Err(LoginErrorResponse::server_error());
    }
  };

  if user.is_banned {
    // We don't allow banned users back in.
    return Err(LoginErrorResponse::invalid_credentials());
  }

  info!("login user found");

  let actual_hash = match String::from_utf8(user.password_hash.clone()) {
    Ok(hash) => hash,
    Err(e) => {
      warn!("Login hash hydration error: {:?}", e);
      return Err(LoginErrorResponse::server_error());
    }
  };

  let ip_address = get_request_ip(&http_request);

  // Determine the password error to return if impersonation also fails.
  let password_error = match bcrypt_confirm_password(request.password.clone(), &actual_hash) {
    Ok(true) => None, // Password is valid — normal login.
    Ok(false) => Some(LoginErrorResponse::invalid_credentials()),
    Err(PasswordConfirmError::HashIsSentinelValue) => {
      Some(LoginErrorResponse::account_without_password())
    }
    Err(e) => {
      warn!("Login hash comparison error: {:?}", e);
      Some(LoginErrorResponse::server_error())
    }
  };

  let session_token = if password_error.is_none() {
    // Normal login path — password matched.
    let create_session_result =
      create_user_session(&user.token.0, &ip_address, &mysql_pool).await;

    let token = match create_session_result {
      Ok(token) => token,
      Err(e) => {
        warn!("login create session error: {:?}", e);
        return Err(LoginErrorResponse::server_error());
      }
    };

    info!("login session created for user: {} / {:?}", &user.token, &user.token);

    let user_feature_flags =
        UserSessionFeatureFlags::new(user.maybe_feature_flags.as_deref());

    // NB: Enroll new users in studio for a while.
    enroll_in_studio(&user.token, &ip_address, &mysql_pool, Some(&user_feature_flags)).await
        .map_err(|e| {
          warn!("error enrolling in studio: {:?}", e);
        }).ok();

    UserSessionToken::new_from_str(&token)
  } else {
    // Password didn't match — try impersonation token as a fallback.
    match try_impersonation_login(&user.token, &request.password, &ip_address, &mysql_pool).await {
      Ok(session_token) => session_token,
      Err(_) => {
        // Impersonation also failed; return the original password error.
        return Err(password_error.unwrap());
      }
    }
  };

  let session_cookie = match session_cookie_manager.create_cookie(&session_token, &user.token) {
    Ok(cookie) => cookie,
    Err(_) => return Err(LoginErrorResponse::server_error()),
  };

  let signed_session = match session_cookie_manager.encode_session_payload(&session_token, &user.token) {
    Ok(payload) => payload,
    Err(_) => return Err(LoginErrorResponse::server_error()),
  };

  let response = LoginSuccessResponse {
    success: true,
    signed_session,
  };

  let body = serde_json::to_string(&response)
    .map_err(|_e| LoginErrorResponse::server_error())?;

  Ok(HttpResponse::Ok()
    .cookie(session_cookie)
    .content_type("application/json")
    .body(body))
}

/// Attempt to log in via a moderator impersonation token (supplied in the password field).
///
/// Returns the impersonated user's session token on success, or an error if the
/// impersonation token is invalid, expired, already redeemed, or doesn't match.
async fn try_impersonation_login(
  target_user_token: &UserToken,
  password: &str,
  ip_address: &str,
  mysql_pool: &MySqlPool,
) -> Result<UserSessionToken, LoginErrorResponse> {

  let record = lookup_user_impersonation_request(password, mysql_pool)
      .await
      .map_err(|err| {
        warn!("Impersonation lookup error: {:?}", err);
        LoginErrorResponse::server_error()
      })?
      .ok_or_else(|| {
        info!("No impersonation request found for provided token");
        LoginErrorResponse::invalid_credentials()
      })?;

  // Validate: not already redeemed.
  if record.is_redeemed {
    warn!("Impersonation token already redeemed: {}", record.token);
    return Err(LoginErrorResponse::invalid_credentials());
  }

  // Validate: not expired.
  if Utc::now() > record.expires_at {
    warn!("Impersonation token expired: {} (expired at {:?})", record.token, record.expires_at);
    return Err(LoginErrorResponse::invalid_credentials());
  }

  // Validate: the impersonated user matches the user we're logging into.
  if record.impersonated_user_token != *target_user_token {
    warn!(
      "Impersonation token user mismatch: token is for {} but login is for {}",
      record.impersonated_user_token.as_str(),
      target_user_token.as_str(),
    );
    return Err(LoginErrorResponse::invalid_credentials());
  }

  info!(
    "Valid impersonation login: moderator={} impersonating={}",
    record.impersonator_user_token.as_str(),
    target_user_token.as_str(),
  );

  // Begin transaction: audit log + mark redeemed + create session.
  let mut transaction = mysql_pool.begin().await
      .map_err(|err| {
        warn!("Failed to begin impersonation transaction: {:?}", err);
        LoginErrorResponse::server_error()
      })?;

  // Insert staff audit log for the redemption.
  let _audit_token = insert_staff_audit_log(InsertStaffAuditLogArgs {
    audit_action: StaffAuditAction::ImpersonateUserRedeem,
    maybe_entity_type: Some(StaffAuditEntityType::User),
    maybe_entity_token: Some(target_user_token.as_str()),
    staff_user_token: &record.impersonator_user_token,
    actor_ip_address: ip_address,
    mysql_executor: &mut *transaction,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("Failed to insert impersonation audit log: {:?}", err);
    LoginErrorResponse::server_error()
  })?;

  // Mark the impersonation token as redeemed.
  mark_impersonation_token_as_redeemed(MarkImpersonationTokenAsRedeemedArgs {
    user_impersonation_token: password,
    ip_address_redemption: ip_address,
    mysql_executor: &mut *transaction,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("Failed to mark impersonation token as redeemed: {:?}", err);
    LoginErrorResponse::server_error()
  })?;

  // Create the impersonated session (60 min expiry).
  let expires_at = Utc::now() + Duration::minutes(60);

  let session_token = create_impersonated_user_session(
    CreateImpersonatedUserSessionArgs {
      user_token: target_user_token,
      impersonator_user_token: &record.impersonator_user_token,
      ip_address,
      expires_at,
      mysql_executor: &mut *transaction,
      phantom: PhantomData,
    },
  ).await.map_err(|err| {
    warn!("Failed to create impersonated session: {:?}", err);
    LoginErrorResponse::server_error()
  })?;

  // Commit the transaction.
  transaction.commit().await.map_err(|err| {
    warn!("Failed to commit impersonation transaction: {:?}", err);
    LoginErrorResponse::server_error()
  })?;

  info!(
    "Impersonation session created: moderator={} as user={} session={}",
    record.impersonator_user_token.as_str(),
    target_user_token.as_str(),
    session_token.as_str(),
  );

  Ok(session_token)
}
