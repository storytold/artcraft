use std::fmt::Debug;

use serde::Deserialize;
use serde::Serialize;
use utoipa::ToSchema;

use crate::prefixes::TokenPrefix;

/// The primary key for users.
#[cfg_attr(not(feature = "database"), derive(Clone, PartialEq, Eq, Debug, Serialize, Deserialize, Default,ToSchema))]
#[cfg_attr(feature = "database", derive(Clone, PartialEq, Eq, sqlx::Type, Debug, Serialize, Deserialize, Default,ToSchema))]
#[cfg_attr(feature = "database", sqlx(transparent))]
pub struct UserToken(pub String);

impl_mysql_token_from_row!(UserToken);
impl_string_token!(UserToken);
// NB: Older user tokens were under this regime: 15 characters, "U:" prefix, Crockford Upper.
impl_crockford_generator!(UserToken, 18usize, TokenPrefix::User, CrockfordLower);
