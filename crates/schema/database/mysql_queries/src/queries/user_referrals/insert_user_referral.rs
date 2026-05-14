use sqlx::{Executor, MySql};
use tokens::tokens::user_referral_codes::UserReferralCodeToken;
use tokens::tokens::users::UserToken;

pub struct InsertUserReferralArgs<'a> {
  pub invited_user_token: &'a UserToken,
  pub referrer_user_token: &'a UserToken,
  pub maybe_referral_code_token: Option<&'a UserReferralCodeToken>,
  pub maybe_referral_url: Option<&'a str>,
  pub maybe_landing_url: Option<&'a str>,
}

pub async fn insert_user_referral<'e, 'c: 'e, E>(
  args: InsertUserReferralArgs<'_>,
  mysql_executor: E,
) -> Result<(), sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  sqlx::query!(
    r#"
INSERT INTO user_referrals (
  invited_user_token,
  referrer_user_token,
  maybe_referral_code_token,
  maybe_referral_url,
  maybe_landing_url
)
VALUES (?, ?, ?, ?, ?)
    "#,
    args.invited_user_token.as_str(),
    args.referrer_user_token.as_str(),
    args.maybe_referral_code_token.map(|t| t.as_str()),
    args.maybe_referral_url,
    args.maybe_landing_url,
  )
    .execute(mysql_executor)
    .await?;

  Ok(())
}
