use crate::http_server::common_responses::common_web_error::CommonWebError;
use actix_web::HttpRequest;
use google_sign_in::claims::claims::Claims;
use http_server_common::request::get_request_ip::get_request_ip;
use log::warn;
use mysql_queries::queries::google_sign_in_accounts::get_google_sign_in_account_by_subject::GoogleSignInAccount;
use mysql_queries::queries::google_sign_in_accounts::update_google_sign_in_account::{update_google_sign_in_account, UpdateGoogleSignInArgs};
use mysql_queries::utils::transactor::Transactor;
use sqlx::pool::PoolConnection;
use sqlx::MySql;
use tokens::tokens::users::UserToken;

pub struct ExistingAccountArgs<'a> {
  pub http_request: &'a HttpRequest,
  pub sso_account: &'a GoogleSignInAccount,
  pub claims: Claims,
  pub claims_email_address: &'a str,
  pub mysql_connection: &'a mut PoolConnection<MySql>,
}

pub async fn handle_existing_sso_account(
  args: ExistingAccountArgs<'_>
)
  -> Result<UserToken, CommonWebError>
{
  let user_token = match &args.sso_account.maybe_user_token {
    Some(token) => token.clone(),
    None => {
      // NB: If accounts get into this state (e.g. if we support de-linking), we'll need to
      // consider how to migrate accounts and handle all the various account states.
      // For now, we'll just deny this possibility. It should not happen.
      warn!("no user token for existing google sign in account!");
      return Err(CommonWebError::server_error_with_message(
        "no user token for existing google sign in account",
      ));
    },
  };

  if should_update_sso_claims(args.sso_account, &args.claims) {
    let ip_address = get_request_ip(args.http_request);

    let result = update_google_sign_in_account(UpdateGoogleSignInArgs {
      subject: &args.sso_account.subject,
      email_address: args.claims_email_address,
      is_email_verified: args.claims.email_verified(),
      maybe_locale: args.claims.locale(),
      maybe_name: args.claims.name(),
      maybe_given_name: args.claims.given_name(),
      maybe_family_name: args.claims.family_name(),
      creator_ip_address: &ip_address,
      transactor: Transactor::for_connection(args.mysql_connection),
    }).await;

    if let Err(err) = result {
      // NB: Fail open.
      warn!("error updating google sign in account (failing open): {:?}", err);
    };
  }

  Ok(user_token)
}

fn should_update_sso_claims(sso_account: &GoogleSignInAccount, claims: &Claims) -> bool {
  sso_account.email_address.as_deref() != claims.email()
      || sso_account.is_email_verified != claims.email_verified()
      || sso_account.maybe_locale.as_deref() != claims.locale()
      || sso_account.maybe_name.as_deref() != claims.name()
      || sso_account.maybe_given_name.as_deref() != claims.given_name()
      || sso_account.maybe_family_name.as_deref() != claims.family_name()
}
