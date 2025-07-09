use std::fmt::Debug;

use serde::Deserialize;
use serde::Serialize;
use utoipa::ToSchema;

use crate::prefixes::TokenPrefix;

/// The primary key for Media Files
#[derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Debug, Serialize, Deserialize, ToSchema)]
#[cfg_attr(feature = "database", derive(sqlx::Type))]
#[cfg_attr(feature = "database", sqlx(transparent))]
pub struct MediaFileToken(pub String);

impl_string_token!(MediaFileToken);
impl_mysql_token_from_row!(MediaFileToken);
impl_crockford_generator!(MediaFileToken, 32usize, TokenPrefix::MediaFile, CrockfordLower);
