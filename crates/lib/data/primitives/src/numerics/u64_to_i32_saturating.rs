const MAX_I32 : u64 = i32::MAX as u64;

/// Convert a u64 to a positive i32, saturating to i32::MAX if the u64 overflows the container.
pub fn u64_to_i32_saturating(num: u64) -> i32 {
  if num > MAX_I32 {
    return i32::MAX;
  } else {
    num as i32
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn zero() {
    assert_eq!(u64_to_i32_saturating(0), 0);
  }

  #[test]
  fn u64_max() {
    assert_eq!(u64_to_i32_saturating(u64::MAX), i32::MAX);
  }

  #[test]
  fn i32_max() {
    assert_eq!(u64_to_i32_saturating(i32::MAX as u64), i32::MAX);
  }

  #[test]
  fn i32_max_plus_one() {
    assert_eq!(u64_to_i32_saturating(i32::MAX as u64 + 1), i32::MAX);
  }

  #[test]
  fn i32_max_minus_one() {
    assert_eq!(u64_to_i32_saturating(i32::MAX as u64 - 1), i32::MAX - 1);
  }
}
