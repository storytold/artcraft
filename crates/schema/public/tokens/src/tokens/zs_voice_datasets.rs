use std::fmt::Debug;

use serde::Deserialize;
use serde::Serialize;
use utoipa::ToSchema;

use crate::prefixes::TokenPrefix;

/// The primary key for the  "zs_voice_datasets" table.
#[derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Debug, Serialize, Deserialize, ToSchema)]
#[cfg_attr(feature = "database", derive(sqlx::Type))]
#[cfg_attr(feature = "database", sqlx(transparent))]
pub struct ZsVoiceDatasetToken(pub String);

impl_string_token!(ZsVoiceDatasetToken);
impl_crockford_generator!(ZsVoiceDatasetToken, 32usize, TokenPrefix::ZsVoiceDataset, CrockfordLower);
