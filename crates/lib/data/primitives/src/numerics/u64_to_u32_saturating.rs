const MAX_U32 : u64 = u32::MAX as u64;

/// Convert a u64 to a u32, saturating to u32::MAX if the u64 overflows the container.
pub fn u64_to_u32_saturating(num: u64) -> u32 {
  if num > MAX_U32 {
    return u32::MAX;
  } else {
    num as u32
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn zero() {
    assert_eq!(u64_to_u32_saturating(0), 0);
  }

  #[test]
  fn one() {
    assert_eq!(u64_to_u32_saturating(1), 1);
  }

  #[test]
  fn u32_max() {
    assert_eq!(u64_to_u32_saturating(u32::MAX as u64), u32::MAX);
  }

  #[test]
  fn u32_max_plus_one() {
    assert_eq!(u64_to_u32_saturating(u32::MAX as u64 + 1), u32::MAX);
  }

  #[test]
  fn u32_max_minus_one() {
    assert_eq!(u64_to_u32_saturating(u32::MAX as u64 - 1), u32::MAX - 1);
  }

  #[test]
  fn u64_max() {
    assert_eq!(u64_to_u32_saturating(u64::MAX), u32::MAX);
  }

  #[test]
  fn u64_max_minus_one() {
    assert_eq!(u64_to_u32_saturating(u64::MAX - 1), u32::MAX);
  }
}
