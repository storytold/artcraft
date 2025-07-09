
#[cfg(feature = "database")]
/// Implement `MySqlTokenFromRow` on a type.
macro_rules! impl_mysql_token_from_row {
  ($t:ident) => {

    // Try to convert a MySQL row and named field into the value type (for non-nullable fields).
    impl crate::traits::mysql_token_from_row::MySqlTokenFromRow<$t> for $t {
      fn try_from_mysql_row(row: &sqlx_mysql::MySqlRow, field_name: &str) -> Result<$t, sqlx::Error> {
        use sqlx::Row;

        // NB(bt,2023-12-05): For now only string encodings are considered.
        // We may want to revisit in the future if we deal with binary data.
        let value : String = row.try_get(field_name)?;

        Ok(Self::new_from_str(&value))
      }

      // Try to convert a MySQL row and named field into the value type (for nullable fields).
      fn try_from_mysql_row_nullable(row: &sqlx_mysql::MySqlRow, field_name: &str) -> Result<Option<$t>, sqlx::Error> {
        use sqlx::Row;

        // NB(bt,2023-12-05): For now only string encodings are considered.
        // We may want to revisit in the future if we deal with binary data.
        // NB(2): Nullable fields decode as Option<T>.
        let maybe_value : Option<String> = row.try_get(field_name)?;

        let value = match maybe_value {
          Some(value) => value,
          None => return Ok(None),
        };

        Ok(Some(Self::new_from_str(&value)))
      }
    }

    //// TODO: Tests.
    //#[cfg(test)]
    //#[test]
    //fn test_name() {
    //  use strum::IntoEnumIterator;
    //  for variant in $t::iter() {
    //    assert_eq!(format!("{}", variant), variant.to_str());
    //  }
    //}

  }
}

#[cfg(not(feature = "database"))]
macro_rules! impl_mysql_token_from_row {
  ($t:ident) => {
    // Intentionally empty
  }
}
