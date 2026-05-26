// NB: Incrementally getting rid of build warnings...
//#![forbid(unused_imports)]
//#![forbid(unused_mut)]
//#![forbid(unused_variables)]

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::users::google_sso::check_claims::check_claims;
use crate::http_server::endpoints::users::google_sso::handle_existing_sso_account::{handle_existing_sso_account, ExistingAccountArgs};
use crate::http_server::endpoints::users::google_sso::handle_new_sso_account::{handle_new_sso_account, NewSsoArgs};
use crate::state::certs::google_sign_in_cert::GoogleSignInCert;
use crate::util::lookup::resolve_referral_info::resolve_referral_info;
use actix_artcraft::sessions::user_sessions::http_user_session_manager::HttpUserSessionManager;
use actix_web::web::{Data, Json};
use actix_web::{HttpRequest, HttpResponse};
use http_server_common::request::get_request_ip::get_request_ip;
use log::{info, warn};
use mysql_queries::queries::google_sign_in_accounts::get_google_sign_in_account_by_subject::get_google_sign_in_account;
use mysql_queries::queries::user_referrals::insert_user_referral::{insert_user_referral, InsertUserReferralArgs};
use mysql_queries::queries::users::user_sessions::create_user_session_with_transactor::create_user_session_with_transactor;
use mysql_queries::utils::transactor::Transactor;
use sqlx::{Acquire, MySqlPool};
use tokens::tokens::user_sessions::UserSessionToken;
use tokens::tokens::users::UserToken;
use utoipa::ToSchema;
/* ALGORITHM
--> [SSO RECORD LOOKUP]
  --> I. SSO Record Exists
      --> [LOGIN DIRECTLY]

          This should be the simple case. We assume it is linked to a valid
          users table record / account.

          Potential Problems:
          - If Google user changes their Google SSO email
          - If we let our users change their email or unlink accounts
          - If user signs up with a new, non-canonical variant of their email address

  --> II. SSO Record Does Not Exist
    --> [USER RECORD LOOKUP BY EMAIL]
      --> IIA. User Record Does Not Exist
        --> [CREATE NEW (1) SSO ACCOUNT AND (2) USER RECORDS, LOGIN]

            Potential Problems:
            - If the user already had an account with a non-canonical variant

      --> IIB. User Record Exists
        --> [CREATE SSO RECORD, LINK USER RECORD, LOGIN]

            Potential Problems:
            - If the email is not a Gmail account, we need to confirm the password.
            - If the user already had an account (or accounts) with a non-canonical
              variant, we can't detect/link it. We might create a duplicate account
              or link the "wrong" / undesired account.

 Notes on non-canonical email addresses:

   - Email addresses may not 1:1 match user accounts.

   - Our "canonicalization" is simply trimming and lower-casing the email.
     This may not even be correct in an i18n context with certain character sets.

   - Google emails treat period (.) and everything after a plus (+) specially. This
     is a broad topic, but it could essentially enable users to create unlimited email
     addresses from one Google account.

   - Other email providers may behave weirdly with their own canonicalization schemes.

 TODO:
  - Store all the claims info
  - Verify all paths (including legacy sign up paths)

 Decisions:
  - Should we store canonical emails? --> No, you can create more than one account per gmail.
 */

#[derive(ToSchema, Deserialize)]
pub struct GoogleCreateAccountRequest {
  pub google_credential: String,

  /// Optional: The referral URL the user arrived from when first hitting the site.
  /// The browser can send `document.referrer` to the backend.
  /// If not provided, we'll try the `referer` header.
  pub maybe_referral_url: Option<String>,

  /// Optional: The URL where the user landed when they first arrived.
  /// The browser can send `window.location.href`.
  pub maybe_landing_url: Option<String>,

  /// Optional: A referral username or code from a referring user.
  pub maybe_referral_username: Option<String>,

  /// Optional: A referral code created by another user. If present, takes priority over
  /// `maybe_referral_username` for resolving the referring user.
  pub maybe_referral_code: Option<String>,
}

#[derive(ToSchema, Serialize)]
pub struct GoogleCreateAccountSuccessResponse {
  pub success: bool,

  /// A signed session that can be sent as a header, bypassing cookies.
  /// This is useful for API clients that don't support cookies or Google
  /// browsers killing cross-domain cookies.
  pub signed_session: String,

  /// If the username was automatically generated and not yet customized,
  /// this will report true. We should show the user a dialogue to change
  /// their username.
  pub username_not_yet_customized: bool,

  /// The user's display username. If we want to present a username
  /// customization flow, we can use this to prevent another round trip.
  pub maybe_user_display_name: Option<String>,
}

/// Sign in or sign up with "Sign in with Google" credentials.
/// This supports both sign up for new users and sign in for existing users.
#[utoipa::path(
  post,
  tag = "Users",
  path = "/v1/accounts/google_sso",
  responses(
    (status = 200, description = "Success", body = GoogleCreateAccountSuccessResponse),
    (status = 400, description = "Bad input", body = CommonWebError),
    (status = 401, description = "Not authorized", body = CommonWebError),
    (status = 500, description = "Server error", body = CommonWebError),
  ),
  params(
    ("request" = GoogleCreateAccountRequest, description = "Payload for Request"),
  )
)]
pub async fn google_sso_handler(
  http_request: HttpRequest,
  request: Json<GoogleCreateAccountRequest>,
  mysql_pool: Data<MySqlPool>,
  session_cookie_manager: Data<HttpUserSessionManager>,
  google_sign_in_cert: Data<GoogleSignInCert>,
) -> Result<HttpResponse, CommonWebError>
{
  let claims = check_claims(&request, &google_sign_in_cert).await?;

  info!("Google JWT credential claims: email {:?}, verified: {}",
    claims.email(),
    claims.email_verified());

  let claims_subject = claims.subject()
      .map(|s| s.to_string())
      .ok_or_else(|| {
        warn!("no subject in google claims");
        CommonWebError::BadInputWithSimpleMessage("no subject in google claims".to_string())
      })?;

  let claims_email_address = claims.email()
      .map(|email| email.to_string())
      .ok_or_else(|| {
        warn!("no email address in google claims");
        CommonWebError::BadInputWithSimpleMessage("no email address in google claims".to_string())
      })?;

  let mut mysql_connection = mysql_pool.acquire()
      .await
      .map_err(|e| {
        warn!("Could not acquire DB pool: {:?}", e);
        CommonWebError::from_error(e)
      })?;

  let maybe_sso_account = get_google_sign_in_account(&claims_subject, &mut *mysql_connection)
      .await
      .map_err(|err| {
        warn!("error getting google sign in account: {:?}", err);
        CommonWebError::from_anyhow_error(err)
      })?;

  let user_token;
  let maybe_user_display_name;
  let username_not_yet_customized;

  match maybe_sso_account {
    Some(sso_account) => {
      let existing_user_token = handle_existing_sso_account(ExistingAccountArgs {
        http_request: &http_request,
        sso_account: &sso_account,
        claims,
        claims_email_address: &claims_email_address,
        mysql_connection: &mut mysql_connection,
      }).await?;

      user_token = existing_user_token;
      maybe_user_display_name = sso_account.maybe_user_display_name.clone();
      username_not_yet_customized = false;
    },
    None => {
      let maybe_referral_url = request.maybe_referral_url.clone()
        .or_else(|| {
          http_request.headers().get("referer")
            .and_then(|v| v.to_str().ok())
            .map(|s| s.to_string())
        });

      let maybe_landing_url = request.maybe_landing_url.clone();

      // Resolve referral info from code (preferred) or username (fallback).
      let referral_info = resolve_referral_info(
        request.maybe_referral_code.as_deref(),
        request.maybe_referral_username.as_deref(),
        &mut mysql_connection,
      ).await;

      let result = handle_new_sso_account(NewSsoArgs {
        http_request: &http_request,
        claims,
        claims_subject: &claims_subject,
        claims_email_address: &claims_email_address,
        mysql_connection: &mut mysql_connection,
        maybe_referral_url: maybe_referral_url.clone(),
        maybe_landing_url: maybe_landing_url.clone(),
        maybe_referral_partner: referral_info.maybe_referral_partner,
        maybe_referral_user_token: referral_info.maybe_referral_user_token.clone(),
      }).await?;

      // Record the referral relationship if this is a genuinely new account.
      if result.is_new_account {
        if let Some(referrer_user_token) = &referral_info.maybe_referral_user_token {
          if let Err(err) = insert_user_referral(
            InsertUserReferralArgs {
              invited_user_token: &result.user_token,
              referrer_user_token,
              maybe_referral_code_token: referral_info.maybe_referral_code_token.as_ref(),
              maybe_referral_url: maybe_referral_url.as_deref(),
              maybe_landing_url: maybe_landing_url.as_deref(),
            },
            &mut *mysql_connection,
          ).await {
            warn!("Failed to insert user_referral record (continuing): {:?}", err);
          }
        }
      }

      user_token = result.user_token;
      maybe_user_display_name = Some(result.user_display_name);
      username_not_yet_customized = result.username_is_not_customized;
    },
  }

  let ip_address = get_request_ip(&http_request);

  let session_token = create_user_session_with_transactor(
    &user_token,
    &ip_address,
    Transactor::for_connection(&mut mysql_connection))
      .await
      .map_err(|e| {
        warn!("error creating user session: {:?}", e);
        CommonWebError::from_anyhow_error(e)
      })?;

  info!("new user session created");

  //firehose_publisher.publish_user_sign_up(new_user_data.user_token.as_str())
  //    .await
  //    .map_err(|e| {
  //      warn!("error publishing event: {:?}", e);
  //      CreateAccountErrorResponse::server_error()
  //    })?;

  construct_http_response(
    &session_cookie_manager,
    &session_token,
    &user_token,
    maybe_user_display_name,
    username_not_yet_customized,
  )
}

pub fn construct_http_response(
  session_cookie_manager: &HttpUserSessionManager,
  session_token: &UserSessionToken,
  user_token: &UserToken,
  maybe_user_display_name: Option<String>,
  username_not_yet_customized: bool,
) -> Result<HttpResponse, CommonWebError> {

  let session_cookie = match session_cookie_manager.create_cookie(&session_token, &user_token) {
    Ok(cookie) => cookie,
    Err(err) => return Err(CommonWebError::from_error(err)),
  };

  let signed_session = match session_cookie_manager.encode_session_payload(&session_token, &user_token) {
    Ok(payload) => payload,
    Err(err) => return Err(CommonWebError::from_error(err)),
  };

  let response = GoogleCreateAccountSuccessResponse {
    success: true,
    signed_session,
    username_not_yet_customized,
    maybe_user_display_name,
  };

  let body = serde_json::to_string(&response)?;

  Ok(HttpResponse::Ok()
      .cookie(session_cookie)
      .content_type("application/json")
      .body(body))
}
