use std::fmt::Debug;

use serde::Deserialize;
use serde::Serialize;
use utoipa::ToSchema;

use crate::prefixes::TokenPrefix;

/// The primary key for api_keys.
#[derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Debug, Serialize, Deserialize, Default, ToSchema)]
#[cfg_attr(feature = "database", derive(sqlx::Type))]
#[cfg_attr(feature = "database", sqlx(transparent))]
pub struct ApiKeyToken(pub String);

impl_mysql_token_from_row!(ApiKeyToken);
impl_string_token!(ApiKeyToken);
impl_crockford_generator!(ApiKeyToken, 32usize, TokenPrefix::ApiKey, CrockfordLower);
