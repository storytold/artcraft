use std::fmt::Debug;

use serde::Deserialize;
use serde::Serialize;
use utoipa::ToSchema;

use crate::prefixes::TokenPrefix;

/// The primary key for folders.
#[derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Debug, Serialize, Deserialize, Default, ToSchema)]
#[cfg_attr(feature = "database", derive(sqlx::Type))]
#[cfg_attr(feature = "database", sqlx(transparent))]
pub struct FolderToken(pub String);

impl_mysql_token_from_row!(FolderToken);
impl_string_token!(FolderToken);
impl_crockford_generator!(FolderToken, 32usize, TokenPrefix::Folder, CrockfordLower);
