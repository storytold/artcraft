use enums::by_table::users::user_feature_flag::UserFeatureFlag;
use mysql_queries::queries::users::user_sessions::get_user_session_by_token::SessionUserRecord;
use crate::http_server::user_lookup::user_session::session_utils::lookup::user_session_extended::UserSessionExtended;
use crate::http_server::user_lookup::user_session::session_utils::lookup::user_session_feature_flags::UserSessionFeatureFlags;

/// Check whether we should allow the request access to explore media.
pub fn allowed_explore_media_access(maybe_session: Option<impl UserSessionExploreMediaFlag>) -> bool {
  // NB: We're more careful here since this is sensitive until we have NLP checks.
  maybe_session
      .map(|ref session| session.can_access_explore_media())
      .unwrap_or(false)
}

pub trait UserSessionExploreMediaFlag {
  fn can_access_explore_media(&self) -> bool;
}

impl UserSessionExploreMediaFlag for UserSessionExtended {
  fn can_access_explore_media(&self) -> bool {
    self.feature_flags.has_flag(UserFeatureFlag::ExploreMedia)
  }
}

impl UserSessionExploreMediaFlag for &UserSessionExtended {
  fn can_access_explore_media(&self) -> bool {
    self.feature_flags.has_flag(UserFeatureFlag::ExploreMedia)
  }
}

impl UserSessionExploreMediaFlag for SessionUserRecord {
  fn can_access_explore_media(&self) -> bool {
    user_session_has_feature(self)
  }
}

impl UserSessionExploreMediaFlag for &SessionUserRecord {
  fn can_access_explore_media(&self) -> bool {
    user_session_has_feature(self)
  }
}

fn user_session_has_feature(user_session: &SessionUserRecord) -> bool {
  // TODO(bt, 2024-03-05): this is horrible.
  //  There should be a wrapper class between the query and the caller.
  let flags =
      UserSessionFeatureFlags::from_optional_str(user_session.maybe_feature_flags.as_deref());

  flags.has_flag(UserFeatureFlag::ExploreMedia)
}
