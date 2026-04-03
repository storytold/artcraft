// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use crate::queries::users::user::create::create_account_error::CreateAccountError;
use crate::queries::users::user::create::create_account_generic::{create_account_generic, GenericCreateAccountArgs};
use crate::utils::transactor::Transactor;
use enums::by_table::users::user_signup_method::UserSignupMethod;
use enums::by_table::users::user_signup_source::UserSignupSource;
use sqlx::MySqlPool;
use tokens::tokens::users::UserToken;

pub struct CreateAccountFromEmailPasswordArgs<'a> {
  pub username: &'a str,
  pub display_name: &'a str,
  pub email_address: &'a str,
  pub email_gravatar_hash: &'a str,
  pub password_hash: &'a str,
  pub ip_address: &'a str,
  pub maybe_source: Option<UserSignupSource>,

  /// The referral URL the user arrived from when signing up.
  /// The browser can send `document.referrer` to the backend so we know how people are finding us.
  /// If the browser doesn't send this parameter, we'll try the `referer` header.
  pub maybe_referral_url: Option<String>,

  /// The URL where the user landed when they first arrived, prior to navigation and signing up.
  /// We can grab this from `window.location.href`.
  pub maybe_landing_url: Option<String>,

  /// In production code, send this as `None`.
  /// Only provide an external user token for db integration tests and db seeding tools.
  /// This allows for knowing the user token a priori.
  pub maybe_user_token: Option<&'a UserToken>,
}

pub struct CreateAccountSuccessResult {
  pub user_token: UserToken,
  pub user_id: u64,
}


pub async fn create_account_from_email_and_password(
  mysql_pool: &MySqlPool,
  args: CreateAccountFromEmailPasswordArgs<'_>,
) -> Result<CreateAccountSuccessResult, CreateAccountError>
{
  let result= create_account_generic(
    GenericCreateAccountArgs {
      maybe_signup_method: Some(UserSignupMethod::EmailPassword),

      username: args.username,
      display_name: args.display_name,

      ip_address: args.ip_address,

      maybe_feature_flags: None,
      maybe_source: args.maybe_source,

      // Email+Password accounts do not yet have confirmed emails
      email_address: args.email_address,
      email_gravatar_hash: args.email_gravatar_hash,
      email_confirmed_by_google: false,

      // User-created accounts in this flow have custom usernames
      username_is_generated: false,
      username_is_not_customized: false,

      // Email+Password accounts have passwords (of course)
      password_hash: args.password_hash,
      is_without_password: false,

      maybe_referral_url: args.maybe_referral_url,
      maybe_landing_url: args.maybe_landing_url,

      // NB: This is just for testing.
      maybe_user_token: args.maybe_user_token,

      // These flags represent eagerly created users and are false for this flow
      is_temporary: false,
      email_is_synthetic: false,
      was_eagerly_provisioned: false,
    },
    Transactor::for_pool(mysql_pool),
  ).await?;

  Ok(CreateAccountSuccessResult {
    user_token: result.user_token,
    user_id: result.user_id,
  })
}
