use crate::queries::wallets::create_new_wallet_for_owner_user::create_new_wallet_for_owner_user;
use enums::common::payments_namespace::PaymentsNamespace;
use sqlx::MySql;
use tokens::tokens::users::UserToken;
use tokens::tokens::wallets::WalletToken;

pub async fn create_new_artcraft_wallet_for_owner_user(
  user_token: &UserToken,
  transaction: &mut sqlx::Transaction<'_, MySql>,
) -> Result<WalletToken, sqlx::Error> {
  create_new_wallet_for_owner_user(user_token, PaymentsNamespace::Artcraft, transaction).await
}
