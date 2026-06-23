//! Deserialization helpers for numeric fields that the Kinovi API has started
//! returning as floating-point values where it previously returned integers
//! (e.g. `width: 568.5`, `credits: 372215.18`).
//!
//! Each helper accepts EITHER a JSON integer or a JSON float and coerces it to
//! an unsigned integer: exact integers pass through unchanged (no precision
//! loss for large `u64` credit balances), and floats are rounded to the nearest
//! integer. Negative / non-finite values clamp to `0`.

use serde::{Deserialize, Deserializer};
use serde_json::Number;

/// Coerce a parsed JSON number to `u64`. Exact non-negative integers pass
/// through; floats are rounded; anything negative / non-finite becomes `0`.
fn coerce_to_u64(number: &Number) -> u64 {
  if let Some(unsigned) = number.as_u64() {
    return unsigned;
  }
  if let Some(float) = number.as_f64() {
    if float.is_finite() && float >= 0.0 {
      return float.round() as u64;
    }
  }
  0
}

fn coerce_to_u32(number: &Number) -> u32 {
  coerce_to_u64(number).min(u32::MAX as u64) as u32
}

/// `#[serde(deserialize_with = "...")]` for a required `u64` field that may
/// arrive as an integer or a float.
pub fn de_u64_int_or_float<'de, D>(deserializer: D) -> Result<u64, D::Error>
where
  D: Deserializer<'de>,
{
  let number = Number::deserialize(deserializer)?;
  Ok(coerce_to_u64(&number))
}

/// `#[serde(deserialize_with = "...")]` for an optional `u64` field (handles
/// `null` / missing as `None`).
pub fn de_opt_u64_int_or_float<'de, D>(deserializer: D) -> Result<Option<u64>, D::Error>
where
  D: Deserializer<'de>,
{
  let maybe_number = Option::<Number>::deserialize(deserializer)?;
  Ok(maybe_number.as_ref().map(coerce_to_u64))
}

/// `#[serde(deserialize_with = "...")]` for an optional `u32` field (handles
/// `null` / missing as `None`).
pub fn de_opt_u32_int_or_float<'de, D>(deserializer: D) -> Result<Option<u32>, D::Error>
where
  D: Deserializer<'de>,
{
  let maybe_number = Option::<Number>::deserialize(deserializer)?;
  Ok(maybe_number.as_ref().map(coerce_to_u32))
}

/// `#[serde(deserialize_with = "...")]` for a required `u32` field that may
/// arrive as an integer or a float.
pub fn de_u32_int_or_float<'de, D>(deserializer: D) -> Result<u32, D::Error>
where
  D: Deserializer<'de>,
{
  let number = Number::deserialize(deserializer)?;
  Ok(coerce_to_u32(&number))
}

#[cfg(test)]
mod tests {
  use super::*;

  #[derive(Deserialize)]
  struct U32Holder {
    #[serde(deserialize_with = "de_u32_int_or_float")]
    value: u32,
  }

  #[derive(Deserialize)]
  struct U64Holder {
    #[serde(deserialize_with = "de_u64_int_or_float")]
    value: u64,
  }

  #[derive(Deserialize)]
  struct OptU32Holder {
    #[serde(default, deserialize_with = "de_opt_u32_int_or_float")]
    value: Option<u32>,
  }

  fn parse_u32(json: &str) -> u32 {
    serde_json::from_str::<U32Holder>(json).unwrap().value
  }

  fn parse_u64(json: &str) -> u64 {
    serde_json::from_str::<U64Holder>(json).unwrap().value
  }

  #[test]
  fn u32_accepts_integer() {
    assert_eq!(parse_u32(r#"{"value": 568}"#), 568);
  }

  #[test]
  fn u32_accepts_float_and_rounds() {
    assert_eq!(parse_u32(r#"{"value": 568.5}"#), 569);
    assert_eq!(parse_u32(r#"{"value": 568.4}"#), 568);
  }

  #[test]
  fn u64_accepts_integer_exactly() {
    // Large value that would lose precision via f64 — must pass through exact.
    assert_eq!(parse_u64(r#"{"value": 372215}"#), 372215);
  }

  #[test]
  fn u64_accepts_float_and_rounds() {
    assert_eq!(parse_u64(r#"{"value": 372215.18}"#), 372215);
  }

  #[test]
  fn negative_and_nonfinite_clamp_to_zero() {
    assert_eq!(parse_u64(r#"{"value": -5}"#), 0);
    assert_eq!(parse_u64(r#"{"value": -5.5}"#), 0);
  }

  #[test]
  fn optional_handles_null_missing_and_values() {
    assert_eq!(serde_json::from_str::<OptU32Holder>(r#"{"value": null}"#).unwrap().value, None);
    assert_eq!(serde_json::from_str::<OptU32Holder>(r#"{}"#).unwrap().value, None);
    assert_eq!(serde_json::from_str::<OptU32Holder>(r#"{"value": 12.9}"#).unwrap().value, Some(13));
    assert_eq!(serde_json::from_str::<OptU32Holder>(r#"{"value": 12}"#).unwrap().value, Some(12));
  }
}
