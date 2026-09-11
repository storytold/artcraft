use serde_derive::{Deserialize, Serialize};

// TODO(bt,2025-08-20): Replace the storyteller-web version of this.

/// Simple stats that can be attached to any entity
#[derive(Serialize, Deserialize, Debug)]
pub struct SimpleEntityStats {
  /// Number of positive ratings (or "likes") for this item
  pub positive_rating_count: u32,
  /// Number of bookmarks for this item
  pub bookmark_count: u32,
}
