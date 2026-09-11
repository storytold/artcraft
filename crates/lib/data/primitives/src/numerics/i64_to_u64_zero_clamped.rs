/// Convert an i64 to a u64. If the i64 is negative, return 0.
pub fn i64_to_u64_zero_clamped(num: i64) -> u64 {
  if num < 0 {
    return 0
  } else {
    num as u64
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn zero() {
    assert_eq!(i64_to_u64_zero_clamped(0), 0);
  }

  #[test]
  fn one() {
    assert_eq!(i64_to_u64_zero_clamped(1), 1);
  }

  #[test]
  fn negative_one() {
    assert_eq!(i64_to_u64_zero_clamped(-1), 0);
  }

  #[test]
  fn i32_min() {
    assert_eq!(i64_to_u64_zero_clamped(i64::MIN), 0);
  }

  #[test]
  fn i32_max() {
    assert_eq!(i64_to_u64_zero_clamped(i64::MAX), u64::MAX / 2);
  }

  #[test]
  fn i32_max_minus_one() {
    assert_eq!(i64_to_u64_zero_clamped(i64::MAX - 1), u64::MAX / 2 - 1);
  }
}
