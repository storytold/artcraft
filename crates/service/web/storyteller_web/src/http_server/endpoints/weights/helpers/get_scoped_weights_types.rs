use enums_api::by_table::model_weights::weights_types::WeightsType as ApiWeightsType;
use enums_convert::by_table::model_weights::weights_types::weights_type_to_db;
use enums_db::by_table::model_weights::weights_types::WeightsType as DbWeightsType;
use std::collections::HashSet;


/// Read the interface as WeightsTypes, but convert them to internal WeightsTypes
pub fn get_scoped_weights_types(
  maybe_query_param: Option<&str>
) -> Option<HashSet<DbWeightsType>> {
  match get_scoped_public_weights_types(maybe_query_param) {
    None => None,
    Some(weights_types) => {
      Some(weights_types.iter()
          .copied()
          .map(weights_type_to_db)
          .collect::<HashSet<_>>())
    },
  }
}

fn get_scoped_public_weights_types(
  maybe_query_param: Option<&str>
) -> Option<HashSet<ApiWeightsType>> {

  let weights_types = match maybe_query_param {
    None => return None,
    Some(weights_types) => weights_types,
  };

  // NB: This silently fails on invalid values. Probably not the best tactic.
  let weights_types = weights_types.split(",")
      .map(|ty| ApiWeightsType::from_str(ty))
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


  use enums_api::by_table::model_weights::weights_types::WeightsType as ApiWeightsType;
  use enums_db::by_table::model_weights::weights_types::WeightsType as DbWeightsType;
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
      Some(HashSet::from([ApiWeightsType::Tacotron2_5, ApiWeightsType::Tacotron2, ApiWeightsType::VallE])))
  }

  #[test]
  fn valid_scope_internal_types() {
    assert_eq!(
      get_scoped_weights_types(Some("tt2,tacotron2.5,vall_e")),
      Some(HashSet::from([DbWeightsType::GptSoVits, DbWeightsType::Tacotron2, DbWeightsType::VallE])))
  }
}
