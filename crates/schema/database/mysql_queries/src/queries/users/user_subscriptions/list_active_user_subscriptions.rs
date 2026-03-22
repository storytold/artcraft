use chrono::{DateTime, Utc};
use enums_db::common::payments_namespace::PaymentsNamespace;
use errors::AnyhowResult;
use sqlx::pool::PoolConnection;
use sqlx::MySql;

pub struct ActiveUserSubscription {
    pub user_token: String,

    /// The category or namespace for the product, eg "artcraft" or "fakeyou".
    pub subscription_namespace: PaymentsNamespace,

    /// The key for the product in our internal system (not a stripe id),
    /// eg. "artcraft_basic", "fakeyou_en_pro", or "stream_package_plus".
    /// These depend on the namespace, so they're stringly-encoded.
    pub subscription_product_slug: String,

    /// This is the authoritative timestamp for when the subscription expires.
    pub subscription_expires_at: DateTime<Utc>,
}

pub async fn list_active_user_subscriptions(
    mysql_connection: &mut PoolConnection<MySql>,
    user_token: &str
) -> AnyhowResult<Vec<ActiveUserSubscription>> {
    // NB: "status=incomplete" subscriptions can happen when a user submits credit card info,
    //  but the CRC is wrong. Eg. what happened with ftx on 2022.11.18.
    //
    //  https://stripe.com/docs/billing/subscriptions/overview#subscription-statuses
    let records = sqlx::query_as!(
      RawActiveUserSubscription,
        r#"
SELECT
  user_token,
  subscription_namespace as `subscription_namespace: enums_db::common::payments_namespace::PaymentsNamespace`,
  subscription_product_slug,
  subscription_expires_at

FROM user_subscriptions

WHERE
  user_token = ?
  AND subscription_expires_at > CURRENT_TIMESTAMP
  ORDER BY id ASC
        "#,
      user_token,
    )
        .fetch_all(&mut **mysql_connection)
        .await?;

    let records = records.into_iter()
        .map(|record : RawActiveUserSubscription | {
            ActiveUserSubscription {
                user_token: record.user_token,
                subscription_namespace: record.subscription_namespace,
                subscription_product_slug: record.subscription_product_slug,
                subscription_expires_at: record.subscription_expires_at,
            }
        })
        .collect::<Vec<ActiveUserSubscription>>();

    Ok(records)
}

struct RawActiveUserSubscription {
    user_token: String,
    subscription_namespace: PaymentsNamespace,
    subscription_product_slug: String,
    subscription_expires_at: DateTime<Utc>,
}
