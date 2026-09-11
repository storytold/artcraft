
//pub type LazyOptional = Box<dyn Fn() -> Option<bool> + Send>;
pub type LazyOptional<'a> = Box<dyn Fn() -> Option<bool> + 'a>;

/// Lazily evaluate a list of boxed closures that return Option<bool>.
///
///  - If any result in true, return Some(true).
///    The first true will end the evaluation.
///
///  - If none are true, but any result in false, return Some(false).
///
///  - Else, return None
pub fn lazy_any_option_true(functions: &[LazyOptional]) -> Option<bool>
{
  let mut opt_false_found = false;
  for func in functions.iter() {
    match func() {
      Some(true) => return Some(true),
      Some(false) => if !opt_false_found { opt_false_found = true },
      None => continue,
    }
  }
  if opt_false_found {
    Some(false)
  } else {
    None
  }
}

#[cfg(test)]
mod tests {

  #[test]
  fn empty() {
    let result = super::lazy_any_option_true(&[]);
    assert_eq!(result, None);
  }

  #[test]
  fn all_empty() {
    let result = super::lazy_any_option_true(&[
      Box::new(|| None),
      Box::new(|| None),
    ]);
    assert_eq!(result, None);
  }

  #[test]
  fn all_false() {
    let result = super::lazy_any_option_true(&[
      Box::new(|| Some(false)),
      Box::new(|| Some(false)),
    ]);
    assert_eq!(result, Some(false));
  }

  #[test]
  fn mix_false_none() {
    let result = super::lazy_any_option_true(&[
      Box::new(|| None),
      Box::new(|| Some(false)),
      Box::new(|| Some(false)),
      Box::new(|| None),
    ]);
    assert_eq!(result, Some(false));
  }

  #[test]
  fn mix() {
    let result = super::lazy_any_option_true(&[
      Box::new(|| None),
      Box::new(|| Some(false)),
      Box::new(|| Some(true)),
      Box::new(|| Some(false)),
      Box::new(|| None),
    ]);
    assert_eq!(result, Some(true));
  }

  #[test]
  fn mix_closure_capture() {
    let truthy = Some(true);
    let falsy = Some(true);

    let result = super::lazy_any_option_true(&[
      Box::new(|| None),
      Box::new(|| (&falsy).map(|inner| inner.clone())),
      Box::new(|| (&truthy).map(|inner| inner.clone())),
      Box::new(|| (&falsy).map(|inner| inner.clone())),
      Box::new(|| None),
    ]);
    assert_eq!(result, Some(true));
  }
}
