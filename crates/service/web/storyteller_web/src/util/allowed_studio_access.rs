use enums::by_table::users::user_feature_flag::UserFeatureFlag;
use mysql_queries::queries::users::user_sessions::get_user_session_by_token::SessionUserRecord;
use crate::http_server::user_lookup::user_session::session_utils::lookup::user_session_extended::UserSessionExtended;
use crate::http_server::user_lookup::user_session::session_utils::lookup::user_session_feature_flags::UserSessionFeatureFlags;

use crate::state::server_state::StaticFeatureFlags;

/// Check whether we should allow the request access to Storyteller Studio features.
pub fn allowed_studio_access(maybe_session: Option<impl UserSessionStudioFlag>, flags: &StaticFeatureFlags) -> bool {
  if !flags.force_session_studio_flags {
    return true;
  }

  maybe_session
      .map(|ref session| session.can_access_studio())
      .unwrap_or(false)
}

pub trait UserSessionStudioFlag {
  fn can_access_studio(&self) -> bool;
}

impl UserSessionStudioFlag for UserSessionExtended {
  fn can_access_studio(&self) -> bool {
    self.role.can_access_studio || self.feature_flags.has_flag(UserFeatureFlag::Studio)
  }
}

impl UserSessionStudioFlag for &UserSessionExtended {
  fn can_access_studio(&self) -> bool {
    self.role.can_access_studio || self.feature_flags.has_flag(UserFeatureFlag::Studio)
  }
}

impl UserSessionStudioFlag for SessionUserRecord {
  fn can_access_studio(&self) -> bool {
    if self.can_access_studio {
      return true
    }

    // TODO(bt, 2024-03-05): this is horrible.
    //  There should be a wrapper class between the query and the caller.
    let flags =
        UserSessionFeatureFlags::from_optional_str(self.maybe_feature_flags.as_deref());

    flags.has_flag(UserFeatureFlag::Studio)
  }
}

impl UserSessionStudioFlag for &SessionUserRecord {
  fn can_access_studio(&self) -> bool {
    if self.can_access_studio {
      return true
    }

    // TODO(bt, 2024-03-05): this is horrible.
    //  There should be a wrapper class between the query and the caller.
    let flags =
        UserSessionFeatureFlags::from_optional_str(self.maybe_feature_flags.as_deref());

    flags.has_flag(UserFeatureFlag::Studio)
  }
}
