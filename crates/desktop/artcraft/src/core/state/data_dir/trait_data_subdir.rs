use std::path::Path;

pub trait DataSubdir  : Sized {
  const DIRECTORY_NAME: &'static str;

  fn new_from<P: AsRef<Path>>(dir: P) -> Self;

  fn path(&self) -> &Path;

  fn get_or_create_in_root_dir<P: AsRef<Path>>(root_dir: P) -> anyhow::Result<Self> {
    Self::get_or_create_dir(root_dir.as_ref().join(Self::DIRECTORY_NAME))
  }

  fn get_or_create_dir<P: AsRef<Path>>(dir: P) -> anyhow::Result<Self> {
    let mut dir = dir.as_ref().to_path_buf();

    match dir.canonicalize() {
      Ok(d) => dir = d,
      Err(err) => {
        println!("Error canonicalizing {:?}: {}", dir, err);
      }
    }

    if !dir.exists() {
      println!("Creating directory {:?}", dir);
      std::fs::create_dir(&dir)?;
    }

    Ok(Self::new_from(dir))
  }
}
