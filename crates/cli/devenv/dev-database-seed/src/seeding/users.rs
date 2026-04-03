use log::{info, warn};
use sqlx::{MySql, Pool};

use errors::{anyhow, AnyhowResult};
use hashing::bcrypt::bcrypt_password_hash::bcrypt_password_hash;
use hashing::md5::email_to_gravatar_hash::email_to_gravatar_hash;
use mysql_queries::queries::users::user::create::create_account_from_email_and_password::{create_account_from_email_and_password, CreateAccountFromEmailPasswordArgs};
use tokens::tokens::users::UserToken;

pub const ADMIN_USERNAME : &str = "admin";
pub const HANASHI_USERNAME : &str = "hanashi";

// We want deterministic tokens for some records
pub const ADMIN_USER_TOKEN : &str = "user_4jgh4dk9tmr6t";
pub const HANASHI_USER_TOKEN : &str = "user_fcfteany0ds60";

pub async fn seed_user_accounts(mysql_pool: &Pool<MySql>) -> AnyhowResult<()> {
  info!("Seeding user accounts...");

  // NB: This is idempotent and will only install the accounts once.
  let users = [
    (ADMIN_USERNAME, "password", Some(ADMIN_USER_TOKEN)),
    (HANASHI_USERNAME, "password", Some(HANASHI_USER_TOKEN)),
    ("test", "password", None),
  ];

  for (username, password, maybe_user_token) in users {
    let maybe_user_token = maybe_user_token.map(|token| UserToken::new_from_str(token));
    let result = seed_user(username, password, maybe_user_token, &mysql_pool).await;
    match result {
      Ok(_) => info!("Seeded {}", username),
      Err(err) => warn!(r#"
        Could not seed user {} : {:?}
        (No worries: if there's a duplicate key error, we probably already
        seeded the user on a previous invocation!)
      "#, username, err),
    }
  }

  Ok(())
}

async fn seed_user(
  username: &str,
  password: &str,
  maybe_user_token: Option<UserToken>,
  mysql_pool: &Pool<MySql>,
) -> AnyhowResult<()> {
  info!("Seeding user {} ...", username);

  let display_name = username.clone();
  let username = username.to_lowercase();
  let email_address = format!("{}@storyteller.ai", username);
  let email_gravatar_hash = email_to_gravatar_hash(&email_address);
  let password_hash = bcrypt_password_hash(password)?;

  create_account_from_email_and_password(mysql_pool, CreateAccountFromEmailPasswordArgs {
    username: &username,
    display_name,
    email_address: &email_address,
    email_gravatar_hash: &email_gravatar_hash,
    password_hash: &password_hash,
    ip_address: "127.0.0.1",
    maybe_source: None,
    maybe_referral_url: None,
    maybe_landing_url: None,
    maybe_user_token: maybe_user_token.as_ref(),
  }).await.map_err(|err| anyhow!("err: {:?}", err))?;

  Ok(())
}
