#[cfg(feature = "database")]
/// This overt approach is being taken because of the following error:
///
///   `MySqlDatabaseError { code: Some("HY000"), number: 1210, message: "Incorrect arguments to mysqld_stmt_execute" }`
///
/// Basically, sqlx can't turn our enum into a VARCHAR when using #[derive(sqlx::Type)].
/// Unfortunately, by not using this, we also lose the ability to `#[sqlx(rename_all="lowercase")]`, etc.,
/// so our encoder/decoder need to set the rules.
///
/// Solution adapted from https://github.com/launchbadge/sqlx/discussions/1502
/// The 0.6.2 series solution adapted from https://docs.rs/sqlx-core/0.6.2/src/sqlx_core/mysql/types/uuid.rs.html#38-66
///
macro_rules! impl_sqlite_enum_coders {
  ($t:ident) => {

    // TODO(bt,2023-11-19): We're not using sqlite anymore. Consider removing this.
    //impl sqlx::Type<sqlx_core::sqlite::Sqlite> for $t {
    //  fn type_info() -> sqlx_core::sqlite::SqliteTypeInfo {
    //    // NB: https://docs.rs/sqlx-core/0.6.2/src/sqlx_core/mysql/types/uuid.rs.html#38-66 serves as an example
    //    <str as sqlx::Type<sqlx_core::sqlite::Sqlite>>::type_info()
    //  }
    //}

    //impl<'q> sqlx::Encode<'q, sqlx_core::sqlite::Sqlite> for $t {
    //  fn encode_by_ref(
    //    &self,
    //    buf: &mut <sqlx_core::sqlite::Sqlite as sqlx_core::database::HasArguments<'q>>::ArgumentBuffer
    //  ) -> sqlx_core::encode::IsNull {
    //    // NB: https://docs.rs/sqlx-core/0.6.2/src/sqlx_core/mysql/types/uuid.rs.html#38-66 and
    //    //  https://docs.rs/sqlx-core/0.6.2/src/sqlx_core/mysql/types/str.rs.html#75-78 serves as examples
    //    let value = self.to_str();
    //    <&str as sqlx::Encode<sqlx_core::sqlite::Sqlite>>::encode(&*value, buf)
    //  }
    //}

    //impl<'r> sqlx::Decode<'r, sqlx_core::sqlite::Sqlite> for $t {
    //  fn decode(
    //    value: sqlx_core::sqlite::SqliteValueRef<'r>,
    //  ) -> Result<Self, sqlx_core::error::BoxDynError> {
    //    // NB: https://docs.rs/sqlx-core/0.6.2/src/sqlx_core/mysql/types/uuid.rs.html#38-66 serves as an example
    //    // delegate to the &str type to decode from MySQL
    //    let text = <&str as sqlx::Decode<sqlx_core::sqlite::Sqlite>>::decode(value)?;
    //    let value = $t::from_str(&text)?;
    //    Ok(value)
    //  }
    //}

  }
}

#[cfg(not(feature = "database"))]
macro_rules! impl_sqlite_enum_coders {
  ($t:ident) => {
    // Intentionally empty
  }
}
