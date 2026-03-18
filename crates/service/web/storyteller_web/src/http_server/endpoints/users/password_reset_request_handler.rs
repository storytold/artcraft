use std::fmt::Display;
use std::sync::Arc;
use actix_web::http::StatusCode;
use actix_web::{web, HttpRequest, HttpResponse, ResponseError};
use log::{error, info, warn};
use serde::Deserialize;
use sqlx::MySqlPool;
use strum_macros::Display;

use crockford::crockford_entropy_lower;
use enums::by_table::email_sender_jobs::email_category::EmailCategory;
use http_server_common::request::get_request_ip::get_request_ip;
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use uuid_utils::uuid::generate_random_uuid;
use mysql_queries::payloads::email_sender_jobs::email_sender_job_args::{EmailSenderJobArgs, PolymorphicEmailSenderJobArgs};
use mysql_queries::payloads::email_sender_jobs::subtypes::email_job_password_reset_args::EmailJobPasswordResetArgs;
use mysql_queries::queries::email_sender_jobs::insert_email_sender_job::{insert_email_sender_job, InsertEmailSenderJobArgs};
use mysql_queries::queries::users::user::get::lookup_user_for_login_by_email::lookup_user_for_login_by_email;
use mysql_queries::queries::users::user::get::lookup_user_for_login_by_username::lookup_user_for_login_by_username;
use mysql_queries::queries::users::user_password_resets::create_password_reset_request::create_password_reset;
use server_environment::ServerEnvironment;
use crate::email::send_password_reset_email::{send_password_reset_email, SendPasswordResetEmailArgs};
use crate::http_server::requests::get_request_domain_branding::{get_request_domain_branding, DomainBranding};
use crate::state::server_state::ServerState;

#[derive(Deserialize)]
pub struct PasswordResetRequestedRequest {
    username_or_email: String,
}

#[derive(Serialize)]
pub struct PasswordResetRequestedResponse {
    success: bool,
}

#[derive(Serialize, Debug, Display)]
pub enum PasswordResetRequestedRequestError {
    NoSuchUser,
    Internal,
}

#[derive(Serialize, Debug)]
pub struct PasswordResetRequestedErrorResponse {
    success: bool,
    kind: PasswordResetRequestedRequestError,
}
impl Display for PasswordResetRequestedErrorResponse {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{:?}", self)
    }
}

impl From<PasswordResetRequestedRequestError> for PasswordResetRequestedErrorResponse {
    fn from(value: PasswordResetRequestedRequestError) -> Self {
        Self { kind: value, success: false }
    }
}
impl From<errors::AnyhowError> for PasswordResetRequestedErrorResponse {
    fn from(value: errors::AnyhowError) -> Self {
        log::error!("Internal error: {value}");
        Self { kind: PasswordResetRequestedRequestError::Internal, success: false }
    }
}

impl ResponseError for PasswordResetRequestedErrorResponse {
    //TODO: Yknow, clean this up and stuff
    fn status_code(&self) -> StatusCode {
        StatusCode::INTERNAL_SERVER_ERROR
    }
  
    fn error_response(&self) -> HttpResponse {
        serialize_as_json_error(self)
    }
  }

/// 
/// Non-authenticated!
/// 
/// - create password reset request
///     - sends email?
///     - inserts record and stuff
pub async fn password_reset_request_handler(
    http_request: HttpRequest,
    request: web::Json<PasswordResetRequestedRequest>,
    mysql_pool: web::Data<MySqlPool>,
    server_environment: web::Data<ServerEnvironment>,
    server_state: web::Data<Arc<ServerState>>,
) -> Result<HttpResponse, PasswordResetRequestedErrorResponse> {

    let username_or_email = request.username_or_email.trim();

    // TODO(bt,2023-11-12): I need to prevent user lookup attacks.
    let maybe_user = if username_or_email.contains("@") {
        lookup_user_for_login_by_email(&username_or_email, &mysql_pool).await
    } else {
        lookup_user_for_login_by_username(&username_or_email, &mysql_pool).await
    }.map_err(|e| {
        warn!("Password reset user lookup error: {:?}", e);
        PasswordResetRequestedRequestError::NoSuchUser
    })?;

    let user = match maybe_user {
        Some(user) => user,
        None => {
            // NB: Don't let the user know if the account exists. This is to prevent
            // user lookup attacks.
            return success_response();
        }
    };

    let secret_key = crockford_entropy_lower(32);

    // TODO(bt,2023-11-15): Handle banned users, they shouldn't be able to do this

    // TODO(bt,2023-11-15): AVT cookie
    //let maybe_avt_token = server_state.avt_cookie_manager.get_avt_token_from_request(&http_request);

    let ip_address = get_request_ip(&http_request);

    create_password_reset(&mysql_pool, &user, &ip_address, secret_key.clone()).await
        .map_err(|err| {
            log::error!("Error creating password reset: {err}");
            PasswordResetRequestedRequestError::Internal
        })?;

    let uuid_idempotency_token = generate_random_uuid();

    // TODO(bt,2023-11-15): i18n
    let ietf_language_tag = "en";
    let ietf_primary_language_subtag = "en";

    insert_email_sender_job(InsertEmailSenderJobArgs {
        uuid_idempotency_token: &uuid_idempotency_token,
        destination_email_address: &user.email_address,
        maybe_destination_user_token: Some(&user.token),
        email_category: EmailCategory::PasswordReset,
        maybe_email_args: Some(EmailSenderJobArgs {
            args: Some(PolymorphicEmailSenderJobArgs::Pr(EmailJobPasswordResetArgs {
                password_reset_secret_key: Some(secret_key.clone()),
            })),
        }),
        ietf_language_tag,
        ietf_primary_language_subtag,
        maybe_creator_user_token: None,
        maybe_avt_token: None,
        creator_ip_address: &ip_address,
        priority_level: 1,
        is_debug_request: false,
        maybe_routing_tag: None,
        mysql_pool: &mysql_pool,
    })
        .await
        .map_err(|err| {
            log::error!("Error inserting email job: {err}");
            PasswordResetRequestedRequestError::Internal
        })?;

    let domain_branding = get_request_domain_branding(&http_request)
        .unwrap_or(DomainBranding::GetArtCraft);

    let server_environment = **server_environment;

    info!("Sending password reset email...");

    send_password_reset_email(SendPasswordResetEmailArgs {
        email_address_destination: &user.email_address,
        verification_token: &secret_key,
        resend_api_key: &server_state.resend.api_key,
        server_environment,
        domain_branding,
    }).await?;

    success_response()
}

fn success_response() -> Result<HttpResponse, PasswordResetRequestedErrorResponse> {
    let response = PasswordResetRequestedResponse {
        success: true,
    };

    let body = serde_json::to_string(&response)
        .map_err(|e| {
            error!("error returning response: {:?}",  e);
            PasswordResetRequestedRequestError::Internal
        })?;

    Ok(HttpResponse::Ok()
        .content_type("application/json")
        .body(body))
}
