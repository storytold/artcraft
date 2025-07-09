use std::fmt::Debug;

use serde::Deserialize;
use serde::Serialize;
use utoipa::ToSchema;

use crate::prefixes::TokenPrefix;

/// The primary key for Prompts
#[derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Debug, Serialize, Deserialize, ToSchema)]
#[cfg_attr(feature = "database", derive(sqlx::Type))]
#[cfg_attr(feature = "database", sqlx(transparent))]
pub struct TagToken(pub String);

impl_crockford_generator!(TagToken, 32usize, TokenPrefix::Tag, CrockfordLower);
impl_mysql_token_from_row!(TagToken);
impl_string_token!(TagToken);
