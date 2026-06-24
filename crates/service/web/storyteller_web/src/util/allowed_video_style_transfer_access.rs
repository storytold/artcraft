use enums::by_table::users::user_feature_flag::UserFeatureFlag;
use mysql_queries::queries::users::user_sessions::get_user_session_by_token::SessionUserRecord;
use crate::http_server::user_lookup::user_session::session_utils::lookup::user_session_extended::UserSessionExtended;
use crate::http_server::user_lookup::user_session::session_utils::lookup::user_session_feature_flags::UserSessionFeatureFlags;

use crate::state::server_state::StaticFeatureFlags;

/// Check whether we should allow the request access to video style transfer
pub fn allowed_video_style_transfer_access(maybe_session: Option<impl UserSessionVideoStyleTransferFlag>, flags: &StaticFeatureFlags) -> bool {
  if !flags.force_session_video_style_transfer_flags {
    return true;
  }

  maybe_session
      .map(|ref session| session.can_access_video_style_transfer())
      .unwrap_or(false)
}

pub trait UserSessionVideoStyleTransferFlag {
  fn can_access_video_style_transfer(&self) -> bool;
}

impl UserSessionVideoStyleTransferFlag for UserSessionExtended {
  fn can_access_video_style_transfer(&self) -> bool {
    self.feature_flags.has_flag(UserFeatureFlag::VideoStyleTransfer)
  }
}

impl UserSessionVideoStyleTransferFlag for &UserSessionExtended {
  fn can_access_video_style_transfer(&self) -> bool {
    self.feature_flags.has_flag(UserFeatureFlag::VideoStyleTransfer)
  }
}

impl UserSessionVideoStyleTransferFlag for SessionUserRecord {
  fn can_access_video_style_transfer(&self) -> bool {
    user_session_has_feature(self)
  }
}

impl UserSessionVideoStyleTransferFlag for &SessionUserRecord {
  fn can_access_video_style_transfer(&self) -> bool {
    user_session_has_feature(self)
  }
}

fn user_session_has_feature(user_session: &SessionUserRecord) -> bool {
  // TODO(bt, 2024-03-05): this is horrible.
  //  There should be a wrapper class between the query and the caller.
  let flags =
      UserSessionFeatureFlags::from_optional_str(user_session.maybe_feature_flags.as_deref());

  flags.has_flag(UserFeatureFlag::VideoStyleTransfer)
}
