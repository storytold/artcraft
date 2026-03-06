// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use crate::queries::users::user::create::create_account_error::CreateAccountError;
use crate::queries::users::user::create::create_account_generic::{create_account_generic, GenericCreateAccountArgs};
use crate::utils::transactor::Transactor;
use enums::by_table::users::user_signup_method::UserSignupMethod;
use enums::by_table::users::user_signup_source::UserSignupSource;
use tokens::tokens::users::UserToken;

/// SSO accounts do not have passwords at account creation
/// The password hash field is nullable, so we can't leave it null/empty.
const SSO_PASSWORD : &str = "*";

pub struct CreateAccountFromGoogleSsoArgs<'a> {
  pub username: &'a str,
  pub display_name: &'a str,

  pub email_address: &'a str,
  pub email_gravatar_hash: &'a str,
  pub email_confirmed_by_google: bool,

  pub ip_address: &'a str,
  pub maybe_source: Option<UserSignupSource>,

  /// Comma separated string of feature flags.
  pub maybe_feature_flags: Option<&'a str>,
}

pub async fn create_account_from_google_sso(
  args: CreateAccountFromGoogleSsoArgs<'_>,
  transactor: Transactor<'_, '_>,
) -> Result<UserToken, CreateAccountError>
{
  let result= create_account_generic(
    GenericCreateAccountArgs {
      maybe_signup_method: Some(UserSignupMethod::GoogleSignIn),

      username: args.username,
      display_name: args.display_name,
      ip_address: args.ip_address,
      maybe_feature_flags: args.maybe_feature_flags,
      maybe_source: args.maybe_source,

      // SSO accounts have an email reported from Google
      email_address: args.email_address,
      email_gravatar_hash: args.email_gravatar_hash,
      email_confirmed_by_google: args.email_confirmed_by_google,

      // User-created accounts in this flow have randomly generated usernames
      username_is_generated: true,
      username_is_not_customized: true,

      // SSO accounts start without a password
      password_hash: SSO_PASSWORD,
      is_without_password: true,

      // TODO: Necessary? We're not doing SSO for now.
      maybe_referral_url: None,

      // NB: This is just for testing.
      maybe_user_token: None,

      // These flags represent eagerly created users and are false for this flow
      is_temporary: false,
      email_is_synthetic: false,
      was_eagerly_provisioned: false,
    },
    transactor,
  ).await?;

  Ok(result.user_token)
}
