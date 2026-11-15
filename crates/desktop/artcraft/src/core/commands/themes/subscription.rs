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
