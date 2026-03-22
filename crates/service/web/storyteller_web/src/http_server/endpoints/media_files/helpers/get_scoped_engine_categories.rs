use std::collections::HashSet;

use enums_db::by_table::media_files::media_file_engine_category::MediaFileEngineCategory;

pub fn get_scoped_engine_categories(
  maybe_query_param: Option<&str>
) -> Option<HashSet<MediaFileEngineCategory>> {

  let categories = match maybe_query_param {
    None => return None,
    Some(categories) => categories,
  };

  // NB: This silently fails on invalid values. Probably not the best tactic.
  let categories = categories.split(",")
      .map(|ty| MediaFileEngineCategory::from_str(ty))
      .flatten()
      .collect::<HashSet<_>>();

  if categories.is_empty() {
    return None;
  }

  Some(categories)
}

#[cfg(test)]
mod test {
  use std::collections::HashSet;

  use enums_db::by_table::media_files::media_file_engine_category::MediaFileEngineCategory;

  use crate::http_server::endpoints::media_files::helpers::get_scoped_engine_categories::get_scoped_engine_categories;

  #[test]
  fn none() {
    assert_eq!(get_scoped_engine_categories(None), None)
  }

  #[test]
  fn empty() {
    assert_eq!(get_scoped_engine_categories(Some("")), None)
  }

  #[test]
  fn garbage() {
    assert_eq!(get_scoped_engine_categories(Some("foo,bar,baz")), None)
  }

  #[test]
  fn valid_scope() {
    assert_eq!(
      get_scoped_engine_categories(Some("object,character")),
      Some(HashSet::from([MediaFileEngineCategory::Object, MediaFileEngineCategory::Character])))
  }
}
