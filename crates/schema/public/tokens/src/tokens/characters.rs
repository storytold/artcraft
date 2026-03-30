use std::fmt::Debug;

use serde::Deserialize;
use serde::Serialize;
use utoipa::ToSchema;

use crate::prefixes::TokenPrefix;

/// The primary key for Characters
#[derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Debug, Serialize, Deserialize, ToSchema)]
#[cfg_attr(feature = "database", derive(sqlx::Type))]
#[cfg_attr(feature = "database", sqlx(transparent))]
pub struct CharacterToken(pub String);

impl_string_token!(CharacterToken);
impl_mysql_token_from_row!(CharacterToken);
impl_crockford_generator!(CharacterToken, 32usize, TokenPrefix::Character, CrockfordLower);
