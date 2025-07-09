use std::fmt::Debug;

use serde::Deserialize;
use serde::Serialize;

use crate::prefixes::TokenPrefix;

/// The primary key for "generic" inference jobs.
#[cfg_attr(not(feature = "database"), derive(Clone, PartialEq, Eq, Debug, Serialize, Deserialize))]
#[cfg_attr(feature = "database", derive(Clone, PartialEq, Eq, sqlx::Type, Debug, Serialize, Deserialize))]
#[cfg_attr(feature = "database", sqlx(transparent))]
pub struct DownloadJobToken(String);

impl_string_token!(DownloadJobToken);
impl_crockford_generator!(DownloadJobToken, 32usize, TokenPrefix::DownloadJob, CrockfordLower);
