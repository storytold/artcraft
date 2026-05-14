use crate::http_server::endpoints::users::google_sso::google_sso_handler::GoogleCreateAccountErrorResponse;
use crate::http_server::endpoints::users::google_sso::handle_new_sso_account::NewSsoAccountInfo;
pub use actix_web::HttpRequest;
use google_sign_in::claims::claims::Claims;
use http_server_common::request::get_request_ip::get_request_ip;
use log::warn;
use mysql_queries::queries::google_sign_in_accounts::insert_google_sign_in_account::{insert_google_sign_in_account, InsertGoogleSignInArgs};
use mysql_queries::queries::users::user::get::lookup_user_for_login_result::UserRecordForLogin;
use sqlx::pool::PoolConnection;
use sqlx::{Acquire, MySql};

pub struct LinkArgs<'a> {
  pub http_request: &'a HttpRequest,
  pub claims: Claims,
  pub claims_subject: &'a str,
  pub claims_email_address: &'a str,
  pub user_account: UserRecordForLogin,
  pub mysql_connection: &'a mut PoolConnection<MySql>,
}
pub async fn handle_new_sso_account_for_existing_user(
  args: LinkArgs<'_>
)
  -> Result<NewSsoAccountInfo, GoogleCreateAccountErrorResponse>
{
  let mut transaction = args.mysql_connection.begin()
      .await
      .map_err(|e| {
        warn!("Could not begin transaction: {:?}", e);
        GoogleCreateAccountErrorResponse::server_error()
      })?;

  let ip_address = get_request_ip(&args.http_request);

  let _token = insert_google_sign_in_account(InsertGoogleSignInArgs {
    subject: args.claims_subject,
    maybe_user_token: Some(&args.user_account.token),
    email_address: args.claims_email_address,
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
    user_token: args.user_account.token,
    user_display_name: args.user_account.display_name,
    username_is_not_customized: args.user_account.username_is_not_customized,
    is_new_account: false,
  })
}
