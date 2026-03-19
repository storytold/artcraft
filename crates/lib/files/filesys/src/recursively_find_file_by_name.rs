use std::path::{Path, PathBuf};
use walkdir::WalkDir;
use errors::AnyhowResult;

pub fn recursively_find_file_by_name<P: AsRef<Path>, Q: AsRef<Path>>(
  search_filename: P,
  search_root: Q,
  max_depth: usize,
) -> AnyhowResult<Option<PathBuf>> {

  let walker = WalkDir::new(search_root)
    .max_depth(max_depth);

  for entry in walker {
    let entry = entry?;
    if entry.path().is_dir() {
      let check_path = entry.path().join(search_filename.as_ref());
      if check_path.exists() && check_path.is_file() {
        return Ok(Some(check_path));
      }
    }
  }

  Ok(None)
}

#[cfg(test)]
mod tests {
  use test_utils::test_file_path::test_file_path;
  use crate::recursively_find_file_by_name::recursively_find_file_by_name;

  #[test]
  fn test_path_exists() {
    let test_data_path = test_file_path("test_data/").expect("should work");
    let result = recursively_find_file_by_name(
      "super_mario_rpg_beware_the_forests_mushrooms.mp3",
      test_data_path,
      5
    );
    let result = result.expect("should be ok");
    let result = result.expect("should exist");
    assert!(result.ends_with("test_data/audio/mp3/super_mario_rpg_beware_the_forests_mushrooms.mp3"));
  }

  #[test]
  fn test_path_does_not_exist() {
    let test_data_path = test_file_path("test_data/").expect("should work");
    let result = recursively_find_file_by_name(
      "fake_name.foo",
      test_data_path,
      5
    );
    let result = result.expect("should be ok");
    assert!(result.is_none());
  }
}