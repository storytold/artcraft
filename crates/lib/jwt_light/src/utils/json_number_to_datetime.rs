use crate::error::JwtError;
use chrono::{DateTime, Utc};
use serde_json::Number;

// NB: Some JWTs have "iat" and "exp" as integer numbers, some have them as floats
pub (crate) fn json_number_to_datetime(timestamp: &Number, field_name: &str) -> Result<DateTime<Utc>, JwtError> {
  let result;

  if timestamp.is_i64() {
    // Integer case
    let timestamp = timestamp.as_i64()
        .ok_or_else(|| JwtError::CommonFieldError(format!("{} is not an integer", field_name)))?;

    result = DateTime::from_timestamp(timestamp, 0)
        .ok_or_else(|| JwtError::CommonFieldError(format!("{} is not a valid timestamp", field_name)))?;
  } else if timestamp.is_f64() {
    // Float case
    let timestamp = timestamp.as_f64()
        .ok_or_else(|| JwtError::CommonFieldError(format!("{} is not an integer", field_name)))?;

    let timestamp = timestamp.round() as i64;

    result = DateTime::from_timestamp(timestamp, 0)
        .ok_or_else(|| JwtError::CommonFieldError(format!("{} is not a valid timestamp", field_name)))?;
  } else {
    return Err(JwtError::CommonFieldError(format!("{} is not a number", field_name)));
  }

  Ok(result)
}
