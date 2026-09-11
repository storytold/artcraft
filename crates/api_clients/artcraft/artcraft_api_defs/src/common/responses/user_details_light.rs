use serde_derive::{Deserialize, Serialize};
use tokens::tokens::users::UserToken;
use utoipa::ToSchema;

/// Everything we need to refer to a user on the public web interface.
#[derive(Serialize, Deserialize, ToSchema, Debug)]
pub struct UserDetailsLight {
  /// The token for the user
  pub user_token: UserToken,

  /// The unique username someone logs in with
  /// As of 2023-08-23, this is always lowercase
  pub username: String,

  /// As of 2023-08-23, this is the username with capitalization
  /// (In the future, a display name can be customized by the user.)
  pub display_name: String,

  /// Email hash for Gravatar
  /// Always set for now since login is email/username+password.
  /// In the future this will need to become an optional *OR* be filled with a bogus hash.
  pub gravatar_hash: String,

  /// For users without a gravatar, we show one of our own avatars.
  pub default_avatar: UserDefaultAvatarInfo,

  // In the future, we'll also support user-uploaded avatars that we store on our servers.
}

#[derive(Serialize, Deserialize, ToSchema, Debug)]
pub struct UserDefaultAvatarInfo {
  pub image_index: u8,
  pub color_index: u8,
}
