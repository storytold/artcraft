use sqlx::{Executor, MySql};
use tokens::tokens::user_referral_codes::UserReferralCodeToken;
use tokens::tokens::users::UserToken;
use uuid_utils::uuid::generate_random_uuid;

/// Soft-delete a referral code owned by the given user.
/// Sets `deleted_at` and replaces `code_lowercase` with random entropy
/// to free up the unique constraint for reuse.
/// Returns true if a row was updated.
pub async fn soft_delete_referral_code<'e, 'c: 'e, E>(
  token: &UserReferralCodeToken,
  owner_user_token: &UserToken,
  mysql_executor: E,
) -> Result<bool, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  // Replace code_lowercase with random entropy (max 32 chars) to free uniqueness constraint.
  let tombstone = format!("_deleted_{}", &generate_random_uuid()[..20]);

  let result = sqlx::query!(
    r#"
UPDATE user_referral_codes
SET
  deleted_at = CURRENT_TIMESTAMP,
  code_lowercase = ?
WHERE token = ?
  AND owner_user_token = ?
  AND deleted_at IS NULL
    "#,
    tombstone,
    token.as_str(),
    owner_user_token.as_str(),
  )
    .execute(mysql_executor)
    .await?;

  Ok(result.rows_affected() > 0)
}
