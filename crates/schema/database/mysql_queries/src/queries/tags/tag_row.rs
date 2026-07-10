use tokens::tokens::tags::TagToken;

/// One (live) tag row, as returned by the tags list/select queries.
#[derive(Debug, Clone)]
pub struct TagRow {
  /// `tags.id` — used as the pagination cursor for user tag lists.
  pub id: u64,

  pub token: TagToken,

  /// The display value of the tag, as entered by its creator.
  pub tag_value: String,

  /// Lowercased form of `tag_value` — the tag's unique key within the
  /// creator's account.
  pub tag_value_lowercase: String,

  /// Rollup statistic: how many media files currently carry this tag.
  pub use_count: u32,
}
