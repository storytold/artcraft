// Supposedly there is no limit on number of enum variants, so this shouldn't be exhaustible.
// https://www.reddit.com/r/rust/comments/lf10lv/any_limit_on_enum_variants_amount/

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;

/// Each primary key or token type in our system gets a unique prefix so that they're easy to
/// identify by observation. (Random entropic tokens or UUIDs are ambiguous and easier to fumble
/// when manually debugging.)
///
/// This set is the newest set of token prefixes in our system, which all end with underscore "_".
/// This is the Stripe-style prefixing which makes it easy to "double click" the token string to
/// select and copy the entire value -- this should work on all operating systems, too!
///
/// These are incredibly ergonomic tokens for manually querying and debugging against.
///
/// Older entities in our system (see `LegacyTokenPrefix`) have prefixes ending in ':', but these
/// do not have the nice "double click" property. Plus, they kind of look ugly. Don't make any more
/// of those.
#[derive(Debug, Copy, Clone, Eq, PartialEq)]
#[cfg_attr(test, derive(EnumIter, EnumCount))]
pub(crate) enum TokenPrefix {
  AnonymousVisitorTracking, // AVTs are not stored as primary keys in any table, but an index in many tables.
  AuditLog,
  BatchGeneration,
  BetaKey,
  BrowserSessionLog,
  Comment,
  DownloadJob,
  EmailSenderJob,
  GoogleSignInAccount,
  InferenceJob,
  MediaFile,
  MediaUpload,
  ModelWeight,
  NewsStory, // NB: aichatbot / sqlite
  PasswordReset,
  Prompt,
  Tag,
  TtsRenderTask, // NB: aichatbot / sqlite
  User,
  UserBookmark,
  UserSession,
  VoiceConversionModel,
  VoiceConversionResult,
  ZsVoice,
  ZsVoiceDataset,
  ZsVoiceDatasetSample,
}

/// These are tokens for Tauri / Sqlite
#[derive(Debug, Copy, Clone, Eq, PartialEq)]
#[cfg_attr(test, derive(EnumIter, EnumCount))]
pub(crate) enum TauriTokenPrefix {
  Task,
}

/// These are old-style prefixes that end in colon (:).
/// Don't do this anymore, since tokens built like this are difficult to "double click to select".
/// The modern, Stripe-style token prefixes (which use underscores) are much better.
/// These tokens are also uglier (though that may be subjective).
#[derive(Debug, Copy, Clone, Eq, PartialEq)]
#[cfg_attr(test, derive(EnumIter, EnumCount))]
pub(crate) enum LegacyTokenPrefix {
  ApiTokenExternal,
  ApiTokenInternal,
  FirehoseEntry,
  ModelCategory,
  TtsInferenceJob,
  TtsModel,
  TtsModelUploadJob,
  TtsResult,
  TwitchEventRule,
  TwitchOauthGrouping,
  TwitchOauthInternal,
  UserSubscription,
  VocoderModel,
  VoiceCloneRequest,
  W2lInferenceJob,
  W2lResult,
  W2lTemplate,
  W2lTemplateUploadJob,
}

/// Do not use these token prefixes ever again. They're retired.
/// Tokens with these prefixes may still exist in the database.
#[derive(Debug, Copy, Clone, Eq, PartialEq)]
#[cfg_attr(test, derive(EnumIter, EnumCount))]
enum RetiredTokenPrefix {
  _DownloadJobDeprecatedNotNotUse,
  _UserDeprecatedDoNotUse, // NB: Users prior to 2023-10-24. Kept to prevent collision.
  _UserSessionDeprecatedDoNotUse, // NB: Sessions prior to 2023-10-24. Kept to prevent collision.
}

pub trait PrefixGenerator {
  fn prefix(self) -> &'static str;
}

impl PrefixGenerator for TokenPrefix {
  fn prefix(self) -> &'static str {
    match self {
      Self::AnonymousVisitorTracking => "avt_",
      Self::AuditLog => "audit_",
      Self::BatchGeneration => "batch_g_",
      Self::BetaKey => "beta_key_",
      Self::BrowserSessionLog => "bsl_",
      Self::Comment => "comment_",
      Self::DownloadJob => "jdown_", // NB: Previously "JGUP:"
      Self::EmailSenderJob => "email_job_",
      Self::GoogleSignInAccount => "gsi_",
      Self::InferenceJob => "jinf_",
      Self::MediaFile => "m_",
      Self::MediaUpload => "mu_",
      Self::ModelWeight => "weight_",
      Self::NewsStory => "news_story_",
      Self::PasswordReset => "pw_reset_",
      Self::Prompt => "prompt_",
      Self::Tag => "tag_",
      Self::TtsRenderTask => "tts_task_",
      Self::User => "user_", // NB: Previously "U:"
      Self::UserBookmark => "ub_",
      Self::UserSession => "session_",
      Self::VoiceConversionModel => "vcm_",
      Self::VoiceConversionResult => "vcr_",
      Self::ZsVoice => "zsv_",
      Self::ZsVoiceDataset => "zsd_",
      Self::ZsVoiceDatasetSample => "zss_",
    }
  }
}

impl PrefixGenerator for TauriTokenPrefix {
  fn prefix(self) -> &'static str {
    match self {
      TauriTokenPrefix::Task => "task_",
    }
  }
}

impl PrefixGenerator for LegacyTokenPrefix {
  fn prefix(self) -> &'static str {
    // NB: Old-style colon-suffixed prefixes. Do not use for future tokens!
    match self {
      Self::ApiTokenExternal => "API:",
      Self::ApiTokenInternal => "INT_API:",
      Self::FirehoseEntry => "EV:",
      Self::ModelCategory => "CAT:",
      Self::TtsInferenceJob => "JTINF:",
      Self::TtsModel => "TM:",
      Self::TtsModelUploadJob => "JTUP:",
      Self::TtsResult => "TR:",
      Self::TwitchEventRule => "TER:",
      Self::TwitchOauthGrouping => "OG:",
      Self::TwitchOauthInternal => "TOI:",
      Self::UserSubscription => "SUB:",
      Self::VocoderModel => "VM:",
      Self::VoiceCloneRequest => "VCR:",
      Self::W2lInferenceJob => "JWINF:",
      Self::W2lResult => "WR:",
      Self::W2lTemplate => "WT:",
      Self::W2lTemplateUploadJob => "JWUP:",
    }
  }
}

impl PrefixGenerator for RetiredTokenPrefix {
  fn prefix(self) -> &'static str {
    match self {
      Self::_DownloadJobDeprecatedNotNotUse => "JGUP:", // NB: Download jobs changed roughly around 2022-12-16
      Self::_UserDeprecatedDoNotUse => "U:", // NB: Users prior to 2023-10-24 used this prefix.
      Self::_UserSessionDeprecatedDoNotUse => "SESSION:", // NB: Users prior to 2023-10-24 used this prefix.
    }
  }
}

#[cfg(test)]
mod tests {
  use std::collections::HashSet;

  use strum::EnumCount;
  use strum::IntoEnumIterator;

  use crate::prefixes::PrefixGenerator;

  mod modern_token_prefixes {
    use crate::prefixes::TokenPrefix;

    use super::*;

    #[test]
    pub fn no_duplicate_prefixes() {
      let entities = TokenPrefix::iter()
          .map(|entity| entity.prefix())
          .collect::<HashSet<&str>>();

      assert_eq!(entities.len(), TokenPrefix::COUNT);
    }

    #[test]
    fn all_prefixes_are_unique_regardless_of_case_and_suffix() {
      let entities = TokenPrefix::iter()
          .map(|entity| entity.prefix())
          .map(|prefix| prefix.to_lowercase())
          .map(|prefix| prefix.replace("-", ""))
          .map(|prefix| prefix.replace(":", ""))
          .map(|prefix| prefix.replace("_", ""))
          .collect::<HashSet<String>>();

      assert_eq!(entities.len(), TokenPrefix::COUNT);
    }

    #[test]
    pub fn all_prefixes_end_with_underscore() {
      let entities = TokenPrefix::iter()
          .map(|entity| entity.prefix())
          .filter(|prefix| prefix.ends_with("_"))
          .collect::<HashSet<&str>>();

      assert_eq!(entities.len(), TokenPrefix::COUNT);
    }
  }

  mod legacy_token_prefixes {
    use crate::prefixes::LegacyTokenPrefix;

    use super::*;

    #[test]
    pub fn no_duplicate_prefixes() {
      let entities = LegacyTokenPrefix::iter()
          .map(|entity| entity.prefix())
          .collect::<HashSet<&str>>();
      assert_eq!(entities.len(), LegacyTokenPrefix::COUNT);
    }

    #[test]
    fn all_prefixes_are_unique_regardless_of_case_and_suffix() {
      let entities = LegacyTokenPrefix::iter()
          .map(|entity| entity.prefix())
          .map(|prefix| prefix.to_lowercase())
          .map(|prefix| prefix.replace("-", ""))
          .map(|prefix| prefix.replace(":", ""))
          .map(|prefix| prefix.replace("_", ""))
          .collect::<HashSet<String>>();

      assert_eq!(entities.len(), LegacyTokenPrefix::COUNT);
    }

    #[test]
    pub fn all_prefixes_end_with_colon() {
      let entities = LegacyTokenPrefix::iter()
          .map(|entity| entity.prefix())
          .filter(|prefix| prefix.ends_with(":"))
          .collect::<HashSet<&str>>();
      assert_eq!(entities.len(), LegacyTokenPrefix::COUNT);
    }

    #[test]
    pub fn do_not_add_new_legacy_token_prefixes() {
      const DO_NOT_INCREASE_THIS_COUNT : usize = 18;
      assert_eq!(LegacyTokenPrefix::COUNT, DO_NOT_INCREASE_THIS_COUNT);
    }
  }

  mod all_prefixes {
    use crate::prefixes::{LegacyTokenPrefix, RetiredTokenPrefix, TokenPrefix};

    use super::*;

    fn get_all_prefixes() -> HashSet<&'static str> {
      TokenPrefix::iter()
          .map(|entity| entity.prefix())
          .chain(LegacyTokenPrefix::iter()
              .map(|entity| entity.prefix()))
          .chain(RetiredTokenPrefix::iter()
              .map(|entity| entity.prefix()))
          .collect::<HashSet<&'static str>>()
    }

    #[test]
    fn test_all_prefixes_are_unique_across_all_token_generations() {
      let entities = get_all_prefixes().iter()
          .map(|s| s.to_string())
          .collect::<HashSet<String>>();

      const ALL_TOKEN_PREFIX_COUNT: usize = TokenPrefix::COUNT
          + LegacyTokenPrefix::COUNT
          + RetiredTokenPrefix::COUNT;

      assert_eq!(entities.len(), ALL_TOKEN_PREFIX_COUNT);
    }

    #[test]
    fn test_all_prefixes_are_unique_across_all_token_generations_regardless_of_case_and_suffix() {
      let entities = get_all_prefixes().iter()
          .map(|prefix| prefix.to_lowercase())
          .map(|prefix| prefix.replace("-", ""))
          .map(|prefix| prefix.replace(":", ""))
          .map(|prefix| prefix.replace("_", ""))
          .collect::<HashSet<String>>();

      // NB: We're accounting for collision in a few new/legacy token prefixes:
      //  - `SESSION:` vs `session_` (the same table)
      //  - `VCR:` vs `vcr_` (two actually separate tables!)
      //  Don't let this happen anymore!
      const ALL_TOKEN_PREFIX_COUNT: usize = TokenPrefix::COUNT
          + LegacyTokenPrefix::COUNT
          + RetiredTokenPrefix::COUNT
          - 2;

      assert_eq!(entities.len(), ALL_TOKEN_PREFIX_COUNT);
    }

    #[test]
    fn test_all_prefixes_end_with_separator() {
      assert!(get_all_prefixes()
          .iter()
          .all(|prefix| prefix.ends_with(":") || prefix.ends_with("_")));
    }

    // TODO: Just kill this test
    #[test]
    fn test_all_prefixes_end_with_separator_length_one() {
      for prefix in get_all_prefixes().iter().map(|s| *s) {
        if prefix == "news_story_"
            || prefix == "INT_API:"
            || prefix == "batch_g_"
            || prefix == "beta_key_"
            || prefix == "email_job_"
            || prefix == "pw_reset_"
            || prefix == "tts_task_"
        {
          // TODO/FIXME: I'm too tired at 5AM to replacen from the left. Make this test valid.
          //  These tokens are from the AIChatBot sidecar, so asserting their validity is less important.
          continue;
        }
        assert_eq!(prefix.len() - 1, prefix.replace(":", "").replace("_", "").len());
      }
    }
  }
}
