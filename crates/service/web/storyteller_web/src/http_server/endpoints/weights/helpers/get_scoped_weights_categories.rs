use std::collections::HashSet;

use enums_db::by_table::model_weights::weights_category::WeightsCategory;

pub fn get_scoped_weights_categories(
  maybe_query_param: Option<&str>
) -> Option<HashSet<WeightsCategory>> {

  let weights_categories = match maybe_query_param {
    None => return None,
    Some(weights_categories) => weights_categories,
  };

  // NB: This silently fails on invalid values. Probably not the best tactic.
  let weights_categories = weights_categories.split(",")
      .map(|ty| WeightsCategory::from_str(ty))
      .flatten()
      .collect::<HashSet<_>>();

  if weights_categories.is_empty() {
    return None;
  }

  Some(weights_categories)
}

#[cfg(test)]
mod test {
  use std::collections::HashSet;

  use enums_db::by_table::model_weights::weights_category::WeightsCategory;

  use crate::http_server::endpoints::weights::helpers::get_scoped_weights_categories::get_scoped_weights_categories;

  #[test]
  fn none() {
    assert_eq!(get_scoped_weights_categories(None), None)
  }

  #[test]
  fn empty() {
    assert_eq!(get_scoped_weights_categories(Some("")), None)
  }

  #[test]
  fn garbage() {
    assert_eq!(get_scoped_weights_categories(Some("foo,bar,baz")), None)
  }

  #[test]
  fn valid_scope() {
    assert_eq!(
      get_scoped_weights_categories(Some("text_to_speech,voice_conversion")),
      Some(HashSet::from([WeightsCategory::TextToSpeech, WeightsCategory::VoiceConversion])))
  }
}
