use std::collections::VecDeque;
use std::time::SystemTime;

/// Oldest records are dropped once the log exceeds this many entries.
pub const MAX_CHANGE_LOG_RECORDS: usize = 256;

/// A bounded, in-memory history of cookie store mutations, for debugging
/// auth flows ("did the provider rotate the session cookie?", "when did we
/// lose it?"). Values are intentionally not recorded — only names, domains,
/// and what happened.
#[derive(Clone, Debug, Default)]
pub struct CookieChangeLog {
  records: VecDeque<CookieChangeRecord>,
  next_sequence_number: u64,
}

#[derive(Clone, Debug)]
pub struct CookieChangeRecord {
  pub sequence_number: u64,
  pub timestamp: SystemTime,
  pub action: CookieChangeAction,
  pub cookie_name: String,
  pub maybe_domain: Option<String>,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum CookieChangeAction {
  /// A new cookie was stored.
  Inserted,
  /// An existing cookie's value was replaced.
  Updated,
  /// A server sent an expired Set-Cookie, deleting the stored cookie.
  ExpiredByServer,
  /// A cookie was refused (domain mismatch, malformed, etc.).
  Rejected,
  /// The whole store was cleared.
  Cleared,
}

impl CookieChangeLog {
  pub fn record(&mut self, action: CookieChangeAction, cookie_name: &str, maybe_domain: Option<String>) {
    self.records.push_back(CookieChangeRecord { sequence_number: self.next_sequence_number, timestamp: SystemTime::now(), action, cookie_name: cookie_name.to_owned(), maybe_domain });
    self.next_sequence_number += 1;
    while self.records.len() > MAX_CHANGE_LOG_RECORDS {
      self.records.pop_front();
    }
  }

  /// Records in chronological order, oldest first.
  pub fn iter(&self) -> impl Iterator<Item = &CookieChangeRecord> {
    self.records.iter()
  }

  pub fn len(&self) -> usize {
    self.records.len()
  }

  pub fn is_empty(&self) -> bool {
    self.records.is_empty()
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn log_is_bounded_and_keeps_newest_records() {
    let mut log = CookieChangeLog::default();
    for index in 0..(MAX_CHANGE_LOG_RECORDS + 10) {
      log.record(CookieChangeAction::Inserted, &format!("cookie_{index}"), None);
    }

    assert_eq!(log.len(), MAX_CHANGE_LOG_RECORDS);
    let first = log.iter().next().unwrap();
    assert_eq!(first.sequence_number, 10);
    let last = log.iter().last().unwrap();
    assert_eq!(last.cookie_name, format!("cookie_{}", MAX_CHANGE_LOG_RECORDS + 9));
  }
}
