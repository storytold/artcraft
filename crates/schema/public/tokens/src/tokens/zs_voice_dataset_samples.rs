use std::fmt::Debug;

use serde::Deserialize;
use serde::Serialize;

use crate::prefixes::TokenPrefix;

/// The primary key for the  "zs_voice_dataset_samples" table.
#[derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Debug, Serialize, Deserialize)]
#[cfg_attr(feature = "database", derive(sqlx::Type))]
#[cfg_attr(feature = "database", sqlx(transparent))]
pub struct ZsVoiceDatasetSampleToken(pub String);

impl_string_token!(ZsVoiceDatasetSampleToken);
impl_crockford_generator!(ZsVoiceDatasetSampleToken, 32usize, TokenPrefix::ZsVoiceDatasetSample, CrockfordLower);
