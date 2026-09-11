
pub fn round_two_decimals(f: f64) -> f64 {
  // rounded = round(float(f), 2)
  let rounded = (f * 100.0).round() / 100.0; // NB: Round to two places like Python
  rounded
}

#[cfg(test)]
mod tests {
  use crate::requests::index_page::signature::round_two_decimals::round_two_decimals;

  #[test]
  fn test() {
    assert_eq!(round_two_decimals(0.1234), 0.12);
    assert_eq!(round_two_decimals(1.00001), 1.0);
    assert_eq!(round_two_decimals(-5.0003), -5.0);
    assert_eq!(round_two_decimals(1234.0001), 1234.0);
  }
}