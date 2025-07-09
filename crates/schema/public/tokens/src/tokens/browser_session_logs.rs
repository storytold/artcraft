use std::fmt::Debug;

use serde::Deserialize;
use serde::Serialize;
use utoipa::ToSchema;

use crate::prefixes::TokenPrefix;

/// The primary key for Audit Logs.
#[cfg_attr(not(feature = "database"), derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Debug, Serialize, Deserialize, ToSchema))]
#[cfg_attr(feature = "database", derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash, sqlx::Type, Debug, Serialize, Deserialize, ToSchema))]
#[cfg_attr(feature = "database", sqlx(transparent))]
pub struct BrowserSessionLogToken(pub String);

impl_crockford_generator!(BrowserSessionLogToken, 32usize, TokenPrefix::BrowserSessionLog, CrockfordLower);
impl_mysql_token_from_row!(BrowserSessionLogToken);
impl_string_token!(BrowserSessionLogToken);
