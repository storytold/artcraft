use std::ops::{AddAssign, MulAssign};
use std::str::FromStr;

/// Convert string values to numerics
/// The trait bounds aren't perfect, but are close enough.
/// This is probably inferior to just using `u32::from_str` directly, but it
/// serves as good documentation on generics.
pub fn try_str_to_num<T>(input: &str) -> Result<T, <T as FromStr>::Err>
  where T: FromStr + Copy + AddAssign + MulAssign
{
  let value = T::from_str(input)?;
  Ok(value)
}

#[cfg(test)]
mod tests {
  use crate::try_str_to_num::try_str_to_num;

  mod u8 {
    use super::*;

    #[test]
    fn parse() {
      assert_eq!(try_str_to_num::<u8>("0"), Ok(0u8));
      assert_eq!(try_str_to_num::<u8>("1"), Ok(1u8));
      assert_eq!(try_str_to_num::<u8>("5"), Ok(5u8));
      assert_eq!(try_str_to_num::<u8>("123"), Ok(123u8));
      assert_eq!(try_str_to_num::<u8>("255"), Ok(255u8));
    }

    #[test]
    fn true_values() {
      assert!(try_str_to_num::<u8>("").is_err());
      assert!(try_str_to_num::<u8>("-1").is_err());
      assert!(try_str_to_num::<u8>("256").is_err());
      assert!(try_str_to_num::<u8>("foo").is_err());
    }
  }

  mod i8 {
    use super::*;

    #[test]
    fn parse() {
      assert_eq!(try_str_to_num::<i8>("0"), Ok(0i8));
      assert_eq!(try_str_to_num::<i8>("1"), Ok(1i8));
      assert_eq!(try_str_to_num::<i8>("5"), Ok(5i8));
      assert_eq!(try_str_to_num::<i8>("123"), Ok(123i8));
      assert_eq!(try_str_to_num::<i8>("-1"), Ok(-1i8));
    }

    #[test]
    fn true_values() {
      assert!(try_str_to_num::<i8>("").is_err());
      assert!(try_str_to_num::<i8>("128").is_err());
      assert!(try_str_to_num::<i8>("256").is_err());
      assert!(try_str_to_num::<i8>("foo").is_err());
    }
  }

  mod u32 {
    use super::*;

    #[test]
    fn parse() {
      assert_eq!(try_str_to_num::<u32>("0"), Ok(0u32));
      assert_eq!(try_str_to_num::<u32>("1"), Ok(1u32));
      assert_eq!(try_str_to_num::<u32>("5"), Ok(5u32));
      assert_eq!(try_str_to_num::<u32>("123"), Ok(123u32));
      assert_eq!(try_str_to_num::<u32>("255"), Ok(255u32));
    }

    #[test]
    fn true_values() {
      assert!(try_str_to_num::<u32>("").is_err());
      assert!(try_str_to_num::<u32>("-1").is_err());
      assert!(try_str_to_num::<u32>("foo").is_err());
    }
  }
}
