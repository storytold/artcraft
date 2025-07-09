use std::fmt::Debug;

use serde::Deserialize;
use serde::Serialize;
use utoipa::ToSchema;

use crate::prefixes::TokenPrefix;

/// The primary key for google_sign_in_accounts
#[derive(Clone, PartialEq, Eq, Debug, Serialize, Deserialize, Default, ToSchema)]
#[cfg_attr(feature = "database", derive(sqlx::Type))]
#[cfg_attr(feature = "database", sqlx(transparent))]
pub struct GoogleSignInAccountToken(String);

impl_crockford_generator!(GoogleSignInAccountToken, 32usize, TokenPrefix::GoogleSignInAccount, CrockfordLower);
impl_mysql_token_from_row!(GoogleSignInAccountToken);
impl_string_token!(GoogleSignInAccountToken);
