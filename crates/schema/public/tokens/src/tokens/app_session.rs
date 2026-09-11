use std::fmt::Debug;

use serde::Deserialize;
use serde::Serialize;
use utoipa::ToSchema;

use crate::prefixes::TokenPrefix;

/// The primary key for users.
#[derive(Clone, PartialEq, Eq, Debug, Serialize, Deserialize, Default, ToSchema)]
#[cfg_attr(feature = "database", derive(sqlx::Type))]
#[cfg_attr(feature = "database", sqlx(transparent))]
pub struct AppSessionToken(pub String);

impl_mysql_token_from_row!(AppSessionToken);
impl_string_token!(AppSessionToken);
impl_crockford_generator!(AppSessionToken, 32usize, TokenPrefix::AppSession, CrockfordMixed);
