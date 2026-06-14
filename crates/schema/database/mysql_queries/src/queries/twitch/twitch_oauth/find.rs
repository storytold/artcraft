//! Return the *SINGLE MOST RECENT* Twitch OAuth token per the search params.

use anyhow::anyhow;
use chrono::{DateTime, Utc};
use log::error;
use sqlx::MySqlPool;

use errors::AnyhowResult;

use crate::helpers::boolean_converters::i8_to_bool;

#[derive(Serialize, Clone)]
pub struct TwitchOauthTokenRecord {
  /// Our internal token metadata / bookkeeping
  pub internal_token: String,
  pub oauth_refresh_grouping_token: String,
  pub refresh_count: u32,
  pub ip_address_creation: Option<String>,

  /// NB: Vocodes/FakeYou/Storyteller user
  pub maybe_user_token: Option<String>,
  pub maybe_user_display_name: Option<String>,
  pub maybe_user_gravatar_hash: Option<String>,

  /// Twitch user
  pub twitch_user_id: String,
  pub twitch_username: String,
  pub twitch_username_lowercase: String,

  /// Twitch token details
  pub access_token: String,
  pub maybe_refresh_token: Option<String>,
  pub token_type: Option<String>,
  pub expires_in_seconds: Option<u32>,
  pub has_bits_read: bool,
  pub has_channel_read_redemptions: bool,
  pub has_channel_read_subscriptions: bool,
  pub has_chat_edit: bool,
  pub has_chat_read: bool,

  /// Potentially when the token is expected to expire.
  /// Do not eagerly refresh. Lazily renew.
  pub expires_at: Option<DateTime<Utc>>,
  pub user_deleted_at: Option<DateTime<Utc>>,
  pub mod_deleted_at: Option<DateTime<Utc>>,
}

/// Return the *SINGLE MOST RECENT* Twitch OAuth token per the search params.
pub struct TwitchOauthTokenFinder {
  /// Storyteller/FakeYou username
  scope_user_token: Option<String>,

  scope_twitch_user_id: Option<u32>,
  scope_twitch_username_lowercase: Option<String>,

  /// Allow return of expired tokens? Expired tokens can be renewed.
  allow_expired_tokens: bool,
}

impl TwitchOauthTokenFinder {
  pub fn new() -> Self {
    Self {
      scope_user_token: None,
      scope_twitch_user_id: None,
      scope_twitch_username_lowercase: None,
      allow_expired_tokens: false,
    }
  }

  pub fn scope_user_token(mut self, user_token: Option<&str>) -> Self {
    self.scope_user_token = user_token.map(|t| t.to_string());
    self
  }

  pub fn scope_twitch_user_id(mut self, user_id: Option<u32>) -> Self {
    self.scope_twitch_user_id = user_id;
    self
  }

  /// This will automatically look up against a lowercased username
  pub fn scope_twitch_username(mut self, twitch_username: Option<&str>) -> Self {
    self.scope_twitch_username_lowercase = twitch_username
        .map(|t| t.to_string().to_lowercase());
    self
  }

  pub fn allow_expired_tokens(mut self, allow_expired: bool) -> Self {
    self.allow_expired_tokens = allow_expired;
    self
  }

  pub async fn perform_query(
    &self,
    mysql_pool: &MySqlPool
  ) -> AnyhowResult<Option<TwitchOauthTokenRecord>> {
    Ok(self.perform_query_internal(mysql_pool).await?
        .map(|record| {
          TwitchOauthTokenRecord {
            internal_token: record.internal_token,
            oauth_refresh_grouping_token: record.oauth_refresh_grouping_token,
            maybe_user_token: record.maybe_user_token,
            maybe_user_display_name: record.maybe_user_display_name,
            maybe_user_gravatar_hash: record.maybe_user_gravatar_hash,
            twitch_user_id: record.twitch_user_id,
            twitch_username: record.twitch_username,
            twitch_username_lowercase: record.twitch_username_lowercase,
            access_token: record.access_token,
            maybe_refresh_token: record.maybe_refresh_token,
            token_type: record.token_type,
            expires_in_seconds: record.expires_in_seconds,
            refresh_count: record.refresh_count,
            has_bits_read: i8_to_bool(record.has_bits_read),
            has_channel_read_redemptions: i8_to_bool(record.has_channel_read_redemptions),
            has_channel_read_subscriptions: i8_to_bool(record.has_channel_read_subscriptions),
            has_chat_edit: i8_to_bool(record.has_chat_edit),
            has_chat_read: i8_to_bool(record.has_chat_read),
            ip_address_creation: record.ip_address_creation,
            expires_at: record.expires_at,
            user_deleted_at: record.user_deleted_at,
            mod_deleted_at: record.mod_deleted_at,
          }
        }))
  }

  pub async fn perform_query_internal(
    &self,
    mysql_pool: &MySqlPool
  ) -> AnyhowResult<Option<TwitchOauthTokenRecordInternal>> {

    let query = self.build_query_string();
    let mut query = sqlx::query_as::<_, TwitchOauthTokenRecordInternal>(sqlx::AssertSqlSafe(&*query));
    //let mut query = sqlx::query(sqlx::AssertSqlSafe(&*query));

    // NB: The following bindings must match the order of the query builder !!

    if let Some(user_token) = self.scope_user_token.as_deref() {
      query = query.bind(user_token);
    }

    if let Some(user_id) = self.scope_twitch_user_id {
      query = query.bind(user_id);
    }

    if let Some(twitch_username) = self.scope_twitch_username_lowercase.as_deref() {
      query = query.bind(twitch_username);
    }

    let result = query.fetch_optional(mysql_pool).await;

    match result {
      Ok(Some(record)) => {
        Ok(Some(record))
      }
      Ok(None) => {
        Ok(None)
      },
      Err(err) => {
        error!("twitch oauth token query error: {:?}", err);
        Err(anyhow!("twitch oauth token query error: {:?}", err))
      }
    }
  }

  pub fn build_query_string(&self) -> String {
    // TODO/NB: Unfortunately SQLx can't statically typecheck this query
    let mut query = r#"
SELECT
    twitch_oauth_tokens.internal_token,
    twitch_oauth_tokens.oauth_refresh_grouping_token,
    users.username as maybe_username,
    users.display_name as maybe_user_display_name,
    users.email_gravatar_hash as maybe_user_gravatar_hash,
    twitch_oauth_tokens.maybe_user_token,

    twitch_oauth_tokens.twitch_user_id,
    twitch_oauth_tokens.twitch_username,
    twitch_oauth_tokens.twitch_username_lowercase,

    twitch_oauth_tokens.access_token,
    twitch_oauth_tokens.maybe_refresh_token,
    twitch_oauth_tokens.token_type,
    twitch_oauth_tokens.expires_in_seconds,
    twitch_oauth_tokens.refresh_count,
    twitch_oauth_tokens.has_bits_read,
    twitch_oauth_tokens.has_channel_read_redemptions,
    twitch_oauth_tokens.has_channel_read_subscriptions,
    twitch_oauth_tokens.has_chat_edit,
    twitch_oauth_tokens.has_chat_read,
    twitch_oauth_tokens.ip_address_creation,
    twitch_oauth_tokens.created_at,
    twitch_oauth_tokens.updated_at,
    twitch_oauth_tokens.expires_at,
    twitch_oauth_tokens.user_deleted_at,
    twitch_oauth_tokens.mod_deleted_at

FROM twitch_oauth_tokens
LEFT OUTER JOIN users
    ON twitch_oauth_tokens.maybe_user_token = users.token
    "#.to_string();

    query.push_str(&self.build_predicates());

    query
  }

  pub fn build_predicates(&self) -> String {
    let mut query = "".to_string();
    let mut first_predicate_added = false;

    if let Some(_user_token) = self.scope_user_token.as_deref() {
      if !first_predicate_added {
        query.push_str(" WHERE users.token = ?");
        first_predicate_added = true;
      } else {
        query.push_str(" AND users.token = ?");
      }
    }

    if let Some(_user_id) = self.scope_twitch_user_id {
      if !first_predicate_added {
        query.push_str(" WHERE twitch_oauth_tokens.twitch_user_id = ?");
        first_predicate_added = true;
      } else {
        query.push_str(" AND twitch_oauth_tokens.twitch_user_id = ?");
      }
    }

    if let Some(_username) = self.scope_twitch_username_lowercase.as_deref() {
      if !first_predicate_added {
        query.push_str(" WHERE twitch_oauth_tokens.twitch_username_lowercase = ?");
        first_predicate_added = true;
      } else {
        query.push_str(" AND twitch_oauth_tokens.twitch_username_lowercase = ?");
      }
    }

    if !self.allow_expired_tokens {
      if !first_predicate_added {
        query.push_str(" WHERE ( twitch_oauth_tokens.expires_at IS NULL OR twitch_oauth_tokens.expires_at > NOW() ) ");
      } else {
        query.push_str(" AND ( twitch_oauth_tokens.expires_at IS NULL OR twitch_oauth_tokens.expires_at > NOW() ) ");
      }
    }

    // NB: Return the most recent.
    // This might have stupid race condition/transaction weirdness.
    // Sorry future me.
    query.push_str(" ORDER BY twitch_oauth_tokens.id DESC");

    // NB: Only a single record.
    query.push_str(" LIMIT 1");

    query
  }
}

#[derive(sqlx::FromRow)]
pub struct TwitchOauthTokenRecordInternal {
  /// Our internal token metadata / bookkeeping
  pub internal_token: String,
  pub oauth_refresh_grouping_token: String,
  pub refresh_count: u32,
  pub ip_address_creation: Option<String>,

  /// NB: Vocodes/FakeYou/Storyteller user
  pub maybe_user_token: Option<String>,
  pub maybe_user_display_name: Option<String>,
  pub maybe_user_gravatar_hash: Option<String>,

  /// Twitch user
  pub twitch_user_id: String,
  pub twitch_username: String,
  pub twitch_username_lowercase: String,

  /// Token details
  pub access_token: String,
  pub maybe_refresh_token: Option<String>,
  pub token_type: Option<String>,
  pub expires_in_seconds: Option<u32>,
  pub has_bits_read: i8,
  pub has_channel_read_subscriptions: i8,
  pub has_channel_read_redemptions: i8,
  pub has_chat_edit: i8,
  pub has_chat_read: i8,

  /// Potentially when the token is expected to expire.
  /// Do not eagerly refresh. Lazily renew.
  pub expires_at: Option<DateTime<Utc>>,
  pub user_deleted_at: Option<DateTime<Utc>>,
  pub mod_deleted_at: Option<DateTime<Utc>>,
}
