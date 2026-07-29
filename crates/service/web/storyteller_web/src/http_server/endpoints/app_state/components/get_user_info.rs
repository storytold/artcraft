use crate::http_server::common_responses::user_details_lite::UserDefaultAvatarInfo;
use crate::http_server::user_lookup::user_session::session_utils::lookup::user_session_extended::UserSessionExtended;
use tokens::tokens::users::UserToken;
use utoipa::ToSchema;

/// Information on the logged-in user's account.
/// (This is a copy of the `UserDetailsLight` struct.)
#[derive(Serialize, ToSchema)]
pub struct AppStateUserInfo {
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

pub fn get_user_info(
  user: &UserSessionExtended
) -> AppStateUserInfo {
  AppStateUserInfo {
    default_avatar: UserDefaultAvatarInfo::from_username(&user.user.username),
    user_token: user.user_token_typed.clone(),
    username: user.user.username.to_string(),
    display_name: user.user.display_name.to_string(),
    gravatar_hash: user.user.email_gravatar_hash.to_string(),
  }
}
