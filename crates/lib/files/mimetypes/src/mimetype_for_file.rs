use std::path::Path;

const DEFAULT_BINARY_MIMETYPE : &str = "application/octet-stream";

pub fn get_mimetype_for_file<P: AsRef<Path>>(file: P) -> std::io::Result<Option<&'static str>> {
  infer::get_from_path(file)
      .map(|maybe_type| maybe_type.map(|typ| typ.mime_type()))
}

pub fn get_mimetype_for_file_or_default<P: AsRef<Path>>(file: P) -> std::io::Result<&'static str> {
  get_mimetype_for_file(file)
      .map(|maybe_type| match maybe_type {
        Some(mimetype) => mimetype,
        None => DEFAULT_BINARY_MIMETYPE,
      })
}

#[cfg(test)]
mod tests {
  use std::path::PathBuf;

  use crate::mimetype_for_file::get_mimetype_for_file;

  fn test_file(path_from_repo_root: &str) -> PathBuf {
    // https://doc.rust-lang.org/cargo/reference/environment-variables.html
    let mut path = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    path.push(format!("../../../../{}", path_from_repo_root));
    path
  }

  #[test]
  fn test_mimetype_mp3() {
    let path = test_file("test_data/audio/mp3/super_mario_rpg_beware_the_forests_mushrooms.mp3");

    assert_eq!(get_mimetype_for_file(&path).unwrap(), Some("audio/mpeg"));
  }

  #[test]
  fn test_mimetype_unknown() {
    let path = test_file("test_data/video/mp4/golden_sun_garoh.mp4");

    assert_eq!(get_mimetype_for_file(&path).unwrap(), Some("video/mp4"));
  }
}
