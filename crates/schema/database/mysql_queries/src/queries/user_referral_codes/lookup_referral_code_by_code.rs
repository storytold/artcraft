use sqlx::{Executor, MySql};
use tokens::tokens::user_referral_codes::UserReferralCodeToken;
use tokens::tokens::users::UserToken;

pub struct ReferralCodeLookupResult {
  pub token: UserReferralCodeToken,
  pub owner_user_token: UserToken,
  pub code: String,
  pub code_lowercase: String,
}

struct RawRow {
  token: UserReferralCodeToken,
  owner_user_token: UserToken,
  code: String,
  code_lowercase: String,
}

/// Look up a non-deleted referral code by its lowercased code value.
pub async fn lookup_referral_code_by_code<'e, 'c: 'e, E>(
  code_lowercase: &str,
  mysql_executor: E,
) -> Result<Option<ReferralCodeLookupResult>, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let result = sqlx::query_as!(
    RawRow,
    r#"
SELECT
  token as `token: UserReferralCodeToken`,
  owner_user_token as `owner_user_token: UserToken`,
  code,
  code_lowercase
FROM user_referral_codes
WHERE code_lowercase = ?
  AND deleted_at IS NULL
LIMIT 1
    "#,
    code_lowercase,
  )
    .fetch_one(mysql_executor)
    .await;

  match result {
    Ok(row) => Ok(Some(ReferralCodeLookupResult {
      token: row.token,
      owner_user_token: row.owner_user_token,
      code: row.code,
      code_lowercase: row.code_lowercase,
    })),
    Err(sqlx::Error::RowNotFound) => Ok(None),
    Err(err) => Err(err),
  }
}
