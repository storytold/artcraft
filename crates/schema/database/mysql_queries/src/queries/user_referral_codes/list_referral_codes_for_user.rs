use chrono::{DateTime, NaiveDateTime, Utc};
use sqlx::{Executor, MySql};
use tokens::tokens::user_referral_codes::UserReferralCodeToken;
use tokens::tokens::users::UserToken;

pub struct ReferralCodeRow {
  pub token: UserReferralCodeToken,
  pub code: String,
  pub code_lowercase: String,
  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

struct RawRow {
  token: UserReferralCodeToken,
  code: String,
  code_lowercase: String,
  created_at: NaiveDateTime,
  updated_at: NaiveDateTime,
}

pub async fn list_referral_codes_for_user<'e, 'c: 'e, E>(
  owner_user_token: &UserToken,
  mysql_executor: E,
) -> Result<Vec<ReferralCodeRow>, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let rows = sqlx::query_as!(
    RawRow,
    r#"
SELECT
  token as `token: UserReferralCodeToken`,
  code,
  code_lowercase,
  created_at,
  updated_at
FROM user_referral_codes
WHERE owner_user_token = ?
  AND deleted_at IS NULL
ORDER BY created_at ASC
    "#,
    owner_user_token.as_str(),
  )
    .fetch_all(mysql_executor)
    .await?;

  Ok(rows.into_iter().map(|r| ReferralCodeRow {
    token: r.token,
    code: r.code,
    code_lowercase: r.code_lowercase,
    created_at: r.created_at.and_utc(),
    updated_at: r.updated_at.and_utc(),
  }).collect())
}
