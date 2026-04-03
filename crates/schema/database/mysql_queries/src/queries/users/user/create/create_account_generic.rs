// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use crate::queries::users::user::create::create_account_error::CreateAccountError;
use crate::utils::transactor::Transactor;
use enums::by_table::users::user_signup_method::UserSignupMethod;
use enums::by_table::users::user_signup_source::UserSignupSource;
use log::warn;
use sqlx::error::Error::Database;
use tokens::tokens::users::UserToken;

pub struct GenericCreateAccountArgs<'a> {
  pub username: &'a str,
  pub display_name: &'a str,

  /// If we randomly generated the username
  pub username_is_generated: bool,

  /// If the user hasn't changed or "accepted" a randomly generated username
  pub username_is_not_customized: bool,

  pub email_address: &'a str,
  pub email_gravatar_hash: &'a str,

  /// Google did email IDV and told us it's legitimate.
  pub email_confirmed_by_google: bool,
  
  /// The email address is not real yet. We generated a fake/synthetic value 
  /// that will hopefully be replaced later. This is for automated user creation 
  /// flows, like Stripe Checkout onboarding flow.
  pub email_is_synthetic: bool,

  pub password_hash: &'a str,
  pub is_without_password: bool,
  
  /// This is initially TRUE for accounts that were provisioned automatically,
  /// without user intervention, e.g. in the eager Stripe Checkout onboarding 
  /// flow. Accounts in this state have not yet been customized by users and may
  /// not in fact represent real users if the users abandon the flow. Once the 
  /// user finishes setup, this will be set to false.
  /// 
  /// Existing and normal setup flow sets this flag to false.
  /// 
  /// If enough time has passed without the user interacting with the account, 
  /// then it might be prudent to delete these records.
  pub is_temporary: bool,
  
  /// Whether the account was created eagerly (e.g. via stripe checkout flow) 
  /// without the user explicitly setting up an account, choosing an email or 
  /// password, etc. (It's a technical choice to do faster checkout flow.)
  /// This is a permanent label on the account.
  pub was_eagerly_provisioned: bool,

  pub ip_address: &'a str,
  pub maybe_source: Option<UserSignupSource>,
  pub maybe_signup_method: Option<UserSignupMethod>,

  /// Comma separated string of feature flags.
  pub maybe_feature_flags: Option<&'a str>,

  /// The referral URL the user arrived from when signing up.
  /// The browser can send `document.referrer` to the backend so we know how people are finding us.
  /// If the browser doesn't send this parameter, we'll try the `referer` header.
  pub maybe_referral_url: Option<String>,

  /// The URL where the user landed when they first arrived, prior to navigation and signing up.
  /// The browser can send `window.location.href` to the backend so we know how people are finding us.
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

pub async fn create_account_generic(
  args: GenericCreateAccountArgs<'_>,
  transactor: Transactor<'_, '_>,
) -> Result<CreateAccountSuccessResult, CreateAccountError>
{
  const INITIAL_PROFILE_MARKDOWN : &str = "";
  const INITIAL_PROFILE_RENDERED_HTML : &str = "";
  const INITIAL_USER_ROLE: &str = "user";

  let maybe_referral_url = sanitize_optional_url(args.maybe_referral_url);
  let maybe_landing_url = sanitize_optional_url(args.maybe_landing_url);

  let user_token = match args.maybe_user_token {
    None => UserToken::generate(),
    Some(user_token) => user_token.clone(),
  };

  let query = sqlx::query!(
        r#"
INSERT INTO users
SET
  token = ?,
  
  is_temporary = ?,
  
  username = ?,
  display_name = ?,

  username_is_generated = ?,
  username_is_not_customized = ?,

  email_address = ?,
  email_gravatar_hash = ?,

  email_confirmed = FALSE,
  email_confirmed_by_google = ?,
  email_is_synthetic = ?,
  
  was_eagerly_provisioned = ?,

  profile_markdown = ?,
  profile_rendered_html = ?,
  user_role_slug = ?,

  password_hash = ?,
  is_without_password = ?,

  maybe_feature_flags = ?,

  ip_address_creation = ?,
  ip_address_last_login = ?,
  ip_address_last_update = ?,

  maybe_source = ?,

  maybe_signup_method = ?,

  maybe_referral_url = ?,
  maybe_landing_url = ?
        "#,
      user_token.as_str(),
    
      args.is_temporary,
    
      args.username,
      args.display_name,

      args.username_is_generated,
      args.username_is_not_customized,

      args.email_address,
      args.email_gravatar_hash,

      args.email_confirmed_by_google,
      args.email_is_synthetic,
    
      args.was_eagerly_provisioned,

      INITIAL_PROFILE_MARKDOWN,
      INITIAL_PROFILE_RENDERED_HTML,
      INITIAL_USER_ROLE,

      args.password_hash,
      args.is_without_password,

      args.maybe_feature_flags,

      args.ip_address,
      args.ip_address,
      args.ip_address,

      args.maybe_source.map(|s| s.to_str()),
      args.maybe_signup_method.map(|m| m.to_str()),

      maybe_referral_url,
      maybe_landing_url,
    );


  let query_result = transactor.execute(query).await;

  let record_id = match query_result {
    Ok(res) => {
      res.last_insert_id()
    },
    Err(err) => {
      warn!("New user creation DB error: {:?}", err);

      // NB: SQLSTATE[23000]: Integrity constraint violation
      // NB: MySQL Error Code 1062: Duplicate key insertion (this is harder to access)
      match err {
        Database(err) => {
          let maybe_code = err.code().map(|c| c.into_owned());
          match maybe_code.as_deref() {
            Some("23000") => {
              if err.message().contains("username") {
                return Err(CreateAccountError::UsernameIsTaken);
              } else if err.message().contains("email_address") {
                return Err(CreateAccountError::EmailIsTaken);
              }
            }
            _ => {},
          }
        },
        _ => {},
      }
      return Err(CreateAccountError::DatabaseError);
    }
  };

  Ok(CreateAccountSuccessResult {
    user_token,
    user_id: record_id,
  })
}

/// Trim, reject empty strings, and truncate to 255 characters.
fn sanitize_optional_url(value: Option<String>) -> Option<String> {
  value
    .map(|s| s.trim().to_string())
    .filter(|s| !s.is_empty())
    .map(|s| s.chars().take(255).collect())
}
