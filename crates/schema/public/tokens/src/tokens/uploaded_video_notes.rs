use std::fmt::Debug;

use serde::Deserialize;
use serde::Serialize;
use utoipa::ToSchema;

use crate::prefixes::TokenPrefix;

/// The primary key for uploaded_video_notes.
#[derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Debug, Serialize, Deserialize, ToSchema)]
#[cfg_attr(feature = "database", derive(sqlx::Type))]
#[cfg_attr(feature = "database", sqlx(transparent))]
pub struct UploadVideoNoteToken(pub String);

impl_string_token!(UploadVideoNoteToken);
impl_mysql_token_from_row!(UploadVideoNoteToken);
impl_crockford_generator!(UploadVideoNoteToken, 32usize, TokenPrefix::UploadedVideoNote, CrockfordLower);
