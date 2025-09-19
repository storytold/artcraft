///
/// Copyright 2020 New Relic Corporation. All rights reserved.
/// SPDX-License-Identifier: Apache-2.0
///

/// Represents any valid attribute value.
///
/// According to the [specification](https://github.com/newrelic/newrelic-telemetry-sdk-specs/blob/master/capabilities.md),
/// attribute values can be a string, numeric, or boolean. A numeric value is
/// represented either as a signed integer, an unsigned integer or a float.
#[derive(serde::Serialize, Debug, PartialEq, Clone)]
#[serde(untagged)]
pub enum Value {
    /// Represents a signed integer attribute value.
    ///
    /// ```
    /// # use newrelic_telemetry::attribute::Value;
    /// #
    /// let v = Value::Int(-3);
    /// ```
    Int(i64),

    /// Represents an unsigned integer attribute value.
    ///
    /// ```
    /// # use newrelic_telemetry::attribute::Value;
    /// #
    /// let v = Value::UInt(42);
    /// ```
    UInt(u64),

    /// Represents a signed 128 bit integer attribute value.
    ///
    /// ```
    /// # use newrelic_telemetry::attribute::Value;
    /// #
    /// let v = Value::Int128(-30);
    /// ```
    Int128(i128),

    /// Represents an unsigned 128 bit integer attribute value.
    ///
    /// ```
    /// # use newrelic_telemetry::attribute::Value;
    /// #
    /// let v = Value::UInt128(30);
    /// ```
    UInt128(u128),

    /// Represents a string attribute value.
    ///
    /// ```
    /// # use newrelic_telemetry::attribute::Value;
    /// #
    /// let v = Value::Str(String::from("root"));
    /// ```
    Str(String),

    /// Represents a float attribute value.
    ///
    /// ```
    /// # use newrelic_telemetry::attribute::Value;
    /// #
    /// let v = Value::Float(3.14159);
    /// ```
    Float(f64),

    /// Represents a bool attribute value.
    ///
    /// ```
    /// # use newrelic_telemetry::attribute::Value;
    /// #
    /// let v = Value::Bool(true);
    /// ```
    Bool(bool),
}

/// Converts an i128 to an attribute value.
///
/// ```
/// # use newrelic_telemetry::attribute::Value;
/// #
/// let v: i128 = -10;
/// assert_eq!(Value::Int128(-10), v.into());
/// ```
impl From<i128> for Value {
    fn from(value: i128) -> Value {
        Value::Int128(value)
    }
}

/// Converts an i64 to an attribute value.
///
/// ```
/// # use newrelic_telemetry::attribute::Value;
/// #
/// let v: i64 = -5;
/// assert_eq!(Value::Int(-5), v.into());
/// ```
impl From<i64> for Value {
    fn from(value: i64) -> Value {
        Value::Int(value)
    }
}

/// Converts an i32 to an attribute value.
///
/// ```
/// # use newrelic_telemetry::attribute::Value;
/// #
/// let v: i32 = -5;
/// assert_eq!(Value::Int(-5), v.into());
/// ```
impl From<i32> for Value {
    fn from(value: i32) -> Value {
        Value::Int(value as i64)
    }
}

/// Converts a u128 to an attribute value.
///
/// ```
/// # use newrelic_telemetry::attribute::Value;
/// #
/// let v: u128 = 50;
/// assert_eq!(Value::UInt128(50), v.into());
/// ```
impl From<u128> for Value {
    fn from(value: u128) -> Value {
        Value::UInt128(value)
    }
}

/// Converts a u64 to an attribute value.
///
/// ```
/// # use newrelic_telemetry::attribute::Value;
/// #
/// let v: u64 = 5;
/// assert_eq!(Value::UInt(5), v.into());
/// ```
impl From<u64> for Value {
    fn from(value: u64) -> Value {
        Value::UInt(value)
    }
}

/// Converts a u32 to an attribute value.
///
/// ```
/// # use newrelic_telemetry::attribute::Value;
/// #
/// let v: u32 = 5;
/// assert_eq!(Value::UInt(5), v.into());
/// ```
impl From<u32> for Value {
    fn from(value: u32) -> Value {
        Value::UInt(value as u64)
    }
}

/// Converts a string to an attribute value.
///
/// ```
/// # use newrelic_telemetry::attribute::Value;
/// #
/// let v = "root";
/// assert_eq!(Value::Str(String::from("root")), v.into());
/// ```
impl From<&str> for Value {
    fn from(value: &str) -> Value {
        Value::Str(value.to_string())
    }
}

/// Converts a f64 to an attribute value.
///
/// ```
/// # use newrelic_telemetry::attribute::Value;
/// #
/// let v: f64 = 3.14159;
/// assert_eq!(Value::Float(v), v.into());
/// ```
impl From<f64> for Value {
    fn from(value: f64) -> Value {
        Value::Float(value)
    }
}

/// Converts a f32 to an attribute value.
///
/// ```
/// # use newrelic_telemetry::attribute::Value;
/// #
/// let v: f32 = 3.14159;
/// assert_eq!(Value::Float(v as f64), v.into());
/// ```
impl From<f32> for Value {
    fn from(value: f32) -> Value {
        Value::Float(value as f64)
    }
}

/// Converts a bool to an attribute value.
///
/// ```
/// # use newrelic_telemetry::attribute::Value;
/// #
/// let v = true;
/// assert_eq!(Value::Bool(true), v.into());
/// ```
impl From<bool> for Value {
    fn from(value: bool) -> Value {
        Value::Bool(value)
    }
}

#[cfg(test)]
mod tests {
  use serde_json::json;

  use super::Value;

  #[test]
    fn value_to_json() {
        // Attribute values should serialize to plain JSON values.
        assert_eq!(json!(Value::Int(-5)), json!(-5));
        assert_eq!(json!(Value::UInt(5)), json!(5));
        assert_eq!(json!(Value::Float(3.14159)), json!(3.14159));
        assert_eq!(json!(Value::Str(String::from("root"))), json!("root"));
        assert_eq!(json!(Value::Bool(true)), json!(true));
    }

    #[test]
    fn into_value() {
        // Should be able to use Value::from or .into() to create Values
        assert_eq!(Value::Int(-5), Value::from(-5));
        assert_eq!(Value::Int(-5), (-5 as i32).into());

        // cast needed because integer types default to i32
        assert_eq!(Value::UInt(5), Value::from(5 as u64));
        assert_eq!(Value::UInt(5), (5 as u64).into());

        assert_eq!(Value::Float(3.14159), Value::from(3.14159));
        assert_eq!(Value::Float(3.14159), (3.14159 as f64).into());

        assert_eq!(Value::Str("root".to_string()), Value::from("root"));
        assert_eq!(Value::Str("root".to_string()), "root".into());

        assert_eq!(Value::Bool(true), Value::from(true));
        assert_eq!(Value::Bool(true), true.into());
    }
}
