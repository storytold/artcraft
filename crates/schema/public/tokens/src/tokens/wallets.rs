use std::fmt::Debug;

use serde::Deserialize;
use serde::Serialize;
use utoipa::ToSchema;

use crate::prefixes::TokenPrefix;

/// The primary key for wallets
#[derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Debug, Serialize, Deserialize, ToSchema)]
#[cfg_attr(feature = "database", derive(sqlx::Type))]
#[cfg_attr(feature = "database", sqlx(transparent))]
pub struct WalletToken(pub String);

impl_string_token!(WalletToken);
impl_mysql_token_from_row!(WalletToken);
impl_crockford_generator!(WalletToken, 32usize, TokenPrefix::Wallet, CrockfordLower);
