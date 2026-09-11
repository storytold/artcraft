use std::fmt::Debug;

use serde::Deserialize;
use serde::Serialize;

use crate::prefixes::TokenPrefix;

/// Primary key for the `user_sessions` table.
#[derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Debug, Serialize, Deserialize)]
#[cfg_attr(feature = "database", derive(sqlx::Type))]
#[cfg_attr(feature = "database", sqlx(transparent))]
pub struct UserSessionToken(pub String);

impl_string_token!(UserSessionToken);
impl_crockford_generator!(UserSessionToken, 32usize, TokenPrefix::UserSession, CrockfordLower);
