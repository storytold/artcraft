use std::fmt::Display;

use actix_artcraft::sessions::http_user_session_manager::HttpUserSessionManager;
use actix_web::http::StatusCode;
use actix_web::{web, HttpRequest, HttpResponse, ResponseError};
use http_server_common::request::get_request_ip::get_request_ip;
use log::{error, warn};
use mysql_queries::queries::users::user_password_resets::change_password_from_password_reset::{change_password_from_password_reset, ChangePasswordFromPasswordResetArgs};
use mysql_queries::queries::users::user_password_resets::lookup_password_reset_request::lookup_password_reset_request;
use mysql_queries::queries::users::user_sessions::create_user_session::create_user_session;
use password::bcrypt_hash_password::bcrypt_hash_password;
use serde::Deserialize;
use sqlx::MySqlPool;
use strum_macros::Display;
use tokens::tokens::user_sessions::UserSessionToken;

#[derive(Deserialize)]
pub struct PasswordResetRedemptionRequest {
    reset_token: String,
    new_password: String,
    new_password_validation: String,
}

#[derive(Serialize)]
pub struct PasswordResetRedemptionResponse {
    success: bool,

    /// A signed session that can be sent as a header, bypassing cookies.
    /// This is useful for API clients that don't support cookies or Google
    /// browsers killing cross-domain cookies.
    pub signed_session: String,
}

#[derive(Serialize, Debug, Display)]
pub enum PasswordResetRedemptionError {
    /// Account does not exist or reset token is wrong.
    InvalidRedemption,
    PasswordsDoNotMatch,
    Internal,
}

impl PasswordResetRedemptionError {
    pub fn message(&self) -> &'static str {
        match self {
            Self::InvalidRedemption => "The redemption code is invalid, has already been redeemed, or has been replaced by a newer code.",
            Self::PasswordsDoNotMatch => "The passwords do not match.",
            Self::Internal => "An internal error occurred. Please try again later.",
        }
    }

    pub fn status_code(&self) -> StatusCode {
        match self {
            Self::InvalidRedemption => StatusCode::BAD_REQUEST,
            Self::PasswordsDoNotMatch => StatusCode::BAD_REQUEST,
            Self::Internal => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }
}

#[derive(Serialize, Debug)]
pub struct PasswordResetRedemptionErrorResponse {
    success: bool,
    kind: PasswordResetRedemptionError,
    message: String,
}

impl Display for PasswordResetRedemptionErrorResponse {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{:?}", self)
    }
}

impl From<PasswordResetRedemptionError> for PasswordResetRedemptionErrorResponse {
    fn from(value: PasswordResetRedemptionError) -> Self {
        let message = value.message().to_string();
        Self { kind: value, success: false, message }
    }
}

impl From<errors::AnyhowError> for PasswordResetRedemptionErrorResponse {
    fn from(value: errors::AnyhowError) -> Self {
        log::error!("Internal error: {value}");
        let error = PasswordResetRedemptionError::Internal;
        let message = error.message().to_string();
        Self { kind: error, success: false, message }
    }
}

impl ResponseError for PasswordResetRedemptionErrorResponse {
    fn status_code(&self) -> StatusCode {
        self.kind.status_code()
    }

    fn error_response(&self) -> HttpResponse {
        let body = serde_json::to_string(self).unwrap_or_else(|_| {
            r#"{"success":false,"kind":"Internal","message":"An internal error occurred."}"#.to_string()
        });

        HttpResponse::build(self.status_code())
            .content_type("application/json")
            .body(body)
    }
}

pub async fn password_reset_redeem_handler(
    http_request: HttpRequest,
    request: web::Json<PasswordResetRedemptionRequest>,
    session_cookie_manager: web::Data<HttpUserSessionManager>,
    mysql_pool: web::Data<MySqlPool>,
) -> Result<HttpResponse, PasswordResetRedemptionErrorResponse> {

    let new_password = request.new_password.trim();

    if new_password != request.new_password_validation.trim() {
        return Err(PasswordResetRedemptionError::PasswordsDoNotMatch.into());
    }

    let result = lookup_password_reset_request(&request.reset_token, &mysql_pool).await
        .map_err(|err| {
            log::error!("Password reset error {:?}", err);
            err
        });

    let transaction_and_state = match result {
        Ok(Some(reset_state)) => reset_state,
        Ok(None) => {
            warn!("No such reset request.");
            return Err(PasswordResetRedemptionError::InvalidRedemption.into());
        }
        Err(err) => {
            error!("lookup error: {err}");
            return Err(PasswordResetRedemptionError::InvalidRedemption.into());
        }
    };

    let ip_address = get_request_ip(&http_request);

    let password_hash = match bcrypt_hash_password(new_password.to_string()) {
        Ok(hash) => hash,
        Err(err) => {
            error!("password hash error: {err}");
            return Err(PasswordResetRedemptionError::Internal.into());
        }
    };

    let result = change_password_from_password_reset(ChangePasswordFromPasswordResetArgs {
        password_reset_token: &transaction_and_state.reset_state.password_reset_token,
        user_token: &transaction_and_state.reset_state.user_token,
        new_password_hash: &password_hash,
        ip_address: &ip_address,
        mysql_transaction: transaction_and_state.transaction,
    }).await;

    if let Err(err) = result {
        error!("password reset error: {err}");
        return Err(PasswordResetRedemptionError::Internal.into());
    }

    let create_session_result =
        create_user_session(&transaction_and_state.reset_state.user_token.0, &ip_address, &mysql_pool).await;

    let session_token = match create_session_result {
        Ok(token) => token,
        Err(err) => {
            error!("error creating session: {err}");
            return Err(PasswordResetRedemptionError::Internal.into());
        }
    };

    let session_token = UserSessionToken::new_from_str(&session_token);

    let session_cookie = match session_cookie_manager.create_cookie(&session_token, &transaction_and_state.reset_state.user_token) {
        Ok(cookie) => cookie,
        Err(err) => {
            error!("error creating session cookie: {err}");
            return Err(PasswordResetRedemptionError::Internal.into());
        },
    };

    let signed_session = match session_cookie_manager.encode_session_payload(&session_token, &transaction_and_state.reset_state.user_token) {
        Ok(payload) => payload,
        Err(err) => {
            error!("error creating session payload: {err}");
            return Err(PasswordResetRedemptionError::Internal.into());
        },
    };

    let response = PasswordResetRedemptionResponse {
        success: true,
        signed_session,
    };

    let body = serde_json::to_string(&response)
        .map_err(|e| {
            error!("error returning response: {:?}",  e);
            PasswordResetRedemptionError::Internal
        })?;

    Ok(HttpResponse::Ok()
        .cookie(session_cookie)
        .content_type("application/json")
        .body(body))
}
