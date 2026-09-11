use std::fmt::Debug;

use serde::Deserialize;
use serde::Serialize;

use crate::prefixes::TokenPrefix;

/// The primary key for the  "zs_voices" table.
#[derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Debug, Serialize, Deserialize)]
#[cfg_attr(feature = "database", derive(sqlx::Type))]
#[cfg_attr(feature = "database", sqlx(transparent))]
pub struct ZsVoiceToken(pub String);

impl_string_token!(ZsVoiceToken);
impl_crockford_generator!(ZsVoiceToken, 32usize, TokenPrefix::ZsVoice, CrockfordLower);
