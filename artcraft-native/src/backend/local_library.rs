//! Images made without an ArtCraft account (fal and OpenRouter, on the user's own key), kept on
//! this computer in the `local_generations` crate's folder, which the Tauri app shares: either
//! app shows the other's images.

use std::path::{Path, PathBuf};
use std::sync::Arc;

use local_generations::{LocalGenerationDetails, delete, keep_as, list};

use super::providers::Provider;

pub use local_generations::{LocalGeneration as LocalImage, is_local_token};

/// The local images under the data root.
#[derive(Clone)]
pub struct LocalLibrary {
  data_root: Arc<PathBuf>,
}

impl LocalLibrary {
  pub fn load(data_root: &Path) -> Self {
    Self { data_root: Arc::new(data_root.to_path_buf()) }
  }

  /// Newest first.
  pub fn all(&self) -> Vec<LocalImage> {
    list(&self.data_root)
  }

  /// Writes `bytes` as an image under an id made from `seed` (eg. a job id and result index), and
  /// records its prompt and model. Adding the same seed again overwrites, so a retry can't add twice.
  pub fn add_as(&self, seed: &str, bytes: &[u8], extension: &str, prompt: &str, model_id: &str, provider: Provider) -> anyhow::Result<LocalImage> {
    let provider = provider_name(provider);
    keep_as(&self.data_root, seed, bytes, extension, LocalGenerationDetails { prompt, model_id, provider: &provider })
  }

  /// Deletes an image. Returns whether it was one of ours.
  pub fn delete(&self, id: &str) -> bool {
    delete(&self.data_root, id)
  }
}

/// `file://` plus the path, percent-encoded where URLs need it.
pub fn file_url(path: &Path) -> String {
  url::Url::from_file_path(path).map(String::from).unwrap_or_else(|()| format!("file://{}", path.display()))
}

/// The path behind a `file://` URL.
pub fn file_path(url: &str) -> Option<PathBuf> {
  url::Url::parse(url).ok().filter(|u| u.scheme() == "file").and_then(|u| u.to_file_path().ok())
}

/// The provider as the sidecar records it (its wire name, eg. `open_router`).
fn provider_name(provider: Provider) -> String {
  serde_json::to_value(provider).ok().and_then(|v| v.as_str().map(str::to_owned)).unwrap_or_default()
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn images_survive_a_restart_until_deleted() {
    let dir = temp_root();
    let library = LocalLibrary::load(&dir);
    let image = library.add_as("job_0", b"png bytes", "png", "a fox", "nano_banana", Provider::OpenRouter).unwrap();
    assert!(is_local_token(&image.id));
    assert_eq!((image.provider.as_str(), image.model_id.as_str(), image.prompt.as_str()), ("open_router", "nano_banana", "a fox"));
    assert_eq!(std::fs::read(&image.path).unwrap(), b"png bytes");
    assert_eq!(LocalLibrary::load(&dir).all(), vec![image.clone()]);
    assert!(library.delete(&image.id));
    assert!(!image.path.exists());
    assert!(LocalLibrary::load(&dir).all().is_empty());
    let _ = std::fs::remove_dir_all(dir);
  }

  #[test]
  fn file_urls_round_trip_paths_with_spaces() {
    let path = std::env::temp_dir().join("my images").join("a b.png");
    let url = file_url(&path);
    assert!(url.starts_with("file://") && url.contains("a%20b.png"), "{url}");
    assert_eq!(file_path(&url), Some(path));
    assert_eq!(file_path("https://cdn.example.com/a.png"), None);
  }

  fn temp_root() -> PathBuf {
    std::env::temp_dir().join(format!("artcraft-native-local-{}", uuid::Uuid::new_v4()))
  }
}
