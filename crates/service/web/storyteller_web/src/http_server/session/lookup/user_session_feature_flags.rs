use std::collections::BTreeSet;

use enums::by_table::users::user_feature_flag::UserFeatureFlag;

#[derive(Default, Clone)]
pub struct UserSessionFeatureFlags {
  // NB: The BTreeSet maintains order so frontend React code doesn't introduce re-render
  // bugs when order changes and makes React think there has been a state change.
  feature_flags: BTreeSet<UserFeatureFlag>,
}

impl UserSessionFeatureFlags {

  pub fn empty() -> Self {
    Self {
      feature_flags: BTreeSet::new(),
    }
  }

  pub fn new(maybe_feature_flags: Option<&str>) -> Self {
    Self::from_optional_str(maybe_feature_flags)
  }

  // Build from an optional comma-separated list of parseable `UserFeatureFlag` enum features
  pub fn from_optional_str(maybe_feature_flags: Option<&str>) -> Self {
    Self {
      feature_flags: match maybe_feature_flags.as_deref() {
        None => BTreeSet::new(),
        Some(feature_flags) => {
          feature_flags
              .split(",")
              .map(|flag| flag.trim())
              .filter_map(|flag| UserFeatureFlag::from_str(flag).ok())
              .collect()
        }
      }
    }
  }

  pub fn maybe_serialize_string(&self) -> Option<String> {
    if self.feature_flags.is_empty() {
      None
    } else {
      Some(self.feature_flags.iter()
          .map(|flag| flag.to_str())
          .collect::<Vec<&str>>().join(","))
    }
  }

  // NB: The BTreeSet maintains order so frontend React code doesn't introduce re-render
  // bugs when order changes and makes React think there has been a state change.
  pub fn clone_flags(&self) -> BTreeSet<UserFeatureFlag> {
    self.feature_flags.clone()
  }

  pub fn has_flag(&self, permission: UserFeatureFlag) -> bool {
    self.feature_flags.contains(&permission)
  }

  pub fn add_flags<Iter: IntoIterator<Item = UserFeatureFlag>>(&mut self, permissions: Iter) {
    self.feature_flags.extend(permissions);
  }

  pub fn remove_flags(&mut self, permissions: &BTreeSet<UserFeatureFlag>) {
    self.feature_flags = self.feature_flags
        .difference(permissions)
        .cloned()
        .collect::<BTreeSet<UserFeatureFlag>>();
  }

  pub fn keep_flags(&mut self, permissions: &BTreeSet<UserFeatureFlag>) {
    self.feature_flags = self.feature_flags
        .intersection(permissions)
        .cloned()
        .collect();
  }

  pub fn set_flags<Iter: IntoIterator<Item = UserFeatureFlag>>(&mut self, permissions: Iter) {
    self.feature_flags = permissions.into_iter()
        .collect();
  }

  pub fn clear_flags(&mut self) {
    self.feature_flags = BTreeSet::new();
  }
  
  // ----------- Specific Flags ---------- //
  
  pub fn has_seedance_whitelist(&self) -> bool {
    self.feature_flags.contains(&UserFeatureFlag::SeedanceWhitelist)
  }
}

#[cfg(test)]
mod tests {
  use std::collections::BTreeSet;

  use enums::by_table::users::user_feature_flag::UserFeatureFlag;

  use crate::http_server::session::lookup::user_session_feature_flags::UserSessionFeatureFlags;

  mod construction {
    use super::*;

    #[test]
    fn no_flags() {
      let flags = UserSessionFeatureFlags::default();
      assert_eq!(flags.clone_flags().len(), 0);

      for flag in UserFeatureFlag::all_variants() {
        assert_eq!(flags.has_flag(flag), false);
      }

      // TODO(bt,2024-03-05): Expose strum to callers in test packages.
      //for flag in UserFeatureFlag::iter() {
      //  assert_eq!(flags.has_permission_unoptimized(flag), false);
      //}
    }

    #[test]
    fn single_feature() {
      let flags = UserSessionFeatureFlags::from_optional_str(Some("studio"));

      assert_eq!(flags.clone_flags().len(), 1);
      assert_eq!(flags.has_flag(UserFeatureFlag::Studio), true);
      assert_eq!(flags.has_flag(UserFeatureFlag::VideoStyleTransfer), false);
      assert_eq!(flags.has_flag(UserFeatureFlag::ExploreMedia), false);
    }

    #[test]
    fn all_features() {
      let flags =
          UserSessionFeatureFlags::from_optional_str(Some("studio,video_style_transfer,explore_media"));

      assert_eq!(flags.clone_flags().len(), 3);
      assert_eq!(flags.has_flag(UserFeatureFlag::Studio), true);
      assert_eq!(flags.has_flag(UserFeatureFlag::VideoStyleTransfer), true);
      assert_eq!(flags.has_flag(UserFeatureFlag::ExploreMedia), true);
    }

    #[test]
    fn duplication() {
      let flags =
          UserSessionFeatureFlags::from_optional_str(Some("studio,studio,studio,studio"));

      assert_eq!(flags.clone_flags().len(), 1);
      assert_eq!(flags.has_flag(UserFeatureFlag::Studio), true);
      assert_eq!(flags.has_flag(UserFeatureFlag::VideoStyleTransfer), false);
      assert_eq!(flags.has_flag(UserFeatureFlag::ExploreMedia), false);
    }

    #[test]
    fn spacing() {
      let flags =
          UserSessionFeatureFlags::from_optional_str(Some("  studio,  video_style_transfer , , , "));

      assert_eq!(flags.clone_flags().len(), 2);
      assert_eq!(flags.has_flag(UserFeatureFlag::Studio), true);
      assert_eq!(flags.has_flag(UserFeatureFlag::VideoStyleTransfer), true);
      assert_eq!(flags.has_flag(UserFeatureFlag::ExploreMedia), false);
    }

    #[test]
    fn invalid_features_and_typos() {
      let flags =
          UserSessionFeatureFlags::from_optional_str(Some("invalid,,typo,stdo,STUDIO"));

      assert_eq!(flags.clone_flags().len(), 0);
      assert_eq!(flags.has_flag(UserFeatureFlag::Studio), false);
      assert_eq!(flags.has_flag(UserFeatureFlag::VideoStyleTransfer), false);
      assert_eq!(flags.has_flag(UserFeatureFlag::ExploreMedia), false);
    }
  }

  mod serialize {
    use super::*;

    #[test]
    fn no_flags() {
      let flags = UserSessionFeatureFlags::default();
      assert_eq!(flags.clone_flags().len(), 0);

      assert_eq!(flags.maybe_serialize_string(), None);
    }

    #[test]
    fn single_feature() {
      let flags = UserSessionFeatureFlags::from_optional_str(Some("studio"));

      assert_eq!(flags.clone_flags().len(), 1);
      assert_eq!(flags.maybe_serialize_string(), Some("studio".to_string()));
    }

    #[test]
    fn two_features() {
      let flags =
          UserSessionFeatureFlags::from_optional_str(Some("studio,video_style_transfer"));

      assert_eq!(flags.clone_flags().len(), 2);
      assert_eq!(flags.maybe_serialize_string(), Some("studio,video_style_transfer".to_string()));

      let flags =
          UserSessionFeatureFlags::from_optional_str(Some("explore_media,studio"));

      assert_eq!(flags.clone_flags().len(), 2);
      assert_eq!(flags.maybe_serialize_string(), Some("explore_media,studio".to_string()));
    }

    #[test]
    fn three_features() {
      let flags =
          UserSessionFeatureFlags::from_optional_str(Some("studio,video_style_transfer,explore_media"));

      assert_eq!(flags.clone_flags().len(), 3);
      assert_eq!(flags.maybe_serialize_string(), Some("explore_media,studio,video_style_transfer".to_string()));

      // NB: Different order
      let flags =
          UserSessionFeatureFlags::from_optional_str(Some("explore_media,video_style_transfer,studio"));

      assert_eq!(flags.clone_flags().len(), 3);
      assert_eq!(flags.maybe_serialize_string(), Some("explore_media,studio,video_style_transfer".to_string()));
    }
  }

  mod remove_flags {
    use super::*;

    #[test]
    fn no_flags() {
      let mut flags = UserSessionFeatureFlags::default();
      assert_eq!(flags.clone_flags().len(), 0);

      flags.remove_flags(&BTreeSet::from([UserFeatureFlag::ExploreMedia]));
      assert_eq!(flags.clone_flags().len(), 0);
    }

    #[test]
    fn remove_non_existing() {
      let mut flags =
          UserSessionFeatureFlags::from_optional_str(Some("studio,video_style_transfer"));

      assert_eq!(flags.clone_flags().len(), 2);
      assert_eq!(flags.has_flag(UserFeatureFlag::Studio), true);
      assert_eq!(flags.has_flag(UserFeatureFlag::VideoStyleTransfer), true);

      flags.remove_flags(&BTreeSet::from([UserFeatureFlag::ExploreMedia]));

      assert_eq!(flags.clone_flags().len(), 2);
      assert_eq!(flags.has_flag(UserFeatureFlag::Studio), true);
      assert_eq!(flags.has_flag(UserFeatureFlag::VideoStyleTransfer), true);
    }

    #[test]
    fn remove_existing() {
      let mut flags =
          UserSessionFeatureFlags::from_optional_str(Some("studio,video_style_transfer,explore_media"));

      assert_eq!(flags.clone_flags().len(), 3);
      assert_eq!(flags.has_flag(UserFeatureFlag::Studio), true);
      assert_eq!(flags.has_flag(UserFeatureFlag::ExploreMedia), true);
      assert_eq!(flags.has_flag(UserFeatureFlag::VideoStyleTransfer), true);

      flags.remove_flags(&BTreeSet::from([UserFeatureFlag::Studio, UserFeatureFlag::ExploreMedia]));

      assert_eq!(flags.clone_flags().len(), 1);
      assert_eq!(flags.has_flag(UserFeatureFlag::VideoStyleTransfer), true);
    }
  }

  mod add_flags {
    use super::*;

    #[test]
    fn add_none() {
      let mut flags = UserSessionFeatureFlags::default();
      assert_eq!(flags.clone_flags().len(), 0);

      flags.add_flags([]);
      assert_eq!(flags.clone_flags().len(), 0);
    }

    #[test]
    fn add_one() {
      let mut flags =
          UserSessionFeatureFlags::from_optional_str(Some("studio,video_style_transfer"));

      assert_eq!(flags.clone_flags().len(), 2);
      assert_eq!(flags.has_flag(UserFeatureFlag::Studio), true);
      assert_eq!(flags.has_flag(UserFeatureFlag::VideoStyleTransfer), true);

      flags.add_flags([UserFeatureFlag::Studio]);

      assert_eq!(flags.clone_flags().len(), 2);
      assert_eq!(flags.has_flag(UserFeatureFlag::Studio), true);
      assert_eq!(flags.has_flag(UserFeatureFlag::VideoStyleTransfer), true);

      flags.add_flags([UserFeatureFlag::ExploreMedia]);

      assert_eq!(flags.clone_flags().len(), 3);
      assert_eq!(flags.has_flag(UserFeatureFlag::Studio), true);
      assert_eq!(flags.has_flag(UserFeatureFlag::ExploreMedia), true);
      assert_eq!(flags.has_flag(UserFeatureFlag::VideoStyleTransfer), true);
    }

    #[test]
    fn add_multiple() {
      let mut flags =
          UserSessionFeatureFlags::from_optional_str(Some("studio"));

      assert_eq!(flags.clone_flags().len(), 1);
      assert_eq!(flags.has_flag(UserFeatureFlag::Studio), true);

      flags.add_flags([UserFeatureFlag::Studio, UserFeatureFlag::ExploreMedia]);

      assert_eq!(flags.clone_flags().len(), 2);
      assert_eq!(flags.has_flag(UserFeatureFlag::Studio), true);
      assert_eq!(flags.has_flag(UserFeatureFlag::ExploreMedia), true);

      flags.add_flags([UserFeatureFlag::Studio, UserFeatureFlag::ExploreMedia]);

      assert_eq!(flags.clone_flags().len(), 2);
      assert_eq!(flags.has_flag(UserFeatureFlag::Studio), true);
      assert_eq!(flags.has_flag(UserFeatureFlag::ExploreMedia), true);
    }
  }
}
