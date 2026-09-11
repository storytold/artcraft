use std::ops::Deref;
use build_info::chrono::{DateTime, Utc};

build_info::build_info!(fn version);

pub fn build_timestamp() -> DateTime<Utc> {
  version().timestamp
}

pub fn git_commit_id() -> Option<&'static str> {
  version().version_control
      .as_ref()
      .map(|vc| vc.git())
      .flatten()
      .map(|git| git.commit_id.deref())
}

pub fn git_commit_short_id() -> Option<&'static str> {
  version().version_control
      .as_ref()
      .map(|vc| vc.git())
      .flatten()
      .map(|git| git.commit_short_id.deref())
}

pub fn git_commit_timestamp() -> Option<DateTime<Utc>> {
  version().version_control
      .as_ref()
      .map(|vc| vc.git())
      .flatten()
      .map(|git| git.commit_timestamp)
}

#[cfg(test)]
mod tests {
  use crate::git_commit_id;

  #[test]
  #[ignore] // Run manually for testing, not in CI
  fn test_git_commit_id() {
    assert_eq!(git_commit_id(), None);
  }
}
