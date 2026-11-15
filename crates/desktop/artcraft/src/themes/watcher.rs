use crate::themes::palette::{read_theme, ThemeError, ThemeUpdate};
use notify::{Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{mpsc, Arc};
use std::thread::{self, JoinHandle};
use std::time::Duration;

const SAVE_DEBOUNCE: Duration = Duration::from_millis(120);

/// One subscription owns both the OS watcher and its worker. Dropping it stops
/// notifications and joins the worker; there is no polling when the file is idle.
pub struct ThemeWatcher {
  watcher: Option<RecommendedWatcher>,
  cancelled: Arc<AtomicBool>,
  wake: mpsc::SyncSender<bool>,
  worker: Option<JoinHandle<()>>,
}

impl ThemeWatcher {
  pub fn start(path: PathBuf, mut send: impl FnMut(ThemeUpdate) -> bool + Send + 'static) -> Result<Self, String> {
    let parent = path.parent().ok_or("Cannot locate the theme directory.")?;
    // Watch the directory, not the inode: editors commonly save by rename.
    // Creating only the per-app directory also lets a missing theme appear later.
    std::fs::create_dir_all(parent).map_err(|_| "Cannot create the theme directory.")?;
    let (wake, events) = mpsc::sync_channel(1);
    let event_sender = wake.clone();
    let watched_path = path.clone();
    let mut watcher = notify::recommended_watcher(move |event: notify::Result<Event>| {
      let signal = match event {
        Ok(event) if !matches!(event.kind, EventKind::Access(_)) && event.paths.iter().any(|p| p == &watched_path) => Some(false),
        Err(_) => Some(true),
        _ => None,
      };
      if let Some(watch_error) = signal {
        // A bounded queue coalesces save bursts without unbounded memory growth.
        let _ = event_sender.try_send(watch_error);
      }
    })
    .map_err(|_| "Cannot watch the theme directory.")?;
    watcher.watch(parent, RecursiveMode::NonRecursive).map_err(|_| "Cannot watch the theme directory.")?;
    let cancelled = Arc::new(AtomicBool::new(false));
    let worker_cancelled = cancelled.clone();
    let worker = thread::Builder::new()
      .name("custom-theme".into())
      .spawn(move || {
        let mut previous = read_theme(&path);
        if !send(previous.clone()) {
          return;
        }
        while let Ok(watch_error) = events.recv() {
          if worker_cancelled.load(Ordering::Acquire) {
            break;
          }
          // One bounded delay settles truncate/write and atomic-save event bursts.
          thread::sleep(SAVE_DEBOUNCE);
          let watch_error = events.try_iter().fold(watch_error, |a, b| a || b);
          if worker_cancelled.load(Ordering::Acquire) {
            break;
          }
          let update = if watch_error { ThemeUpdate::Error { reason: ThemeError::WatchError } } else { read_theme(&path) };
          if update != previous {
            previous = update.clone();
            if !send(update) {
              break;
            }
          }
        }
      })
      .map_err(|_| "Cannot start the theme watcher.")?;
    Ok(Self { watcher: Some(watcher), cancelled, wake, worker: Some(worker) })
  }
}

impl Drop for ThemeWatcher {
  fn drop(&mut self) {
    self.cancelled.store(true, Ordering::Release);
    self.watcher.take();
    let _ = self.wake.try_send(false);
    if let Some(worker) = self.worker.take() {
      let _ = worker.join();
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::themes::palette::tests::VALID;

  const TIMEOUT: Duration = Duration::from_secs(4);
  const QUIET: Duration = Duration::from_millis(350);

  #[test]
  fn watches_creation_atomic_replacement_removal_and_recreation() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("app/theme.json");
    let (watcher, updates) = start(path.clone());
    assert_eq!(updates.recv_timeout(TIMEOUT).unwrap(), ThemeUpdate::Error { reason: ThemeError::Missing });
    std::fs::write(&path, VALID).unwrap();
    let initial = updates.recv_timeout(TIMEOUT).unwrap();
    assert!(matches!(initial, ThemeUpdate::Ready { .. }));
    let replacement = path.with_extension("tmp");
    std::fs::write(&replacement, VALID.replace("#112233", "#abcdef")).unwrap();
    std::fs::rename(&replacement, &path).unwrap();
    let changed = updates.recv_timeout(TIMEOUT).unwrap();
    assert_ne!(initial, changed);
    assert!(matches!(changed, ThemeUpdate::Ready { .. }));
    std::fs::remove_file(&path).unwrap();
    assert_eq!(updates.recv_timeout(TIMEOUT).unwrap(), ThemeUpdate::Error { reason: ThemeError::Missing });
    std::fs::write(&path, VALID).unwrap();
    assert_eq!(updates.recv_timeout(TIMEOUT).unwrap(), initial);
    drop(watcher);
    assert!(updates.recv_timeout(TIMEOUT).is_err());
  }

  #[test]
  fn coalesces_saves_ignores_unrelated_files_and_suppresses_equivalent_palettes() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("theme.json");
    std::fs::write(&path, VALID).unwrap();
    let (_watcher, updates) = start(path.clone());
    updates.recv_timeout(TIMEOUT).unwrap();
    std::fs::write(dir.path().join("other.json"), "unrelated").unwrap();
    std::fs::write(&path, "{").unwrap();
    std::fs::write(&path, VALID).unwrap();
    std::fs::write(&path, VALID.replace("#aabbcc", "#AABBCC")).unwrap();
    assert!(updates.recv_timeout(QUIET).is_err());
    std::fs::write(&path, "{").unwrap();
    assert_eq!(updates.recv_timeout(TIMEOUT).unwrap(), ThemeUpdate::Error { reason: ThemeError::Invalid });
    std::fs::write(&path, VALID).unwrap();
    assert!(matches!(updates.recv_timeout(TIMEOUT).unwrap(), ThemeUpdate::Ready { .. }));
  }

  #[test]
  fn dropping_a_subscription_stops_and_joins_its_worker() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("theme.json");
    let (watcher, updates) = start(path.clone());
    updates.recv_timeout(TIMEOUT).unwrap();
    drop(watcher);
    std::fs::write(path, VALID).unwrap();
    assert!(matches!(updates.recv_timeout(TIMEOUT), Err(mpsc::RecvTimeoutError::Disconnected)));
  }

  fn start(path: PathBuf) -> (ThemeWatcher, mpsc::Receiver<ThemeUpdate>) {
    let (send, updates) = mpsc::channel();
    let watcher = ThemeWatcher::start(path, move |update| send.send(update).is_ok()).unwrap();
    (watcher, updates)
  }
}
