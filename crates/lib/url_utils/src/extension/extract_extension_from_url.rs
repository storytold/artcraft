use std::collections::HashSet;

use crate::extension::extension::Extension;
use url::Url;

// TODO: Lookups against these as lists will be slow

/// Known image extensions.
const KNOWN_IMAGE_EXTENSIONS: &[Extension] = &[
  Extension::from_static("png", ".png"),
  Extension::from_static("jpg", ".jpg"),
  Extension::from_static("jpeg", ".jpeg"),
  Extension::from_static("webp", ".webp"),
];

/// Known audio extensions.
const KNOWN_AUDIO_EXTENSIONS: &[Extension] = &[
  Extension::from_static("wav", ".wav"),
  Extension::from_static("mp3", ".mp3"),
];

/// Known video extensions.
const KNOWN_VIDEO_EXTENSIONS: &[Extension] = &[
  Extension::from_static("mp4", ".mp4"),
  Extension::from_static("webm", ".webm"),
];

/// Controls which extensions are accepted when extracting from a URL.
pub enum ExtractExtensions {
  /// Accept any extension-like string found in the URL path.
  All,

  /// Accept only extensions that appear in the given set.
  Set(HashSet<Extension>),

  /// Accept only known image extensions (png, jpg, jpeg, webp).
  KnownImage,

  /// Accept only known audio extensions (wav, mp3).
  KnownAudio,

  /// Accept only known video extensions (mp4, webm).
  KnownVideo,

  /// Accept any known media extension (image, audio, or video).
  KnownMedia,
}

impl ExtractExtensions {
  /// Creates a `Set` variant from a `Vec<Extension>`.
  pub fn from_vec(extensions: Vec<Extension>) -> Self {
    Self::Set(extensions.into_iter().collect())
  }
}

/// Extracts a file extension from a URL string, filtered by `accept`.
pub fn extract_extension_from_url_str(url: &str, accept: &ExtractExtensions) -> Option<Extension> {
  let parsed_url = Url::parse(url).ok()?;
  extract_extension_from_url(&parsed_url, accept)
}

/// Extracts a file extension from a parsed `Url`, filtered by `accept`.
pub fn extract_extension_from_url(url: &Url, accept: &ExtractExtensions) -> Option<Extension> {
  let path = url.path();
  let raw_ext = std::path::Path::new(path)
    .extension()
    .and_then(|ext| ext.to_str())?;

  let lower = raw_ext.to_lowercase();
  let candidate = Extension::new(&lower);

  match accept {
    ExtractExtensions::All => Some(candidate),
    ExtractExtensions::Set(set) => {
      if set.contains(&candidate) { Some(candidate) } else { None }
    }
    ExtractExtensions::KnownImage => {
      if slice_contains(KNOWN_IMAGE_EXTENSIONS, &candidate) { Some(candidate) } else { None }
    }
    ExtractExtensions::KnownAudio => {
      if slice_contains(KNOWN_AUDIO_EXTENSIONS, &candidate) { Some(candidate) } else { None }
    }
    ExtractExtensions::KnownVideo => {
      if slice_contains(KNOWN_VIDEO_EXTENSIONS, &candidate) { Some(candidate) } else { None }
    }
    ExtractExtensions::KnownMedia => {
      if slice_contains(KNOWN_IMAGE_EXTENSIONS, &candidate)
        || slice_contains(KNOWN_AUDIO_EXTENSIONS, &candidate)
        || slice_contains(KNOWN_VIDEO_EXTENSIONS, &candidate)
      {
        Some(candidate)
      } else {
        None
      }
    }
  }
}

fn slice_contains(extensions: &[Extension], candidate: &Extension) -> bool {
  extensions.iter().any(|e| e == candidate)
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn all_extracts_any_extension() {
    let ext = extract_extension_from_url_str("https://example.com/file.png", &ExtractExtensions::All);
    assert_eq!(ext.unwrap().without_period(), "png");
  }

  #[test]
  fn all_extracts_unknown_extension() {
    let ext = extract_extension_from_url_str("https://example.com/file.foobar", &ExtractExtensions::All);
    assert_eq!(ext.unwrap().without_period(), "foobar");
  }

  #[test]
  fn all_extracts_unknown_extension_all_caps() {
    let ext = extract_extension_from_url_str("https://example.com/file.FOOBAR", &ExtractExtensions::All);
    assert_eq!(ext.unwrap().without_period(), "foobar");
  }

  #[test]
  fn all_lowercases() {
    let ext = extract_extension_from_url_str("https://example.com/file.PNG", &ExtractExtensions::All);
    assert_eq!(ext.unwrap().without_period(), "png");
  }

  #[test]
  fn known_image_matches_png() {
    let ext = extract_extension_from_url_str("https://example.com/photo.png", &ExtractExtensions::KnownImage);
    assert_eq!(ext.unwrap().without_period(), "png");
  }

  #[test]
  fn known_image_rejects_mp4() {
    let ext = extract_extension_from_url_str("https://example.com/video.mp4", &ExtractExtensions::KnownImage);
    assert!(ext.is_none());
  }

  #[test]
  fn known_audio_matches_wav() {
    let ext = extract_extension_from_url_str("https://example.com/sound.wav", &ExtractExtensions::KnownAudio);
    assert_eq!(ext.unwrap().without_period(), "wav");
  }

  #[test]
  fn known_audio_rejects_png() {
    let ext = extract_extension_from_url_str("https://example.com/photo.png", &ExtractExtensions::KnownAudio);
    assert!(ext.is_none());
  }

  #[test]
  fn known_video_matches_mp4() {
    let ext = extract_extension_from_url_str("https://example.com/clip.mp4", &ExtractExtensions::KnownVideo);
    assert_eq!(ext.unwrap().without_period(), "mp4");
  }

  #[test]
  fn known_video_rejects_mp3() {
    let ext = extract_extension_from_url_str("https://example.com/song.mp3", &ExtractExtensions::KnownVideo);
    assert!(ext.is_none());
  }

  #[test]
  fn known_media_matches_image() {
    let ext = extract_extension_from_url_str("https://example.com/photo.jpg", &ExtractExtensions::KnownMedia);
    assert_eq!(ext.unwrap().without_period(), "jpg");
  }

  #[test]
  fn known_media_matches_audio() {
    let ext = extract_extension_from_url_str("https://example.com/song.mp3", &ExtractExtensions::KnownMedia);
    assert_eq!(ext.unwrap().without_period(), "mp3");
  }

  #[test]
  fn known_media_matches_video() {
    let ext = extract_extension_from_url_str("https://example.com/clip.webm", &ExtractExtensions::KnownMedia);
    assert_eq!(ext.unwrap().without_period(), "webm");
  }

  #[test]
  fn known_media_rejects_unknown() {
    let ext = extract_extension_from_url_str("https://example.com/data.xyz", &ExtractExtensions::KnownMedia);
    assert!(ext.is_none());
  }

  #[test]
  fn set_matches_custom_list() {
    let accept = ExtractExtensions::from_vec(vec![
      Extension::from_static("csv", ".csv"),
      Extension::from_static("tsv", ".tsv"),
    ]);
    let ext = extract_extension_from_url_str("https://example.com/data.csv", &accept);
    assert_eq!(ext.unwrap().without_period(), "csv");
  }

  #[test]
  fn set_rejects_non_member() {
    let accept = ExtractExtensions::from_vec(vec![
      Extension::from_static("csv", ".csv"),
    ]);
    let ext = extract_extension_from_url_str("https://example.com/data.png", &accept);
    assert!(ext.is_none());
  }

  #[test]
  fn no_extension_returns_none() {
    let ext = extract_extension_from_url_str("https://example.com/file", &ExtractExtensions::All);
    assert!(ext.is_none());
  }

  #[test]
  fn query_params_ignored() {
    let ext = extract_extension_from_url_str(
      "https://example.com/file.mp4?token=abc&format=hd",
      &ExtractExtensions::KnownVideo,
    );
    assert_eq!(ext.unwrap().without_period(), "mp4");
  }

  #[test]
  fn difficult_url_returns_none() {
    let url = "https://videos.youtube.com/foo/bar/files/00000000-f19a-1275-a092-caa60b38f8d2%2Fraw?se=2025-11-21T22%3A26%3A53Z&sp=r&sv=2024-08-09&sr=b";
    let ext = extract_extension_from_url_str(url, &ExtractExtensions::All);
    assert!(ext.is_none());
  }
}
