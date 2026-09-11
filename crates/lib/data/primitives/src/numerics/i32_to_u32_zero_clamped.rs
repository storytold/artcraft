/// Convert an i32 to a u32. If the i32 is negative, return 0.
pub fn i32_to_u32_zero_clamped(num: i32) -> u32 {
  if num < 0 {
    return 0
  } else {
    num as u32
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn zero() {
    assert_eq!(i32_to_u32_zero_clamped(0), 0);
  }

  #[test]
  fn one() {
    assert_eq!(i32_to_u32_zero_clamped(1), 1);
  }

  #[test]
  fn negative_one() {
    assert_eq!(i32_to_u32_zero_clamped(-1), 0);
  }

  #[test]
  fn i32_min() {
    assert_eq!(i32_to_u32_zero_clamped(i32::MIN), 0);
  }

  #[test]
  fn i32_max() {
    assert_eq!(i32_to_u32_zero_clamped(i32::MAX), u32::MAX / 2);
  }

  #[test]
  fn i32_max_minus_one() {
    assert_eq!(i32_to_u32_zero_clamped(i32::MAX - 1), u32::MAX / 2 - 1);
  }
}
