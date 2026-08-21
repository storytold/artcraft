//! Test accounts: a real `users` row (via the production create-account
//! query) plus a live `user_sessions` row, so handlers can authenticate the
//! fixture user exactly like a real one.

use std::sync::OnceLock;

use anyhow::anyhow;
use sqlx::MySqlPool;
use tokens::tokens::user_sessions::UserSessionToken;
use tokens::tokens::users::UserToken;

use mysql_queries::queries::users::user::create::create_account_from_email_and_password::{
  create_account_from_email_and_password, CreateAccountFromEmailPasswordArgs,
};
use mysql_queries::queries::users::user_sessions::create_user_session_with_executor::create_user_session_with_executor;

/// Every fixture account uses this password (hashed once per process).
pub const TEST_USER_PASSWORD: &str = "test_password";

const TEST_IP_ADDRESS: &str = "127.0.0.1";

pub struct TestUser {
  pub user_token: UserToken,
  pub session_token: UserSessionToken,
  pub username: String,
  pub email_address: String,
}

/// Create a user with a unique username and an active session row.
pub async fn create_test_user(pool: &MySqlPool) -> anyhow::Result<TestUser> {
  // Known a priori so the fixture can hand it back; the create-account query
  // documents this hook as being for db integration tests and seeding.
  // NB: the REAL generator, deliberately — the deterministic "for testing"
  // generator repeats the same tokens in every process, which collides with
  // rows left by previous test runs.
  let user_token = UserToken::generate();

  let suffix: String = user_token
    .as_str()
    .chars()
    .rev()
    .take(10)
    .collect::<String>()
    .to_lowercase();
  let username = format!("test_{suffix}");
  let email_address = format!("{username}@example-test.invalid");

  let mut connection = pool.acquire().await?;

  create_account_from_email_and_password(
    CreateAccountFromEmailPasswordArgs {
      username: &username,
      display_name: &username,
      email_address: &email_address,
      email_gravatar_hash: "00000000000000000000000000000000",
      password_hash: test_password_bcrypt_hash(),
      ip_address: TEST_IP_ADDRESS,
      maybe_source: None,
      maybe_referral_url: None,
      maybe_landing_url: None,
      maybe_referral_partner: None,
      maybe_referral_user_token: None,
      maybe_user_token: Some(&user_token),
    },
    &mut connection,
  )
  .await
  .map_err(|err| anyhow!("create_account_from_email_and_password failed: {err:?}"))?;

  let session_token =
    create_user_session_with_executor(&user_token, TEST_IP_ADDRESS, &mut *connection).await?;

  Ok(TestUser {
    user_token,
    session_token,
    username,
    email_address,
  })
}

/// Bcrypt hash of [`TEST_USER_PASSWORD`] at minimum cost, computed once.
/// (Tests authenticate via session rows, not passwords, but the column
/// requires a well-formed 60-byte bcrypt hash.)
fn test_password_bcrypt_hash() -> &'static str {
  static HASH: OnceLock<String> = OnceLock::new();
  HASH.get_or_init(|| {
    bcrypt::hash(TEST_USER_PASSWORD, 4).expect("bcrypt hash")
  })
}
