use std::fmt::Debug;

use serde::Deserialize;
use serde::Serialize;

use crate::prefixes::TauriTokenPrefix;

/// The primary key for tasks (Tauri / Sqlite)
#[derive(Clone, PartialEq, Eq, Debug, Serialize, Deserialize)]
#[cfg_attr(feature = "database", derive(sqlx::Type))]
#[cfg_attr(feature = "database", sqlx(transparent))]
pub struct TaskId(pub String);

impl_string_token!(TaskId);
impl_crockford_generator!(TaskId, 32usize, TauriTokenPrefix::Task, CrockfordMixed);
