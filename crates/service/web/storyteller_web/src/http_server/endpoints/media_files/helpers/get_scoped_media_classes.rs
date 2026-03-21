use std::collections::HashSet;

use enums_db::by_table::media_files::media_file_class::MediaFileClass;

pub fn get_scoped_media_classes(
  maybe_query_param: Option<&str>
) -> Option<HashSet<MediaFileClass>> {

  let classes = match maybe_query_param {
    None => return None,
    Some(classes) => classes,
  };

  // NB: This silently fails on invalid values. Probably not the best tactic.
  let classes = classes.split(",")
      .map(|ty| MediaFileClass::from_str(ty))
      .flatten()
      .collect::<HashSet<_>>();

  if classes.is_empty() {
    return None;
  }

  if classes.len() == 1 && classes.contains(&MediaFileClass::Unknown) {
    // NB(bt,2025-01-31): The frontend started passing simply "unknown" to the API in development
    // for some reason. Not sure why. There's no product reason for this to be a filter.
    return None;
  }

  Some(classes)
}

#[cfg(test)]
mod test {
  use std::collections::HashSet;

  use enums_db::by_table::media_files::media_file_class::MediaFileClass;

  use crate::http_server::endpoints::media_files::helpers::get_scoped_media_classes::get_scoped_media_classes;

  #[test]
  fn none() {
    assert_eq!(get_scoped_media_classes(None), None);
  }

  #[test]
  fn empty() {
    assert_eq!(get_scoped_media_classes(Some("")), None);
  }

  #[test]
  fn not_just_unknown() {
    assert_eq!(get_scoped_media_classes(Some("unknown")), None);
    assert_eq!(get_scoped_media_classes(Some("unknown,,")), None);
  }

  #[test]
  fn garbage() {
    assert_eq!(get_scoped_media_classes(Some("foo,bar,baz")), None);
  }

  #[test]
  fn valid_scope() {
    assert_eq!(
      get_scoped_media_classes(Some("image,video")),
      Some(HashSet::from([MediaFileClass::Image, MediaFileClass::Video])));
  }
}
