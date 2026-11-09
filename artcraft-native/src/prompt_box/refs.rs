//! Reference media attached to a prompt: images, videos and audio clips, either uploaded from
//! disk or picked from the library.

use std::sync::atomic::{AtomicU64, Ordering};

static NEXT_ID: AtomicU64 = AtomicU64::new(1);

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum RefKind {
  Image,
  Video,
  Audio,
}

impl RefKind {
  pub fn noun(self) -> &'static str {
    match self {
      RefKind::Image => "image",
      RefKind::Video => "video",
      RefKind::Audio => "audio",
    }
  }

  /// Which kind a file is, by extension (the webapp's drop routing lists).
  pub fn from_path(path: &std::path::Path) -> Option<Self> {
    let ext = path.extension()?.to_str()?.to_ascii_lowercase();
    match ext.as_str() {
      "png" | "jpg" | "jpeg" | "webp" | "gif" | "bmp" | "avif" => Some(RefKind::Image),
      "mp4" | "mov" | "webm" | "mkv" | "avi" | "m4v" => Some(RefKind::Video),
      "mp3" | "wav" | "ogg" | "flac" | "aac" | "m4a" | "opus" => Some(RefKind::Audio),
      _ => None,
    }
  }
}

#[derive(Clone, Debug, PartialEq)]
pub enum RefStatus {
  Uploading,
  Ready,
}

/// One attached reference.
#[derive(Clone, Debug)]
pub struct RefMedia {
  pub id: u64,
  pub kind: RefKind,
  pub status: RefStatus,
  /// The server's media file token, once uploaded (or picked from the library).
  pub token: Option<String>,
  /// Media cache key of the thumbnail (a CDN URL or a `local://` key).
  pub preview: Option<String>,
  /// The full-size URL, for the preview modal.
  pub full_url: Option<String>,
  /// Seconds, for videos and audio (counts toward the model's total-duration limit).
  pub duration_secs: f32,
}

impl RefMedia {
  pub fn uploading(kind: RefKind, preview: Option<String>) -> Self {
    Self { id: NEXT_ID.fetch_add(1, Ordering::Relaxed), kind, status: RefStatus::Uploading, token: None, preview, full_url: None, duration_secs: 0.0 }
  }

  pub fn from_library(kind: RefKind, token: String, preview: Option<String>, full_url: Option<String>, duration_secs: f32) -> Self {
    Self { id: NEXT_ID.fetch_add(1, Ordering::Relaxed), kind, status: RefStatus::Ready, token: Some(token), preview, full_url, duration_secs }
  }
}

/// Where an image goes: the reference deck, or one of the two keyframe slots.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum ImageSlot {
  Reference,
  FirstFrame,
  LastFrame,
}

/// Everything attached to one prompt box.
#[derive(Clone, Debug, Default)]
pub struct References {
  pub images: Vec<RefMedia>,
  pub videos: Vec<RefMedia>,
  pub audios: Vec<RefMedia>,
  pub first_frame: Option<RefMedia>,
  pub last_frame: Option<RefMedia>,
}

impl References {
  pub fn is_empty(&self) -> bool {
    self.images.is_empty() && self.videos.is_empty() && self.audios.is_empty() && self.first_frame.is_none() && self.last_frame.is_none()
  }

  pub fn clear(&mut self) {
    *self = Self::default();
  }

  pub fn list(&self, kind: RefKind) -> &Vec<RefMedia> {
    match kind {
      RefKind::Image => &self.images,
      RefKind::Video => &self.videos,
      RefKind::Audio => &self.audios,
    }
  }

  pub fn list_mut(&mut self, kind: RefKind) -> &mut Vec<RefMedia> {
    match kind {
      RefKind::Image => &mut self.images,
      RefKind::Video => &mut self.videos,
      RefKind::Audio => &mut self.audios,
    }
  }

  pub fn total_secs(&self, kind: RefKind) -> f32 {
    self.list(kind).iter().map(|r| r.duration_secs).sum()
  }

  pub fn any_uploading(&self) -> bool {
    let slots = self.first_frame.iter().chain(self.last_frame.iter());
    self.images.iter().chain(&self.videos).chain(&self.audios).chain(slots).any(|r| r.status == RefStatus::Uploading)
  }

  /// Finds a reference anywhere by id.
  pub fn find_mut(&mut self, id: u64) -> Option<&mut RefMedia> {
    let slots = self.first_frame.iter_mut().chain(self.last_frame.iter_mut());
    self.images.iter_mut().chain(self.videos.iter_mut()).chain(self.audios.iter_mut()).chain(slots).find(|r| r.id == id)
  }

  /// Removes a reference anywhere by id.
  pub fn remove(&mut self, id: u64) {
    for list in [&mut self.images, &mut self.videos, &mut self.audios] {
      list.retain(|r| r.id != id);
    }
    if self.first_frame.as_ref().is_some_and(|r| r.id == id) {
      self.first_frame = None;
    }
    if self.last_frame.as_ref().is_some_and(|r| r.id == id) {
      self.last_frame = None;
    }
  }

  pub fn swap_frames(&mut self) {
    std::mem::swap(&mut self.first_frame, &mut self.last_frame);
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use std::path::Path;

  #[test]
  fn routes_files_by_extension() {
    assert_eq!(RefKind::from_path(Path::new("a/B.PNG")), Some(RefKind::Image));
    assert_eq!(RefKind::from_path(Path::new("clip.mov")), Some(RefKind::Video));
    assert_eq!(RefKind::from_path(Path::new("beat.m4a")), Some(RefKind::Audio));
    assert_eq!(RefKind::from_path(Path::new("notes.txt")), None);
  }

  #[test]
  fn swapping_frames_and_removing_by_id() {
    let mut refs = References::default();
    let (a, b) = (RefMedia::from_library(RefKind::Image, "a".into(), None, None, 0.0), RefMedia::from_library(RefKind::Image, "b".into(), None, None, 0.0));
    let a_id = a.id;
    refs.first_frame = Some(a);
    refs.last_frame = Some(b);
    refs.swap_frames();
    assert_eq!(refs.first_frame.as_ref().and_then(|r| r.token.as_deref()), Some("b"));
    refs.remove(a_id);
    assert!(refs.last_frame.is_none());
  }
}
