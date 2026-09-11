const MAX_I64 : u64 = i64::MAX as u64;

/// Convert a u64 to a positive i64, saturating to i64::MAX if the u64 overflows the container.
pub fn u64_to_i64_saturating(num: u64) -> i64 {
  if num > MAX_I64 {
    return i64::MAX;
  } else {
    num as i64
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn zero() {
    assert_eq!(u64_to_i64_saturating(0), 0);
  }

  #[test]
  fn one() {
    assert_eq!(u64_to_i64_saturating(1), 1);
  }

  #[test]
  fn u64_max() {
    assert_eq!(u64_to_i64_saturating(u64::MAX), i64::MAX);
  }

  #[test]
  fn i32_max() {
    assert_eq!(u64_to_i64_saturating(i64::MAX as u64), i64::MAX);
  }

  #[test]
  fn i32_max_plus_one() {
    assert_eq!(u64_to_i64_saturating(i64::MAX as u64 + 1), i64::MAX);
  }

  #[test]
  fn i32_max_minus_one() {
    assert_eq!(u64_to_i64_saturating(i64::MAX as u64 - 1), i64::MAX - 1);
  }
}
