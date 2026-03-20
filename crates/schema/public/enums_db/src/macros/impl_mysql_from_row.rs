/// Implement `MySqlFromRow` on a type.
macro_rules! impl_mysql_from_row {
  ($t:ident) => {

    // Try to convert a MySQL row and named field into the value type (for non-nullable fields).
    impl crate::traits::mysql_from_row::MySqlFromRow<$t> for $t {
      fn try_from_mysql_row(row: &sqlx_mysql::MySqlRow, field_name: &str) -> Result<$t, sqlx::Error> {
        use sqlx::{Error, Row};

        let value : String = row.try_get(field_name)?;

        let output_type = Self::from_str(&value)
            .map_err(|err| {
              Error::ColumnDecode {
                index: format!("mysql_from_row failure on field {}: {:?}", field_name, err),
                source: format!("mysql_from_row failure on field {}: {:?}", field_name, err).into(),
              }
            })?;

        Ok(output_type)
      }

      // Try to convert a MySQL row and named field into the value type (for nullable fields).
      fn try_from_mysql_row_nullable(row: &sqlx_mysql::MySqlRow, field_name: &str) -> Result<Option<$t>, sqlx::Error> {
        use sqlx::{Error, Row};

        let maybe_value : Option<String> = row.try_get(field_name)?;

        let value = match maybe_value {
          Some(value) => value,
          None => return Ok(None),
        };

        let output_type = Self::from_str(&value)
            .map_err(|err| {
              Error::ColumnDecode {
                index: format!("mysql_from_row failure on field {}: {:?}", field_name, err),
                source: format!("mysql_from_row failure on field {}: {:?}", field_name, err).into(),
              }
            })?;

        Ok(Some(output_type))
      }
    }

  }
}
