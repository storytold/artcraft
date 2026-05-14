use chrono::{DateTime, NaiveDateTime, Utc};
use sqlx::MySqlPool;
use tokens::tokens::user_referral_codes::UserReferralCodeToken;
use tokens::tokens::users::UserToken;

use crate::queries::user_referrals::list_global_user_referrals::UserReferralListItem;

struct RawRow {
  id: u64,
  invited_user_token: UserToken,
  invited_username: String,
  invited_display_name: String,
  invited_email_address: String,
  referrer_user_token: UserToken,
  referrer_username: String,
  referrer_display_name: String,
  maybe_referral_code_token: Option<UserReferralCodeToken>,
  maybe_referral_url: Option<String>,
  maybe_landing_url: Option<String>,
  created_at: NaiveDateTime,
}

pub struct ListUserReferralsForUserArgs<'a> {
  pub referrer_username: &'a str,
  pub maybe_cursor_id: Option<u64>,
  pub limit: u32,
  pub mysql_pool: &'a MySqlPool,
}

pub async fn list_user_referrals_for_user(
  args: ListUserReferralsForUserArgs<'_>,
) -> Result<Vec<UserReferralListItem>, sqlx::Error> {
  let limit = args.limit as i64;

  let rows = match args.maybe_cursor_id {
    Some(cursor_id) => {
      sqlx::query_as!(
        RawRow,
        r#"
SELECT
  ur.id as `id: u64`,
  ur.invited_user_token as `invited_user_token: UserToken`,
  invited.username as `invited_username: String`,
  invited.display_name as `invited_display_name: String`,
  invited.email_address as `invited_email_address: String`,
  ur.referrer_user_token as `referrer_user_token: UserToken`,
  referrer.username as `referrer_username: String`,
  referrer.display_name as `referrer_display_name: String`,
  ur.maybe_referral_code_token as `maybe_referral_code_token: UserReferralCodeToken`,
  ur.maybe_referral_url,
  ur.maybe_landing_url,
  ur.created_at
FROM user_referrals ur
JOIN users invited ON invited.token = ur.invited_user_token
JOIN users referrer ON referrer.token = ur.referrer_user_token
WHERE referrer.username = ?
  AND ur.id < ?
ORDER BY ur.id DESC
LIMIT ?
        "#,
        args.referrer_username,
        cursor_id as u64,
        limit,
      )
        .fetch_all(args.mysql_pool)
        .await?
    }
    None => {
      sqlx::query_as!(
        RawRow,
        r#"
SELECT
  ur.id as `id: u64`,
  ur.invited_user_token as `invited_user_token: UserToken`,
  invited.username as `invited_username: String`,
  invited.display_name as `invited_display_name: String`,
  invited.email_address as `invited_email_address: String`,
  ur.referrer_user_token as `referrer_user_token: UserToken`,
  referrer.username as `referrer_username: String`,
  referrer.display_name as `referrer_display_name: String`,
  ur.maybe_referral_code_token as `maybe_referral_code_token: UserReferralCodeToken`,
  ur.maybe_referral_url,
  ur.maybe_landing_url,
  ur.created_at
FROM user_referrals ur
JOIN users invited ON invited.token = ur.invited_user_token
JOIN users referrer ON referrer.token = ur.referrer_user_token
WHERE referrer.username = ?
ORDER BY ur.id DESC
LIMIT ?
        "#,
        args.referrer_username,
        limit,
      )
        .fetch_all(args.mysql_pool)
        .await?
    }
  };

  Ok(rows.into_iter().map(|r| UserReferralListItem {
    id: r.id,
    invited_user_token: r.invited_user_token,
    invited_username: r.invited_username,
    invited_display_name: r.invited_display_name,
    invited_email_address: r.invited_email_address,
    referrer_user_token: r.referrer_user_token,
    referrer_username: r.referrer_username,
    referrer_display_name: r.referrer_display_name,
    maybe_referral_code_token: r.maybe_referral_code_token,
    maybe_referral_url: r.maybe_referral_url,
    maybe_landing_url: r.maybe_landing_url,
    created_at: r.created_at.and_utc(),
  }).collect())
}
