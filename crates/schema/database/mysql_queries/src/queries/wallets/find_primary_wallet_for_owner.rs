use crate::errors::select_optional_record_error::SelectOptionalRecordError;
use crate::types::query_map::QueryMap;
use enums_db::common::payments_namespace::PaymentsNamespace;
use sqlx;
use sqlx::mysql::MySqlRow;
use sqlx::pool::PoolConnection;
use sqlx::MySql;
use tokens::tokens::users::UserToken;
use tokens::tokens::wallets::WalletToken;

#[derive(Clone)]
pub struct PrimaryWalletForOwner {
  pub token: WalletToken,
  pub namespace: PaymentsNamespace,
  pub banked_credits: u64,
  pub monthly_credits: u64,
}

pub async fn find_primary_wallet_for_owner_using_connection(
  user_token: &UserToken,
  namespace: PaymentsNamespace,
  connection: &mut PoolConnection<MySql>,
) -> Result<Option<PrimaryWalletForOwner>, SelectOptionalRecordError> {
  let result = query(user_token, namespace)
      .fetch_optional(&mut **connection)
      .await;

  match result {
    Ok(Some(record)) => Ok(Some(PrimaryWalletForOwner {
      token: record.token,
      namespace: record.namespace,
      banked_credits: record.banked_credits,
      monthly_credits: record.monthly_credits,
    })),
    Ok(None) => Ok(None),
    Err(e) => Err(e.into()),
  }
}


pub async fn find_primary_wallet_for_owner_using_transaction(
  user_token: &UserToken,
  namespace: PaymentsNamespace,
  transaction: &mut sqlx::Transaction<'_, MySql>,
) -> Result<Option<PrimaryWalletForOwner>, SelectOptionalRecordError> {
  let result = query(user_token, namespace)
      .fetch_optional(&mut **transaction)
      .await;

  match result {
    Ok(Some(record)) => Ok(Some(PrimaryWalletForOwner {
      token: record.token,
      namespace: record.namespace,
      banked_credits: record.banked_credits,
      monthly_credits: record.monthly_credits,
    })),
    Ok(None) => Ok(None),
    Err(e) => Err(e.into()),
  }
}

fn query(user_token: &UserToken, namespace: PaymentsNamespace)
  -> QueryMap<impl Send + FnMut(MySqlRow) -> Result<RecordRaw, sqlx::Error>>
{
  // NB: We want to eventually support multiple wallets per user (eg. company use case),
  // so we do not have a unique key on user token. We do, however, have a temporary(?) unique
  // key on the combination of (owner_user_token + wallet_namespace) that we could potentially
  // lift later. 
  // In the meantime, to ensure we use the same wallet each time, we order by id and take the 
  // first one.
  sqlx::query_as!(
    RecordRaw,
    r#"
      SELECT
        token as `token: tokens::tokens::wallets::WalletToken`,
        wallet_namespace as `namespace: enums_db::common::payments_namespace::PaymentsNamespace`,
        banked_credits,
        monthly_credits
      FROM wallets
      WHERE owner_user_token = ?
      AND wallet_namespace = ?
      ORDER BY id ASC
      LIMIT 1
    "#,
    user_token.as_str(),
    namespace.to_str(),
  )
}


#[derive(sqlx::FromRow)]
struct RecordRaw {
  token: WalletToken,
  namespace: PaymentsNamespace,
  banked_credits: u64,
  monthly_credits: u64,
}
