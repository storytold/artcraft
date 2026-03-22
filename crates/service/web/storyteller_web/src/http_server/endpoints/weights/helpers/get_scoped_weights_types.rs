use std::collections::HashSet;

use enums_db::by_table::model_weights::weights_types::WeightsType;
use enums_public::by_table::model_weights::public_weights_types::PublicWeightsType;

/// Read the interface as PublicWeightsTypes, but convert them to internal WeightsTypes
pub fn get_scoped_weights_types(
  maybe_query_param: Option<&str>
) -> Option<HashSet<WeightsType>> {
  match get_scoped_public_weights_types(maybe_query_param) {
    None => None,
    Some(weights_types) => {
      Some(weights_types.iter()
          .map(|ty| ty.to_enum())
          .collect::<HashSet<_>>())
    },
  }
}

fn get_scoped_public_weights_types(
  maybe_query_param: Option<&str>
) -> Option<HashSet<PublicWeightsType>> {

  let weights_types = match maybe_query_param {
    None => return None,
    Some(weights_types) => weights_types,
  };

  // NB: This silently fails on invalid values. Probably not the best tactic.
  let weights_types = weights_types.split(",")
      .map(|ty| PublicWeightsType::from_str(ty))
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

  use enums_db::by_table::model_weights::weights_types::WeightsType;
  use enums_public::by_table::model_weights::public_weights_types::PublicWeightsType;

  use crate::http_server::endpoints::weights::helpers::get_scoped_weights_types::{get_scoped_public_weights_types, get_scoped_weights_types};

  #[test]
  fn none() {
    assert_eq!(get_scoped_public_weights_types(None), None)
  }

  #[test]
  fn empty() {
    assert_eq!(get_scoped_public_weights_types(Some("")), None)
  }

  #[test]
  fn garbage() {
    assert_eq!(get_scoped_public_weights_types(Some("foo,bar,baz")), None)
  }

  #[test]
  fn valid_scope() {
    assert_eq!(
      get_scoped_public_weights_types(Some("tt2,tacotron2.5,vall_e")),
      Some(HashSet::from([PublicWeightsType::Tacotron2_5, PublicWeightsType::Tacotron2, PublicWeightsType::VallE])))
  }

  #[test]
  fn valid_scope_internal_types() {
    assert_eq!(
      get_scoped_weights_types(Some("tt2,tacotron2.5,vall_e")),
      Some(HashSet::from([WeightsType::GptSoVits, WeightsType::Tacotron2, WeightsType::VallE])))
  }
}
