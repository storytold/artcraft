use sqlx_mysql::MySqlRow;

/// This is a trait (in conjunction with the macro implementation) that makes up for sqlx's
/// QueryBuilder not playing well with FromRow implementation or derivation of named types.
pub trait MySqlFromRow<T> {

  /// Attempt to parse a named column from a MySqlRow into the type.
  fn try_from_mysql_row(row: &MySqlRow, field_name: &str) -> Result<T, sqlx::Error>;

  fn try_from_mysql_row_nullable(row: &MySqlRow, field_name: &str) -> Result<Option<T>, sqlx::Error>;
}
