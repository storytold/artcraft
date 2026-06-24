use sqlx::pool::PoolConnection;
use sqlx::{Acquire, MySql};

use enums::by_table::users::user_feature_flag::UserFeatureFlag;
use errors::AnyhowResult;
use mysql_queries::queries::users::user::update::set_can_access_studio_transactional::{set_can_access_studio_transactional, SetCanAccessStudioArgs};
use mysql_queries::queries::users::user::update::set_user_feature_flags_transactional::{set_user_feature_flags_transactional, SetUserFeatureFlagTransactionalArgs};
use tokens::tokens::users::UserToken;

use crate::http_server::user_lookup::user_session::session_utils::lookup::user_session_feature_flags::UserSessionFeatureFlags;

pub async fn enroll_in_studio(
  user_token: &UserToken,
  ip_address: &str,
  mysql_connection: &mut PoolConnection<MySql>,
  maybe_existing_feature_flags: Option<&UserSessionFeatureFlags>
) -> AnyhowResult<()> {

  let mut user_feature_flags = maybe_existing_feature_flags
      .map(|ff| ff.clone())
      .unwrap_or_else(|| UserSessionFeatureFlags::empty());

  if user_feature_flags.has_flag(UserFeatureFlag::Studio)
      && user_feature_flags.has_flag(UserFeatureFlag::VideoStyleTransfer) {
    return Ok(());
  }

  user_feature_flags.add_flags([
    UserFeatureFlag::Studio,
    UserFeatureFlag::VideoStyleTransfer,
  ]);

  let mut transaction = mysql_connection.begin().await?;

  set_user_feature_flags_transactional(SetUserFeatureFlagTransactionalArgs {
    subject_user_token: user_token,
    maybe_feature_flags: user_feature_flags.maybe_serialize_string().as_deref(),
    maybe_mod_user_token: None,
    ip_address: &ip_address,
    transaction: &mut transaction,
  }).await?;

  // NB: This isn't a necessary field, but can be useful for analytics.
  set_can_access_studio_transactional(SetCanAccessStudioArgs {
    subject_user_token: user_token,
    can_access_studio: true,
    transaction: &mut transaction,
  }).await?;

  transaction.commit().await?;

  Ok(())
}
