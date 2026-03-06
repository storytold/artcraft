use sqlx::{MySql, Pool};

pub struct InsertWebReferralArgs<'a> {
  pub url: &'a str,
  pub maybe_domain: Option<&'a str>,
  pub utm_source: Option<&'a str>,
  pub utm_medium: Option<&'a str>,
  pub utm_campaign: Option<&'a str>,
  pub ip_address: &'a str,
  pub maybe_anonymous_visitor_token: Option<&'a str>,
}

pub async fn insert_web_referral(
  mysql_pool: &Pool<MySql>,
  args: InsertWebReferralArgs<'_>,
) -> Result<(), sqlx::Error> {
  sqlx::query!(
    r#"
    INSERT INTO web_referrals (
      url,
      domain,
      utm_source,
      utm_medium,
      utm_campaign,
      ip_address,
      anonymous_visitor_token
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    "#,
    args.url,
    args.maybe_domain,
    args.utm_source,
    args.utm_medium,
    args.utm_campaign,
    args.ip_address,
    args.maybe_anonymous_visitor_token,
  )
  .execute(mysql_pool)
  .await?;

  Ok(())
}
