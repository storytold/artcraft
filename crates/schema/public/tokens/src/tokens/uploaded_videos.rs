use std::fmt::Debug;

use serde::Deserialize;
use serde::Serialize;
use utoipa::ToSchema;

use crate::prefixes::TokenPrefix;

/// The primary key for uploaded_videos.
#[derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Debug, Serialize, Deserialize, ToSchema)]
#[cfg_attr(feature = "database", derive(sqlx::Type))]
#[cfg_attr(feature = "database", sqlx(transparent))]
pub struct UploadedVideoToken(pub String);

impl_string_token!(UploadedVideoToken);
impl_mysql_token_from_row!(UploadedVideoToken);
impl_crockford_generator!(UploadedVideoToken, 32usize, TokenPrefix::UploadedVideo, CrockfordLower);
