//! Images made without an ArtCraft account (fal and OpenRouter, on the user's own key), kept in
//! the `local_generations` crate's folder (shared with artcraft-native) and shown through Tauri's
//! asset protocol.

use std::path::{Path, PathBuf};

use local_generations::{LOCAL_GENERATIONS_DIRNAME, LocalGenerationDetails, is_local_token, keep_as};
use reqwest::Url;
use tokens::tokens::media_files::MediaFileToken;

use crate::core::state::data_dir::app_data_root::AppDataRoot;

/// An image just kept on this computer.
#[derive(Clone)]
pub struct KeptGeneration {
  /// The image's id as a stand-in media token, so tasks and the frontend can key it.
  pub token: MediaFileToken,
  /// What the webview loads it from (`convertFileSrc`'s URL).
  pub asset_url: Url,
}

/// Writes `bytes` into `local_generations/`, with its prompt and model, under an id made from
/// `seed`: keeping the same seed again overwrites, so retries can't keep an image twice.
pub fn keep_local_generation_as(app_data_root: &AppDataRoot, seed: &str, bytes: &[u8], extension: &str, details: LocalGenerationDetails<'_>) -> anyhow::Result<KeptGeneration> {
  let kept = keep_as(app_data_root.path(), seed, bytes, extension, details)?;
  Ok(KeptGeneration { token: MediaFileToken::new(kept.id), asset_url: asset_url(&kept.path)? })
}

/// Where the webview loads each kept image from; downloads copy these from disk.
pub fn kept_asset_urls(kept: &[KeptGeneration]) -> Vec<Url> {
  kept.iter().map(|k| k.asset_url.clone()).collect()
}

/// The URL Tauri's `convertFileSrc` makes for `path` (the asset protocol is enabled for the
/// whole filesystem in `tauri.conf.json`).
pub fn asset_url(path: &Path) -> anyhow::Result<Url> {
  let encoded = encode_uri_component(&path.to_string_lossy());
  let url = if cfg!(windows) {
    format!("http://asset.localhost/{encoded}")
  } else {
    format!("asset://localhost/{encoded}")
  };
  Ok(Url::parse(&url)?)
}

/// The local image behind an asset URL from [`asset_url`]. Only our own images in
/// `local_generations/` qualify: downloads copy these, and nothing else on disk.
pub fn local_generation_path(url: &Url) -> Option<PathBuf> {
  let is_asset = match url.scheme() {
    "asset" => url.host_str() == Some("localhost"),
    "http" | "https" => url.host_str() == Some("asset.localhost"),
    _ => false,
  };
  if !is_asset {
    return None;
  }
  let path = PathBuf::from(decode_uri_component(url.path().trim_start_matches('/'))?);
  let ours = path.file_stem().and_then(|n| n.to_str()).is_some_and(is_local_token);
  let in_folder = path.parent().and_then(|p| p.file_name()).is_some_and(|d| d == LOCAL_GENERATIONS_DIRNAME);
  (ours && in_folder && path.is_absolute()).then_some(path)
}

/// JavaScript's `encodeURIComponent`, which `convertFileSrc` applies to the path.
fn encode_uri_component(text: &str) -> String {
  let mut out = String::with_capacity(text.len());
  for byte in text.bytes() {
    match byte {
      b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'!' | b'~' | b'*' | b'\'' | b'(' | b')' => out.push(byte as char),
      _ => out.push_str(&format!("%{byte:02X}")),
    }
  }
  out
}

fn decode_uri_component(text: &str) -> Option<String> {
  let bytes = text.as_bytes();
  let mut out = Vec::with_capacity(bytes.len());
  let mut i = 0;
  while i < bytes.len() {
    if bytes[i] == b'%' {
      let hex = std::str::from_utf8(bytes.get(i + 1..i + 3)?).ok()?;
      out.push(u8::from_str_radix(hex, 16).ok()?);
      i += 3;
    } else {
      out.push(bytes[i]);
      i += 1;
    }
  }
  String::from_utf8(out).ok()
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn asset_urls_match_convert_file_src() {
    let url = asset_url(Path::new("/Users/me/Artcraft/local_generations/a b(1).png")).unwrap();
    if cfg!(windows) {
      assert_eq!(url.as_str(), "http://asset.localhost/%2FUsers%2Fme%2FArtcraft%2Flocal_generations%2Fa%20b(1).png");
    } else {
      assert_eq!(url.as_str(), "asset://localhost/%2FUsers%2Fme%2FArtcraft%2Flocal_generations%2Fa%20b(1).png");
    }
  }

  #[test]
  fn only_local_generation_asset_urls_resolve_to_files() {
    let image = std::env::temp_dir().join("my stuff").join("local_generations").join("local_file_abc.png");
    assert_eq!(local_generation_path(&asset_url(&image).unwrap()), Some(image));
    let other = std::env::temp_dir().join("local_generations").join("secrets.txt");
    assert_eq!(local_generation_path(&asset_url(&other).unwrap()), None, "not one of ours");
    let elsewhere = std::env::temp_dir().join("local_file_abc.png");
    assert_eq!(local_generation_path(&asset_url(&elsewhere).unwrap()), None, "not in local_generations");
    assert_eq!(local_generation_path(&Url::parse("https://cdn.storyteller.ai/media/local_file_abc.png").unwrap()), None);
  }

  #[test]
  fn kept_images_land_in_local_generations() {
    let root_dir = std::env::temp_dir().join(format!("artcraft-local-{}", uuid_utils::uuid::generate_random_uuid()));
    let root = AppDataRoot::create_existing(&root_dir).unwrap();
    let kept = keep_local_generation_as(&root, "task_1_0", b"png", "png", LocalGenerationDetails { prompt: "a fox", model_id: "nano_banana", provider: "open_router" }).unwrap();
    assert!(is_local_token(kept.token.as_str()));
    let path = local_generation_path(&kept.asset_url).expect("the asset URL leads back to the file");
    assert_eq!(path.parent(), Some(root.path().join("local_generations").as_path()));
    assert_eq!(std::fs::read(&path).unwrap(), b"png");
    let _ = std::fs::remove_dir_all(root_dir);
  }
}
