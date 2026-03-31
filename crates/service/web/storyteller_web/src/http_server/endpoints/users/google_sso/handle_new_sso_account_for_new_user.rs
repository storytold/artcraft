use crate::http_server::endpoints::users::google_sso::google_sso_handler::GoogleCreateAccountErrorResponse;
use crate::http_server::endpoints::users::google_sso::handle_new_sso_account::NewSsoAccountInfo;
use crate::http_server::session::lookup::user_session_feature_flags::UserSessionFeatureFlags;
use actix_artcraft::requests::get_request_signup_source_enum::get_request_signup_source_enum;
use actix_web::HttpRequest;
use enums::by_table::users::user_feature_flag::UserFeatureFlag;
use google_sign_in::claims::claims::Claims;
use http_server_common::request::get_request_ip::get_request_ip;
use log::{error, info, warn};
use mysql_queries::queries::google_sign_in_accounts::insert_google_sign_in_account::{insert_google_sign_in_account, InsertGoogleSignInArgs};
use mysql_queries::queries::users::user::create::create_account_error::CreateAccountError;
use mysql_queries::queries::users::user::create::create_account_from_google_sso::{create_account_from_google_sso, CreateAccountFromGoogleSsoArgs};
use mysql_queries::utils::transactor::Transactor;
use sqlx::pool::PoolConnection;
use sqlx::{Acquire, MySql};
use users::email::email_to_gravatar_hash::email_to_gravatar_hash;
use users::username::generate_random_username::generate_random_username;

pub struct CreateArgs<'a> {
  pub http_request: &'a HttpRequest,
  pub claims: Claims,
  pub claims_subject: &'a str,
  pub claims_email_address: &'a str,
  pub user_email_address: &'a str,
  pub mysql_connection: &'a mut PoolConnection<MySql>,
}
pub async fn handle_new_sso_account_for_new_user(
  args: CreateArgs<'_>
)
  -> Result<NewSsoAccountInfo, GoogleCreateAccountErrorResponse>
{
  let mut transaction = args.mysql_connection.begin()
      .await
      .map_err(|e| {
        warn!("Could not begin transaction: {:?}", e);
        GoogleCreateAccountErrorResponse::server_error()
      })?;

  // Enroll users in studio temporarily.
  let user_feature_flags = studio_feature_flags();

  let ip_address = get_request_ip(&args.http_request);
  let user_email_gravatar_hash = email_to_gravatar_hash(&args.user_email_address);

  let mut maybe_source = get_request_signup_source_enum(&args.http_request);

  let mut maybe_user_token = None;
  let mut maybe_user_display_name = None;

  for _ in 0..5 {
    // NB: We try a few times to make sure we don't hit a username collision.
    let display_name = generate_random_username();
    let username = display_name.trim().to_lowercase();

    info!("generated username: {}", username);

    let result = create_account_from_google_sso(
      CreateAccountFromGoogleSsoArgs {
        username: &username,
        display_name: &display_name,
        email_address: &args.user_email_address,
        email_gravatar_hash: &user_email_gravatar_hash,
        email_confirmed_by_google: args.claims.email_verified(),
        maybe_feature_flags: user_feature_flags.as_deref(),
        ip_address: &ip_address,
        maybe_source,
      },
      Transactor::for_transaction(&mut transaction),
    ).await;

    match result {
      Ok(token) => {
        maybe_user_token = Some(token);
        maybe_user_display_name = Some(display_name);
        break;
      },
      Err(CreateAccountError::UsernameIsTaken) => {
        continue; // NB: We'll try again with a new username.
      },
      Err(err) => {
        warn!("error creating account from google sso: {:?}", err);
        return Err(GoogleCreateAccountErrorResponse::server_error());
      },
    }
  }

  let user_token = maybe_user_token.ok_or_else(|| {
    error!("no username without collision after several tries (token)");
    GoogleCreateAccountErrorResponse::server_error()
  })?;

  let user_display_name = maybe_user_display_name.ok_or_else(|| {
    error!("no username without collision after several tries (display name)");
    GoogleCreateAccountErrorResponse::server_error()
  })?;

  let _token = insert_google_sign_in_account(InsertGoogleSignInArgs {
    subject: args.claims_subject,
    maybe_user_token: Some(&user_token),
    email_address: &args.claims_email_address, // NB: The one from the Google claims, not our canonicalized one.
    is_email_verified: args.claims.email_verified(),
    maybe_locale: args.claims.locale(),
    maybe_name: args.claims.name(),
    maybe_given_name: args.claims.given_name(),
    maybe_family_name: args.claims.family_name(),
    creator_ip_address: &ip_address,
    transaction: &mut transaction,
  }).await.map_err(|err| {
    warn!("error inserting google sign in account: {:?}", err);
    GoogleCreateAccountErrorResponse::server_error()
  })?;

  transaction.commit()
      .await
      .map_err(|e| {
        warn!("Could not commit transaction: {:?}", e);
        GoogleCreateAccountErrorResponse::server_error()
      })?;

  Ok(NewSsoAccountInfo {
    user_token,
    user_display_name,
    username_is_not_customized: true, // New account with random username
  })
}

fn studio_feature_flags() -> Option<String> {
  let mut user_feature_flags = UserSessionFeatureFlags::empty();

  user_feature_flags.add_flags([
    UserFeatureFlag::Studio,
    UserFeatureFlag::VideoStyleTransfer,
  ]);

  let user_feature_flags = user_feature_flags
      .maybe_serialize_string();

  user_feature_flags
}
