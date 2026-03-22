use std::collections::HashSet;

use enums_db::by_table::media_files::media_file_origin_product_category::MediaFileOriginProductCategory;

use crate::http_server::common_requests::auto_product_category::AutoProductCategory;

pub fn get_scoped_product_categories(
  maybe_query_param: Option<&str>
) -> Option<HashSet<MediaFileOriginProductCategory>> {

  let categories = match maybe_query_param {
    None => return None,
    Some(categories) => categories,
  };

  // NB: This silently fails on invalid values. Probably not the best tactic.
  let categories= categories.split(",")
      .map(|c| AutoProductCategory::from_str(c))
      .flatten()
      .fold(HashSet::new(), |mut acc, cat| {
        acc.extend(cat.expand_to_db_product_categories());
        acc
      });

  if categories.is_empty() {
    return None;
  }

  Some(categories)
}

#[cfg(test)]
mod test {
  use std::collections::HashSet;

  use enums_db::by_table::media_files::media_file_origin_product_category::MediaFileOriginProductCategory;

  use crate::http_server::endpoints::media_files::helpers::get_scoped_product_categories::get_scoped_product_categories;

  #[test]
  fn none() {
    assert_eq!(get_scoped_product_categories(None), None)
  }

  #[test]
  fn empty() {
    assert_eq!(get_scoped_product_categories(Some("")), None)
  }

  #[test]
  fn garbage() {
    assert_eq!(get_scoped_product_categories(Some("foo,bar,baz")), None)
  }

  #[test]
  fn direct_map() {
    assert_eq!(
      get_scoped_product_categories(Some("mocap")),
      Some(HashSet::from([
        MediaFileOriginProductCategory::Mocap,
      ]))
    );
    assert_eq!(
      get_scoped_product_categories(Some("face_animator,face_mirror")),
      Some(HashSet::from([
        MediaFileOriginProductCategory::FaceAnimator,
        MediaFileOriginProductCategory::FaceMirror
      ]))
    );
  }

  #[test]
  fn alias_map() {
    assert_eq!(
      get_scoped_product_categories(Some("lipsync")),
      Some(HashSet::from([
        MediaFileOriginProductCategory::FaceAnimator,
      ]))
    );
    assert_eq!(
      get_scoped_product_categories(Some("live_portrait")),
      Some(HashSet::from([
        MediaFileOriginProductCategory::FaceMirror,
      ]))
    );
  }

  #[test]
  fn multi_map() {
    assert_eq!(
      get_scoped_product_categories(Some("voice")),
      Some(HashSet::from([
        MediaFileOriginProductCategory::TextToSpeech,
        MediaFileOriginProductCategory::VoiceConversion,
        MediaFileOriginProductCategory::ZeroShotVoice,
      ]))
    );
  }
}
