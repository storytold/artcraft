//! Everything that differs between the desktop and Android builds, behind one small API:
//! where data lives, opening links, choosing files, saving downloads and the picker mailbox.

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::{Mutex, OnceLock};

#[cfg(target_os = "android")]
pub mod android;
#[cfg(target_os = "android")]
use android as imp;

#[cfg(not(target_os = "android"))]
mod desktop;
#[cfg(not(target_os = "android"))]
use desktop as imp;

/// Whether this is the Android build.
pub const IS_ANDROID: bool = cfg!(target_os = "android");

/// What a file picker was opened for; the page that asked collects the result with
/// [`take_picked`] under the same key.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
#[repr(u32)]
pub enum PickKey {
  ImageDeck = 1,
  AudioRefs = 2,
  AudioImage = 3,
  VideoDeck = 4,
  CharacterImage = 5,
}

impl PickKey {
  pub fn from_u32(value: u32) -> Option<Self> {
    [Self::ImageDeck, Self::AudioRefs, Self::AudioImage, Self::VideoDeck, Self::CharacterImage].into_iter().find(|k| *k as u32 == value)
  }
}

/// One kind of file a picker offers: a name and extensions for desktop dialogs, MIME types for
/// Android's document picker.
#[derive(Clone, Copy)]
pub struct FileFilter {
  pub name: &'static str,
  pub extensions: &'static [&'static str],
  pub mime_types: &'static [&'static str],
}

/// The app's data folder: `~/Artcraft` on desktop, the app's private files directory on Android.
pub fn data_root() -> PathBuf {
  imp::data_root()
}

/// Opens a web link or media URL in the system's browser or player.
pub fn open_url(url: &str) -> Result<(), String> {
  imp::open_url(url)
}

/// Shows a folder in the system's file manager (not possible on Android).
pub fn reveal_folder(path: &Path) -> Result<(), String> {
  imp::reveal_folder(path)
}

/// Where to save one download called `file_name`: asks the user on desktop, and uses the app's
/// downloads folder on Android (the file is then published to the gallery, see [`after_save`]).
pub fn save_target(file_name: &str) -> Option<PathBuf> {
  imp::save_target(file_name)
}

/// Where to save a batch of downloads.
pub fn save_folder() -> Option<PathBuf> {
  imp::save_folder()
}

/// Called once a download has been written to disk.
pub fn after_save(path: &Path) {
  imp::after_save(path)
}

/// Starts choosing files. The result arrives later through [`take_picked`] with the same `key`:
/// at once on desktop (the dialog blocks), after the user returns from the picker on Android.
pub fn request_pick(key: PickKey, filters: &[FileFilter], multiple: bool) {
  imp::request_pick(key, filters, multiple)
}

/// The files chosen by earlier [`request_pick`] calls for `key`, one entry per finished request.
pub fn take_picked(key: PickKey) -> Vec<Vec<PathBuf>> {
  let mut mailbox = mailbox().lock().unwrap_or_else(|e| e.into_inner());
  mailbox.remove(&(key as u32)).unwrap_or_default()
}

/// Lets platform code (the Android picker callback) wake the UI when a result is posted.
pub fn install_repaint(ctx: egui::Context) {
  let _ = REPAINT.set(ctx);
}

/// Posts picked files (possibly none, if the user cancelled) for `key`.
pub(crate) fn post_picked(key: u32, paths: Vec<PathBuf>) {
  if !paths.is_empty() {
    mailbox().lock().unwrap_or_else(|e| e.into_inner()).entry(key).or_default().push(paths);
  }
  if let Some(ctx) = REPAINT.get() {
    ctx.request_repaint();
  }
}

fn mailbox() -> &'static Mutex<HashMap<u32, Vec<Vec<PathBuf>>>> {
  static MAILBOX: OnceLock<Mutex<HashMap<u32, Vec<Vec<PathBuf>>>>> = OnceLock::new();
  MAILBOX.get_or_init(Default::default)
}

static REPAINT: OnceLock<egui::Context> = OnceLock::new();
