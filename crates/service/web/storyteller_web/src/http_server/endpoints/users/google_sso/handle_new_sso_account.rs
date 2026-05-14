use crate::http_server::endpoints::users::google_sso::google_sso_handler::GoogleCreateAccountErrorResponse;
use crate::http_server::endpoints::users::google_sso::handle_new_sso_account_for_existing_user::{handle_new_sso_account_for_existing_user, LinkArgs};
use crate::http_server::endpoints::users::google_sso::handle_new_sso_account_for_new_user::{handle_new_sso_account_for_new_user, CreateArgs};
use crate::util::canonicalize_email_for_users_table::canonicalize_email_for_users_table;
use actix_web::HttpRequest;
use google_sign_in::claims::claims::Claims;
use log::warn;
use mysql_queries::queries::users::user::get::lookup_user_for_login_by_email_with_transactor::lookup_user_for_login_by_email_with_transactor;
use mysql_queries::utils::transactor::Transactor;
use sqlx::pool::PoolConnection;
use sqlx::MySql;
use tokens::tokens::users::UserToken;

pub struct NewSsoArgs<'a> {
  pub http_request: &'a HttpRequest,
  pub claims: Claims,
  pub claims_subject: &'a str,
  pub claims_email_address: &'a str,
  pub mysql_connection: &'a mut PoolConnection<MySql>,
  pub maybe_referral_url: Option<String>,
  pub maybe_landing_url: Option<String>,
  pub maybe_referral_partner: Option<String>,
  pub maybe_referral_user_token: Option<UserToken>,
}

pub struct NewSsoAccountInfo {
  pub user_token: UserToken,
  pub user_display_name: String,
  pub username_is_not_customized: bool,
  pub is_new_account: bool,
}

pub async fn handle_new_sso_account(
  args: NewSsoArgs<'_>
)
  -> Result<NewSsoAccountInfo, GoogleCreateAccountErrorResponse>
{
  // NB: We use this routine to "normalize" email addresses in the user table.
  // It won't necessarily match the email address in the Google claims.
  // A better normalization function in the future may handle dots and plus
  // signs in Gmail addresses, for instance.
  let user_email_address = canonicalize_email_for_users_table(&args.claims_email_address);

  let maybe_user_account =
      lookup_user_for_login_by_email_with_transactor(&user_email_address, Transactor::for_connection(args.mysql_connection))
          .await
          .map_err(|err| {
            warn!("error looking up user by email: {:?}", err);
            GoogleCreateAccountErrorResponse::server_error()
          })?;

  match maybe_user_account {
    Some(user_account) => {
      handle_new_sso_account_for_existing_user(LinkArgs {
        http_request: args.http_request,
        claims: args.claims,
        claims_subject: args.claims_subject,
        claims_email_address: &args.claims_email_address,
        user_account,
        mysql_connection: args.mysql_connection,
      }).await
    },
    None => {
      handle_new_sso_account_for_new_user(CreateArgs {
        http_request: args.http_request,
        claims: args.claims,
        claims_subject: args.claims_subject,
        claims_email_address: &args.claims_email_address,
        user_email_address: &user_email_address,
        mysql_connection: args.mysql_connection,
        maybe_referral_url: args.maybe_referral_url,
        maybe_landing_url: args.maybe_landing_url,
        maybe_referral_partner: args.maybe_referral_partner,
        maybe_referral_user_token: args.maybe_referral_user_token,
      }).await
    },
  }
}
