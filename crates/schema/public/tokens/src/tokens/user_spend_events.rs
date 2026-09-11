use std::fmt::Debug;

use serde::Deserialize;
use serde::Serialize;
use utoipa::ToSchema;

use crate::prefixes::TokenPrefix;

/// The primary key for user_spend_events
#[derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Debug, Serialize, Deserialize, ToSchema)]
#[cfg_attr(feature = "database", derive(sqlx::Type))]
#[cfg_attr(feature = "database", sqlx(transparent))]
pub struct UserSpendEventToken(pub String);

impl_string_token!(UserSpendEventToken);
impl_mysql_token_from_row!(UserSpendEventToken);
impl_crockford_generator!(UserSpendEventToken, 32usize, TokenPrefix::UserSpendEvent, CrockfordLower);
