use crate::themes::palette::{read_theme, ThemeError, ThemeUpdate};
use notify::event::ModifyKind;
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
  maybe_watcher: Option<RecommendedWatcher>,
  cancelled: Arc<AtomicBool>,
  wake: mpsc::SyncSender<()>,
  maybe_worker: Option<JoinHandle<()>>,
}

impl ThemeWatcher {
  pub fn start(path: PathBuf, mut send: impl FnMut(ThemeUpdate) -> bool + Send + 'static) -> Result<Self, String> {
    let parent = path.parent().ok_or("Cannot locate the theme directory.")?;
    // Watch the directory, not the inode: editors commonly save by rename.
    // Creating only the per-app directory also lets a missing theme appear later.
    std::fs::create_dir_all(parent).map_err(|_| "Cannot create the theme directory.")?;
    // OS events can use canonical paths (notably /private/var on macOS).
    let parent = parent.canonicalize().map_err(|_| "Cannot locate the theme directory.")?;
    let path = parent.join(path.file_name().ok_or("Cannot locate theme.json.")?);
    let (wake, events) = mpsc::sync_channel(1);
    let event_sender = wake.clone();
    let watched_path = path.clone();
    let watched_parent = parent.to_path_buf();
    let watch_failed = Arc::new(AtomicBool::new(false));
    let callback_failed = watch_failed.clone();
    let mut watcher = notify::recommended_watcher(move |event: notify::Result<Event>| {
      let relevant = match event {
        Ok(event) => {
          let directory_lost = event.paths.contains(&watched_parent) && matches!(event.kind, EventKind::Remove(_) | EventKind::Modify(ModifyKind::Name(_)));
          if directory_lost {
            callback_failed.store(true, Ordering::Release);
          }
          event.need_rescan() || directory_lost || (!matches!(event.kind, EventKind::Access(_)) && event.paths.contains(&watched_path))
        },
        Err(_) => {
          callback_failed.store(true, Ordering::Release);
          true
        },
      };
      if relevant {
        // A bounded queue coalesces saves; the separate flag never loses errors.
        let _ = event_sender.try_send(());
      }
    })
    .map_err(|_| "Cannot watch the theme directory.")?;
    watcher.watch(&parent, RecursiveMode::NonRecursive).map_err(|_| "Cannot watch the theme directory.")?;
    let cancelled = Arc::new(AtomicBool::new(false));
    let worker_cancelled = cancelled.clone();
    let worker = thread::Builder::new()
      .name("custom-theme".into())
      .spawn(move || {
        let mut previous = read_theme(&path);
        if !send(previous.clone()) {
          return;
        }
        while events.recv().is_ok() {
          if worker_cancelled.load(Ordering::Acquire) {
            break;
          }
          // One bounded delay settles truncate/write and atomic-save event bursts.
          thread::sleep(SAVE_DEBOUNCE);
          let _ = events.try_recv();
          if worker_cancelled.load(Ordering::Acquire) {
            break;
          }
          let update = if watch_failed.load(Ordering::Acquire) { ThemeUpdate::Error { reason: ThemeError::WatchError } } else { read_theme(&path) };
          if update != previous {
            previous = update.clone();
            if !send(update) {
              break;
            }
          }
        }
      })
      .map_err(|_| "Cannot start the theme watcher.")?;
    Ok(Self { maybe_watcher: Some(watcher), cancelled, wake, maybe_worker: Some(worker) })
  }
}

impl Drop for ThemeWatcher {
  fn drop(&mut self) {
    self.cancelled.store(true, Ordering::Release);
    self.maybe_watcher.take();
    let _ = self.wake.try_send(());
    if let Some(worker) = self.maybe_worker.take() {
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

  #[test]
  fn reports_when_the_watched_directory_is_removed() {
    let dir = tempfile::tempdir().unwrap();
    let parent = dir.path().join("app");
    let (watcher, updates) = start(parent.join("theme.json"));
    updates.recv_timeout(TIMEOUT).unwrap();
    std::fs::remove_dir(&parent).unwrap();
    assert_eq!(updates.recv_timeout(TIMEOUT).unwrap(), ThemeUpdate::Error { reason: ThemeError::WatchError });
    drop(watcher);
  }

  #[test]
  fn fails_safely_if_the_directory_is_not_a_directory() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("file");
    std::fs::write(&path, "not a directory").unwrap();
    assert!(ThemeWatcher::start(path.join("theme.json"), |_| true).is_err());
  }

  #[cfg(unix)]
  #[test]
  fn watches_the_canonical_location_of_a_symlinked_config_directory() {
    let dir = tempfile::tempdir().unwrap();
    let actual = dir.path().join("actual");
    let alias = dir.path().join("alias");
    std::fs::create_dir(&actual).unwrap();
    std::os::unix::fs::symlink(&actual, &alias).unwrap();
    let (watcher, updates) = start(alias.join("theme.json"));
    updates.recv_timeout(TIMEOUT).unwrap();
    std::fs::write(actual.join("theme.json"), VALID).unwrap();
    assert!(matches!(updates.recv_timeout(TIMEOUT).unwrap(), ThemeUpdate::Ready { .. }));
    drop(watcher);
  }

  fn start(path: PathBuf) -> (ThemeWatcher, mpsc::Receiver<ThemeUpdate>) {
    let (send, updates) = mpsc::channel();
    let watcher = ThemeWatcher::start(path, move |update| send.send(update).is_ok()).unwrap();
    (watcher, updates)
  }
}
