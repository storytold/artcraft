
pub fn optional_false_to_none(optional: Option<bool>) -> Option<bool> {
  optional.filter(|&value| value)
}

#[cfg(test)]
mod test {
  #[test]
  fn test_optional_false_to_none() {
    assert_eq!(super::optional_false_to_none(None), None);
    assert_eq!(super::optional_false_to_none(Some(false)), None);
    assert_eq!(super::optional_false_to_none(Some(true)), Some(true));
  }
}
