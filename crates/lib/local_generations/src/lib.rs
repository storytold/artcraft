//! Images generated without an ArtCraft account (fal and OpenRouter, on the user's own key).
//! There's no cloud library to upload them to, so they're kept in `local_generations/` under the
//! app data root, each beside a small JSON sidecar (`<id>.json`) with its prompt and model. The
//! folder is the source of truth, so both desktop apps show each other's images, and there's no
//! shared index for two running apps to race on.

use std::path::{Path, PathBuf};

use log::warn;
use serde::{Deserialize, Serialize};

pub const LOCAL_GENERATIONS_DIRNAME: &str = "local_generations";

/// Local images' ids start with this; feeds use the id where library items have a media token.
pub const LOCAL_TOKEN_PREFIX: &str = "local_file_";

const IMAGE_EXTENSIONS: [&str; 5] = ["png", "jpg", "jpeg", "webp", "gif"];

/// An image kept on this computer.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct LocalGeneration {
  /// `local_file_<uuid>`.
  pub id: String,
  pub path: PathBuf,
  pub prompt: String,
  /// The model's id, eg. `nano_banana_pro`.
  pub model_id: String,
  /// Who made it, eg. `open_router` or `fal`.
  pub provider: String,
  /// Unix seconds.
  pub created_at: i64,
}

/// What's known about an image when it's kept.
pub struct LocalGenerationDetails<'a> {
  pub prompt: &'a str,
  pub model_id: &'a str,
  pub provider: &'a str,
}

/// The sidecar beside each image.
#[derive(Serialize, Deserialize)]
struct Sidecar {
  prompt: String,
  model_id: String,
  provider: String,
  created_at: i64,
}

pub fn local_generations_dir(data_root: &Path) -> PathBuf {
  data_root.join(LOCAL_GENERATIONS_DIRNAME)
}

/// Writes `bytes` as a new image (`extension` without the dot) with its sidecar. An extension
/// `list` wouldn't show is replaced by the PNG/JPEG/WebP/GIF type in the bytes, else it's an error.
pub fn keep(data_root: &Path, bytes: &[u8], extension: &str, details: LocalGenerationDetails<'_>) -> anyhow::Result<LocalGeneration> {
  let id = format!("{LOCAL_TOKEN_PREFIX}{}", uuid::Uuid::new_v4().simple());
  write_image(data_root, id, bytes, extension, details)
}

/// Like [`keep`], but under an id made from `seed` (eg. a task id and result index): keeping the
/// same seed again overwrites, so a retry can't keep an image twice.
pub fn keep_as(data_root: &Path, seed: &str, bytes: &[u8], extension: &str, details: LocalGenerationDetails<'_>) -> anyhow::Result<LocalGeneration> {
  anyhow::ensure!(!seed.is_empty(), "a kept image needs an id");
  let sanitized: String = seed.chars().map(|c| if c.is_ascii_alphanumeric() { c } else { '_' }).collect();
  write_image(data_root, format!("{LOCAL_TOKEN_PREFIX}{sanitized}"), bytes, extension, details)
}

/// Every local image, newest first. Images without a readable sidecar are dated by their file.
pub fn list(data_root: &Path) -> Vec<LocalGeneration> {
  let Ok(entries) = std::fs::read_dir(local_generations_dir(data_root)) else {
    return Vec::new();
  };
  let mut images: Vec<LocalGeneration> = entries.flatten().filter_map(|entry| read_image(&entry.path())).collect();
  images.sort_by(|a, b| b.created_at.cmp(&a.created_at).then_with(|| a.id.cmp(&b.id)));
  images
}

/// Deletes an image and its sidecar. Returns whether `id` was one of ours.
pub fn delete(data_root: &Path, id: &str) -> bool {
  if !is_local_token(id) {
    return false;
  }
  let dir = local_generations_dir(data_root);
  let Some(path) = IMAGE_EXTENSIONS.iter().map(|ext| dir.join(format!("{id}.{ext}"))).find(|path| path.is_file()) else {
    return false;
  };
  for path in [path.with_extension("json"), path] {
    if let Err(err) = std::fs::remove_file(&path) {
      if err.kind() != std::io::ErrorKind::NotFound {
        warn!("Couldn't delete {}: {err}", path.display());
      }
    }
  }
  true
}

/// The extension an image is kept under (lowercase, without the dot), or `None` if it can't be
/// kept: only PNG, JPEG, WebP and GIF are, by `extension` or else by the type in the bytes.
pub fn image_extension_for(bytes: &[u8], extension: &str) -> Option<&'static str> {
  IMAGE_EXTENSIONS.into_iter().find(|ext| ext.eq_ignore_ascii_case(extension)).or_else(|| sniff_image_extension(bytes))
}

pub fn is_local_token(token: &str) -> bool {
  token.starts_with(LOCAL_TOKEN_PREFIX) && token.len() > LOCAL_TOKEN_PREFIX.len() && token.chars().all(|c| c.is_ascii_alphanumeric() || c == '_')
}

fn write_image(data_root: &Path, id: String, bytes: &[u8], extension: &str, details: LocalGenerationDetails<'_>) -> anyhow::Result<LocalGeneration> {
  let extension = image_extension_for(bytes, extension)
    .ok_or_else(|| anyhow::anyhow!("can't keep a .{extension} file: only PNG, JPEG, WebP and GIF images are kept"))?;
  let dir = local_generations_dir(data_root);
  std::fs::create_dir_all(&dir)?;
  let path = dir.join(format!("{id}.{extension}"));
  let sidecar = Sidecar { prompt: details.prompt.to_owned(), model_id: details.model_id.to_owned(), provider: details.provider.to_owned(), created_at: chrono::Utc::now().timestamp() };
  // The sidecar goes first: an image without one still lists, but not the other way around.
  std::fs::write(dir.join(format!("{id}.json")), serde_json::to_vec_pretty(&sidecar)?)?;
  std::fs::write(&path, bytes)?;
  Ok(LocalGeneration { id, path, prompt: sidecar.prompt, model_id: sidecar.model_id, provider: sidecar.provider, created_at: sidecar.created_at })
}

/// The extension for a PNG, JPEG, WebP or GIF, from its magic bytes.
fn sniff_image_extension(bytes: &[u8]) -> Option<&'static str> {
  if bytes.starts_with(b"\x89PNG\r\n\x1a\n") {
    Some("png")
  } else if bytes.starts_with(&[0xFF, 0xD8, 0xFF]) {
    Some("jpg")
  } else if bytes.len() >= 12 && &bytes[0..4] == b"RIFF" && &bytes[8..12] == b"WEBP" {
    Some("webp")
  } else if bytes.starts_with(b"GIF87a") || bytes.starts_with(b"GIF89a") {
    Some("gif")
  } else {
    None
  }
}

fn read_image(path: &Path) -> Option<LocalGeneration> {
  let id = path.file_stem()?.to_str()?;
  let extension = path.extension()?.to_str()?.to_ascii_lowercase();
  if !is_local_token(id) || !IMAGE_EXTENSIONS.contains(&extension.as_str()) || !path.is_file() {
    return None;
  }
  let sidecar = std::fs::read(path.with_extension("json")).ok().and_then(|bytes| serde_json::from_slice::<Sidecar>(&bytes).ok());
  let created_at = sidecar.as_ref().map(|s| s.created_at).unwrap_or_else(|| modified_secs(path));
  let (prompt, model_id, provider) = sidecar.map(|s| (s.prompt, s.model_id, s.provider)).unwrap_or_default();
  Some(LocalGeneration { id: id.to_owned(), path: path.to_path_buf(), prompt, model_id, provider, created_at })
}

fn modified_secs(path: &Path) -> i64 {
  path.metadata().and_then(|m| m.modified()).ok().and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok()).map_or(0, |d| d.as_secs() as i64)
}

#[cfg(test)]
mod tests {
  use super::*;

  const PNG_BYTES: &[u8] = b"\x89PNG\r\n\x1a\n\0\0\0\rIHDR";

  #[test]
  fn kept_images_list_newest_first_until_deleted() {
    let root = temp_root();
    let first = keep(&root, b"one", "png", details("a fox")).unwrap();
    let second = keep(&root, b"two", "jpg", details("a cat")).unwrap();
    assert!(is_local_token(&first.id));
    assert_eq!(first.path.parent(), Some(root.join("local_generations").as_path()));
    assert_eq!(std::fs::read(&second.path).unwrap(), b"two");
    let listed = list(&root);
    assert_eq!(listed.len(), 2);
    assert!(listed.contains(&first) && listed.contains(&second));
    assert!(listed[0].created_at >= listed[1].created_at);
    assert!(delete(&root, &first.id));
    assert!(!first.path.exists() && !first.path.with_extension("json").exists());
    assert_eq!(list(&root), vec![second]);
    let _ = std::fs::remove_dir_all(root);
  }

  #[test]
  fn other_files_are_ignored_and_never_deleted() {
    let root = temp_root();
    let dir = local_generations_dir(&root);
    std::fs::create_dir_all(&dir).unwrap();
    std::fs::write(dir.join("notes.png"), b"x").unwrap();
    std::fs::write(dir.join("local_file_abc.txt"), b"x").unwrap();
    assert!(list(&root).is_empty());
    assert!(!delete(&root, "../notes"), "ids can't reach outside the folder");
    assert!(!delete(&root, "mf_library_token"));
    let _ = std::fs::remove_dir_all(root);
  }

  #[test]
  fn images_without_a_sidecar_still_list() {
    let root = temp_root();
    let kept = keep(&root, b"img", "webp", details("lost")).unwrap();
    std::fs::remove_file(kept.path.with_extension("json")).unwrap();
    let listed = list(&root);
    assert_eq!((listed[0].id.as_str(), listed[0].prompt.as_str()), (kept.id.as_str(), ""));
    assert!(listed[0].created_at > 0, "dated by the file");
    let _ = std::fs::remove_dir_all(root);
  }

  #[test]
  fn unlisted_extensions_are_detected_from_the_bytes() {
    let root = temp_root();
    let kept = keep(&root, PNG_BYTES, "bin", details("a fox")).unwrap();
    assert_eq!(kept.path.extension().and_then(|e| e.to_str()), Some("png"));
    assert_eq!(list(&root), vec![kept.clone()]);
    assert!(delete(&root, &kept.id), "kept images can be deleted");
    assert!(keep(&root, b"<svg xmlns=\"http://www.w3.org/2000/svg\"/>", "svg", details("a cat")).is_err());
    assert_eq!(std::fs::read_dir(local_generations_dir(&root)).unwrap().count(), 0, "nothing unlistable is written");
    let _ = std::fs::remove_dir_all(root);
  }

  #[test]
  fn keeping_as_the_same_id_overwrites() {
    let root = temp_root();
    let first = keep_as(&root, "task_ab-c:0", b"one", "png", details("a fox")).unwrap();
    let second = keep_as(&root, "task_ab-c:0", b"two", "png", details("a fox")).unwrap();
    assert!(is_local_token(&first.id));
    assert_eq!(first.id, second.id);
    assert_eq!(list(&root), vec![second.clone()], "a retry keeps nothing new");
    assert_eq!(std::fs::read(&second.path).unwrap(), b"two");
    assert!(keep_as(&root, "", b"one", "png", details("a fox")).is_err());
    assert!(keep_as(&root, "x", b"<svg/>", "svg", details("a fox")).is_err());
    let _ = std::fs::remove_dir_all(root);
  }

  #[test]
  fn keepable_image_types_are_recognised() {
    assert_eq!(image_extension_for(b"one", "PNG"), Some("png"));
    assert_eq!(image_extension_for(b"one", "jpeg"), Some("jpeg"));
    assert_eq!(image_extension_for(PNG_BYTES, "bin"), Some("png"));
    assert_eq!(image_extension_for(b"<svg xmlns=\"http://www.w3.org/2000/svg\"/>", "svg"), None);
    assert_eq!(image_extension_for(b"text", "bin"), None);
  }

  /// Deleting looks up the one image by name: it works where the folder can't even be listed.
  #[cfg(unix)]
  #[test]
  fn deleting_one_of_many_does_not_list_the_folder() {
    use std::os::unix::fs::PermissionsExt;
    let root = temp_root();
    let kept: Vec<LocalGeneration> = (0..5).map(|i| keep_as(&root, &format!("task_{i}"), b"img", "PNG", details("a fox")).unwrap()).collect();
    let dir = local_generations_dir(&root);
    std::fs::set_permissions(&dir, std::fs::Permissions::from_mode(0o300)).unwrap();
    let deleted = delete(&root, &kept[2].id);
    std::fs::set_permissions(&dir, std::fs::Permissions::from_mode(0o755)).unwrap();
    assert!(deleted, "found without reading the folder");
    assert!(!kept[2].path.exists() && !kept[2].path.with_extension("json").exists());
    assert_eq!(list(&root).len(), 4, "only that one is deleted");
    assert!(!delete(&root, &kept[2].id), "already gone");
    let _ = std::fs::remove_dir_all(root);
  }

  fn details(prompt: &str) -> LocalGenerationDetails<'_> {
    LocalGenerationDetails { prompt, model_id: "nano_banana", provider: "open_router" }
  }

  fn temp_root() -> PathBuf {
    std::env::temp_dir().join(format!("local-generations-{}", uuid::Uuid::new_v4()))
  }
}
