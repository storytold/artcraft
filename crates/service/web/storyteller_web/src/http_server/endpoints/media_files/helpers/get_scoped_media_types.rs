use std::collections::HashSet;

use enums_db::by_table::media_files::media_file_type::MediaFileType;

pub fn get_scoped_media_types(
  maybe_query_param: Option<&str>
) -> Option<HashSet<MediaFileType>> {

  let types = match maybe_query_param {
    None => return None,
    Some(types) => types,
  };

  // NB: This silently fails on invalid values. Probably not the best tactic.
  let types = types.split(",")
      .map(|ty| MediaFileType::from_str(ty))
      .flatten()
      .collect::<HashSet<_>>();

  if types.is_empty() {
    return None;
  }

  Some(types)
}

#[cfg(test)]
mod test {
  use std::collections::HashSet;

  use enums_db::by_table::media_files::media_file_type::MediaFileType;

  use crate::http_server::endpoints::media_files::helpers::get_scoped_media_types::get_scoped_media_types;

  #[test]
  fn none() {
    assert_eq!(get_scoped_media_types(None), None)
  }

  #[test]
  fn empty() {
    assert_eq!(get_scoped_media_types(Some("")), None)
  }

  #[test]
  fn garbage() {
    assert_eq!(get_scoped_media_types(Some("foo,bar,baz")), None)
  }

  #[test]
  fn valid_scope() {
    assert_eq!(
      get_scoped_media_types(Some("scene_json,glb")),
      Some(HashSet::from([MediaFileType::SceneJson, MediaFileType::Glb])))
  }
}
