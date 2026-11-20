//! Probes `CRAFT_FONTS_DIR` at compile time for an optional Hebrew UI font (`NotoSansHebrew-Regular.ttf`)
//! without embedding third-party binary font assets into the repository.

use std::path::{Path, PathBuf};

const HEBREW_FONT_NAME: &str = "NotoSansHebrew-Regular.ttf";

fn absolutize(path: &Path) -> PathBuf {
  if path.is_absolute() {
    path.to_path_buf()
  } else {
    std::env::current_dir().map(|cwd| cwd.join(path)).unwrap_or_else(|_| path.to_path_buf())
  }
}

fn main() {
  println!("cargo::rustc-check-cfg=cfg(has_hebrew_craft_font)");
  println!("cargo::rerun-if-env-changed=CRAFT_FONTS_DIR");
  let Ok(dir) = std::env::var("CRAFT_FONTS_DIR") else {
    return;
  };
  let dir = dir.trim();
  if dir.is_empty() {
    return;
  }
  let abs_dir = absolutize(Path::new(dir));
  println!("cargo::rerun-if-changed={}", abs_dir.display());
  let sub_dir = abs_dir.join("fonts/noto-sans-hebrew");
  if sub_dir.is_dir() {
    println!("cargo::rerun-if-changed={}", sub_dir.display());
  }
  let candidates = [abs_dir.join(HEBREW_FONT_NAME), sub_dir.join(HEBREW_FONT_NAME)];
  if let Some(found) = candidates.into_iter().find(|p| p.is_file()) {
    let abs = std::fs::canonicalize(&found).unwrap_or(found);
    println!("cargo::rerun-if-changed={}", abs.display());
    println!("cargo::rustc-env=HEBREW_CRAFT_FONT_PATH={}", abs.display());
    println!("cargo::rustc-cfg=has_hebrew_craft_font");
  }
}
