use std::collections::HashSet;

use enums::by_table::model_weights::weights_types::WeightsType;

/// Parse a comma-separated list of WeightsType strings into a HashSet
pub fn get_scoped_weights_types(
  maybe_query_param: Option<&str>
) -> Option<HashSet<WeightsType>> {

  let weights_types = match maybe_query_param {
    None => return None,
    Some(weights_types) => weights_types,
  };

  // NB: This silently fails on invalid values. Probably not the best tactic.
  let weights_types = weights_types.split(",")
      .map(|ty| WeightsType::from_str(ty))
      .flatten()
      .collect::<HashSet<_>>();

  if weights_types.is_empty() {
    return None;
  }

  Some(weights_types)
}

#[cfg(test)]
mod test {
  use std::collections::HashSet;

  use enums::by_table::model_weights::weights_types::WeightsType;

  use crate::http_server::endpoints::weights::helpers::get_scoped_weights_types::get_scoped_weights_types;

  #[test]
  fn none() {
    assert_eq!(get_scoped_weights_types(None), None)
  }

  #[test]
  fn empty() {
    assert_eq!(get_scoped_weights_types(Some("")), None)
  }

  #[test]
  fn garbage() {
    assert_eq!(get_scoped_weights_types(Some("foo,bar,baz")), None)
  }

  #[test]
  fn valid_scope() {
    assert_eq!(
      get_scoped_weights_types(Some("tt2,gpt_so_vits,vall_e")),
      Some(HashSet::from([WeightsType::GptSoVits, WeightsType::Tacotron2, WeightsType::VallE])))
  }
}
