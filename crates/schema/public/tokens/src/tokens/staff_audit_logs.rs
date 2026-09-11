use std::fmt::Debug;

use serde::Deserialize;
use serde::Serialize;
use utoipa::ToSchema;

use crate::prefixes::TokenPrefix;

/// The primary key for Staff Audit Logs
#[derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Debug, Serialize, Deserialize, ToSchema)]
#[cfg_attr(feature = "database", derive(sqlx::Type))]
#[cfg_attr(feature = "database", sqlx(transparent))]
pub struct StaffAuditLogToken(pub String);

impl_string_token!(StaffAuditLogToken);
impl_mysql_token_from_row!(StaffAuditLogToken);
impl_crockford_generator!(StaffAuditLogToken, 32usize, TokenPrefix::StaffAuditLog, CrockfordLower);
