use std::fmt::Debug;

use serde::Deserialize;
use serde::Serialize;
use utoipa::ToSchema;

use crate::prefixes::TokenPrefix;

/// The primary key for Audit Logs.
#[derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Debug, Serialize, Deserialize, ToSchema)]
#[cfg_attr(feature = "database", derive(sqlx::Type))]
#[cfg_attr(feature = "database", sqlx(transparent))]
pub struct BetaKeyToken(pub String);

impl_crockford_generator!(BetaKeyToken, 32usize, TokenPrefix::BetaKey, CrockfordLower);
impl_mysql_token_from_row!(BetaKeyToken);
impl_string_token!(BetaKeyToken);
