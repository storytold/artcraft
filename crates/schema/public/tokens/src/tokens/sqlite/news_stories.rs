use std::fmt::Debug;

use serde::Deserialize;
use serde::Serialize;

use crate::prefixes::TokenPrefix;

/// The primary key for news stories (Sqlite)
#[derive(Clone, PartialEq, Eq, Debug, Serialize, Deserialize)]
#[cfg_attr(feature = "database", derive(sqlx::Type))]
#[cfg_attr(feature = "database", sqlx(transparent))]
pub struct NewsStoryToken(pub String);

impl_string_token!(NewsStoryToken);
impl_crockford_generator!(NewsStoryToken, 32usize, TokenPrefix::NewsStory, CrockfordMixed);
