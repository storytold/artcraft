use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

// TODO(bt,2026-07-09): Replace the storyteller-web version of this.

/// Pagination by cursors
/// These types of pagination are for "infinite scrolling", which do not reveal a number of pages.
/// This is good so that investors and competitors cannot reveal how many database records we have.
/// This is typically used for "discovery" type pages, not user profiles.
#[derive(Serialize, Deserialize, ToSchema, Debug)]
pub struct PaginationCursors {
  /// The "next" cursor.
  /// This is an opaque (typically even encrypted) handle.
  pub maybe_next: Option<String>,

  /// The "previous" cursor.
  /// This is an opaque (typically even encrypted) handle.
  pub maybe_previous: Option<String>,

  /// Details whether we're walking forward or backward.
  pub cursor_is_reversed: bool,
}
