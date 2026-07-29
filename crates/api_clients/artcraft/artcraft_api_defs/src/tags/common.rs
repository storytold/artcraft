use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

use tokens::tokens::tags::TagToken;

/// One tag as returned by every tags endpoint.
#[derive(Clone, Debug, Serialize, Deserialize, ToSchema)]
pub struct TagDetails {
  pub tag_token: TagToken,

  /// The display value of the tag, as entered by its creator.
  pub tag_value: String,

  /// Lowercased form of `tag_value`. This is the tag's unique key
  /// within the creator's account.
  pub tag_value_lowercase: String,

  /// Rollup statistic: how many media files currently carry this tag.
  pub use_count: u32,
}
