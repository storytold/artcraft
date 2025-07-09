use std::fmt::Debug;

use serde::Deserialize;
use serde::Serialize;

use crate::prefixes::TokenPrefix;

/// The primary key for `password_reset`s
#[cfg_attr(not(feature = "database"), derive(Clone, PartialEq, Eq, Debug, Serialize, Deserialize))]
#[cfg_attr(feature = "database", derive(Clone, PartialEq, Eq, sqlx::Type, Debug, Serialize, Deserialize))]
#[cfg_attr(feature = "database", sqlx(transparent))]
pub struct PasswordResetToken(pub String);

impl_string_token!(PasswordResetToken);
impl_crockford_generator!(PasswordResetToken, 32usize, TokenPrefix::PasswordReset, CrockfordMixed);
