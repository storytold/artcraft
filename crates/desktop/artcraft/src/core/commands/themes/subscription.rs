use crate::themes::watcher::ThemeWatcher;
use std::sync::Mutex;

#[derive(Default)]
pub struct ThemeSubscription {
  pub active: Mutex<Option<ActiveThemeSubscription>>,
}

pub struct ActiveThemeSubscription {
  pub id: String,
  pub _watcher: ThemeWatcher,
}

impl ThemeSubscription {
  pub fn stop(&self, id: &str) -> Result<(), String> {
    let mut active = self.active.lock().map_err(|_| "Cannot access the theme subscription.")?;
    // Late cleanup must not stop a newer selection, including StrictMode remounts.
    if active.as_ref().is_some_and(|subscription| subscription.id == id) {
      active.take();
    }
    Ok(())
  }

  pub fn clear(&self) {
    if let Ok(mut active) = self.active.lock() {
      active.take();
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use std::sync::mpsc;
  use std::time::Duration;

  #[test]
  fn stale_stop_keeps_the_current_watcher_and_matching_stop_joins_it() {
    let dir = tempfile::tempdir().unwrap();
    let (state, updates) = active_subscription(dir.path().join("theme.json"));
    updates.recv_timeout(Duration::from_secs(4)).unwrap();
    state.stop("old").unwrap();
    assert!(state.active.lock().unwrap().is_some());
    state.stop("current").unwrap();
    assert!(state.active.lock().unwrap().is_none());
    assert!(matches!(updates.recv_timeout(Duration::from_secs(4)), Err(mpsc::RecvTimeoutError::Disconnected)));
    state.stop("current").unwrap();
  }

  #[test]
  fn clearing_for_reload_or_window_destruction_stops_the_worker() {
    let dir = tempfile::tempdir().unwrap();
    let (state, updates) = active_subscription(dir.path().join("theme.json"));
    updates.recv_timeout(Duration::from_secs(4)).unwrap();
    state.clear();
    assert!(matches!(updates.recv_timeout(Duration::from_secs(4)), Err(mpsc::RecvTimeoutError::Disconnected)));
    state.clear();
  }

  fn active_subscription(path: std::path::PathBuf) -> (ThemeSubscription, mpsc::Receiver<crate::themes::palette::ThemeUpdate>) {
    let (sender, updates) = mpsc::channel();
    let watcher = ThemeWatcher::start(path, move |update| sender.send(update).is_ok()).unwrap();
    let state = ThemeSubscription { active: Mutex::new(Some(ActiveThemeSubscription { id: "current".into(), _watcher: watcher })) };
    (state, updates)
  }
}
