// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use actix_artcraft::sessions::user_sessions::http_user_session_manager::HttpUserSessionManager;
use actix_web::HttpRequest;
use log::warn;
use mysql_queries::queries::users::user_sessions::get_user_session_by_token::{get_user_session_by_token, get_user_session_by_token_pooled_connection, SessionUserRecord};
use mysql_queries::queries::users::user_sessions::get_user_session_by_token_light::{get_user_session_by_token_light, SessionRecord};
use mysql_queries::queries::users::user_subscriptions::list_active_user_subscriptions::list_active_user_subscriptions;
use redis_caching::redis_ttl_cache::{RedisTtlCache, RedisTtlCacheConnection};
use redis_common::redis_cache_keys::RedisCacheKeys;
use sqlx::pool::PoolConnection;
use sqlx::{Executor, MySql, MySqlPool};

use crate::http_server::session::lookup::user_session_extended::{UserSessionExtended, UserSessionPreferences, UserSessionPremiumPlanInfo, UserSessionRoleAndPermissions, UserSessionSubscriptionPlan, UserSessionUserDetails};
use crate::http_server::session::lookup::user_session_feature_flags::UserSessionFeatureFlags;
use crate::http_server::session::session_checker_error::SessionCheckerError;

#[derive(Clone)]
pub struct SessionChecker {
  cookie_manager: HttpUserSessionManager,
  maybe_redis_ttl_cache: Option<RedisTtlCache>,
}

impl SessionChecker {

  pub fn new(cookie_manager: &HttpUserSessionManager) -> Self {
    Self {
      cookie_manager: cookie_manager.clone(),
      maybe_redis_ttl_cache: None,
    }
  }

  pub fn new_with_cache(cookie_manager: &HttpUserSessionManager, redis_ttl_cache: RedisTtlCache) -> Self {
    Self {
      cookie_manager: cookie_manager.clone(),
      maybe_redis_ttl_cache: Some(redis_ttl_cache),
    }
  }

  pub fn get_session_token(&self, request: &HttpRequest) -> Result<Option<String>, SessionCheckerError> {
    Ok(self.cookie_manager.decode_session_payload_from_request(request)?
        .map(|payload| payload.session_token))
  }

  pub fn forgiving_get_session_token(&self, request: &HttpRequest) -> Option<String> {
    self.get_session_token(request).ok().flatten()
  }

  // ==================== SessionRecord ====================

  //#[deprecated = "Use the PoolConnection<MySql> method instead of the MySqlPool one."]
  pub async fn maybe_get_session_light(
    &self,
    request: &HttpRequest,
    pool: &MySqlPool
  ) -> Result<Option<SessionRecord>, SessionCheckerError>
  {
    self.do_session_light_lookup_and_cookie_decode(request, pool).await
  }


  pub async fn maybe_get_session_light_from_connection(
    &self,
    request: &HttpRequest,
    mysql_connection: &mut PoolConnection<MySql>,
  ) -> Result<Option<SessionRecord>, SessionCheckerError>
  {
    self.do_session_light_lookup_and_cookie_decode(request, &mut **mysql_connection).await
  }


  async fn do_session_light_lookup_and_cookie_decode<'e, 'c : 'e, E>(
    &self,
    request: &HttpRequest,
    mysql_executor: E,
  ) -> Result<Option<SessionRecord>, SessionCheckerError>
    where E: 'e + Executor<'c, Database = MySql>
  {
    let maybe_session_token = self.cookie_manager.decode_session_payload_from_request(request)?
        .map(|payload| payload.session_token);

    let session_token = match maybe_session_token {
      Some(token) => token,
      None => return Ok(None),
    };

    self.do_session_light_lookup(mysql_executor, &session_token).await
  }


  async fn do_session_light_lookup<'e, 'c : 'e, E>(
    &self,
    mysql_executor: E,
    session_token: &str,
  ) -> Result<Option<SessionRecord>, SessionCheckerError>
    where E: 'e + Executor<'c, Database = MySql>
  {
    match self.maybe_get_redis_cache_connection() {
      None => {
        Ok(get_user_session_by_token_light(mysql_executor, session_token).await?)
      }
      Some(mut redis_ttl_cache) => {
        let cache_key = RedisCacheKeys::session_record_light(session_token);
        // NB: Redis cache requires AnyhowResult; convert sqlx::Error to anyhow inside the closure,
        //     then map any error from the cache layer back to SessionCheckerError::OtherError.
        let result = redis_ttl_cache.lazy_load_if_not_cached(&cache_key, move || async move {
          get_user_session_by_token_light(mysql_executor, session_token)
              .await
              .map_err(anyhow::Error::from)
        }).await;
        result.map_err(SessionCheckerError::OtherError)
      }
    }
  }


  // ==================== SessionUserRecord ====================

  //#[deprecated = "Use the PoolConnection<MySql> method instead of the MySqlPool one."]
  pub async fn maybe_get_user_session(
    &self,
    request: &HttpRequest,
    pool: &MySqlPool,
  ) -> Result<Option<SessionUserRecord>, SessionCheckerError>
  {
    self.do_user_session_lookup_and_cookie_decode(request, pool).await
  }


  pub async fn maybe_get_user_session_from_connection(
    &self,
    request: &HttpRequest,
    mysql_connection: &mut PoolConnection<MySql>,
  ) -> Result<Option<SessionUserRecord>, SessionCheckerError>
  {
    self.do_user_session_lookup_and_cookie_decode(request, &mut **mysql_connection).await
  }


  async fn do_user_session_lookup_and_cookie_decode<'e, 'c : 'e, E>(
    &self,
    request: &HttpRequest,
    mysql_executor: E,
  ) -> Result<Option<SessionUserRecord>, SessionCheckerError>
    where E: 'e + Executor<'c, Database = MySql>
  {
    let session_token = match self.get_session_token(request)? {
      None => return Ok(None),
      Some(session_token) => session_token,
    };

    self.do_user_session_lookup(mysql_executor, &session_token).await
  }


  async fn do_user_session_lookup<'e, 'c : 'e, E>(
    &self,
    mysql_executor: E,
    session_token: &str,
  ) -> Result<Option<SessionUserRecord>, SessionCheckerError>
    where E: 'e + Executor<'c, Database = MySql>
  {
    match self.maybe_get_redis_cache_connection() {
      None => {
        Ok(get_user_session_by_token(mysql_executor, session_token).await?)
      }
      Some(mut redis_ttl_cache) => {
        let cache_key = RedisCacheKeys::session_record_user(session_token);
        let result = redis_ttl_cache.lazy_load_if_not_cached(&cache_key, move || async move {
          get_user_session_by_token(mysql_executor, session_token)
              .await
              .map_err(anyhow::Error::from)
        }).await;
        result.map_err(SessionCheckerError::OtherError)
      }
    }
  }


  // ==================== UserSessionExtended ====================

  //#[deprecated = "Use the PoolConnection<MySql> method instead of the MySqlPool one."]
  pub async fn maybe_get_user_session_extended(
    &self,
    request: &HttpRequest,
    pool: &MySqlPool,
  ) -> Result<Option<UserSessionExtended>, SessionCheckerError>
  {
    let mut connection = pool.acquire().await?;
    self.maybe_get_user_session_extended_from_connection(request, &mut connection).await
  }

  pub async fn maybe_get_user_session_extended_from_connection(
    &self,
    request: &HttpRequest,
    mysql_connection: &mut PoolConnection<MySql>,
  ) -> Result<Option<UserSessionExtended>, SessionCheckerError>
  {
    let session_payload= match self.cookie_manager.decode_session_payload_from_request(request)? {
      None => return Ok(None),
      Some(session_payload) => session_payload,
    };

    // TODO: Fire both requests off simultaneously.
    let user_session = {
      match get_user_session_by_token_pooled_connection(mysql_connection, &session_payload.session_token).await? {
        None => return Ok(None),
        Some(u) => u,
      }
    };

    // TODO: Cache this so we don't hit the database twice.
    let subscriptions =
        list_active_user_subscriptions(
          mysql_connection,
          user_session.user_token.as_str()
        ).await
        .map_err(SessionCheckerError::OtherError)?;

    Ok(Some(UserSessionExtended {
      user_token: user_session.user_token.as_str().to_string(),
      user_token_typed: user_session.user_token,
      user: UserSessionUserDetails {
        username: user_session.username,
        display_name: user_session.display_name,
        email_address: user_session.email_address,
        email_confirmed: user_session.email_confirmed,
        email_gravatar_hash: user_session.email_gravatar_hash,
      },
      premium: UserSessionPremiumPlanInfo {
        maybe_stripe_customer_id: user_session.maybe_stripe_customer_id,
        maybe_loyalty_program_key: user_session.maybe_loyalty_program_key,
        subscription_plans: subscriptions.into_iter()
            .map(|subscription| {
              UserSessionSubscriptionPlan {
                subscription_namespace: subscription.subscription_namespace,
                subscription_product_slug: subscription.subscription_product_slug,
                subscription_expires_at: subscription.subscription_expires_at,
              }
            })
            .collect::<Vec<UserSessionSubscriptionPlan>>()
      },
      preferences: UserSessionPreferences {
        disable_gravatar: user_session.disable_gravatar,
        auto_play_audio_preference: user_session.auto_play_audio_preference,
        preferred_tts_result_visibility: user_session.preferred_tts_result_visibility,
        preferred_w2l_result_visibility: user_session.preferred_w2l_result_visibility,
        auto_play_video_preference: user_session.auto_play_video_preference,
      },
      role: UserSessionRoleAndPermissions {
        user_role_slug: user_session.user_role_slug,
        is_banned: user_session.is_banned,
        can_access_studio: user_session.can_access_studio,
        can_use_tts: user_session.can_use_tts,
        can_use_w2l: user_session.can_use_w2l,
        can_delete_own_tts_results: user_session.can_delete_own_tts_results,
        can_delete_own_w2l_results: user_session.can_delete_own_w2l_results,
        can_delete_own_account: user_session.can_delete_own_account,
        can_upload_tts_models: user_session.can_upload_tts_models,
        can_upload_w2l_templates: user_session.can_upload_w2l_templates,
        can_delete_own_tts_models: user_session.can_delete_own_tts_models,
        can_delete_own_w2l_templates: user_session.can_delete_own_w2l_templates,
        can_approve_w2l_templates: user_session.can_approve_w2l_templates,
        can_edit_other_users_profiles: user_session.can_edit_other_users_profiles,
        can_edit_other_users_tts_models: user_session.can_edit_other_users_tts_models,
        can_edit_other_users_w2l_templates: user_session.can_edit_other_users_w2l_templates,
        can_delete_other_users_tts_models: user_session.can_delete_other_users_tts_models,
        can_delete_other_users_tts_results: user_session.can_delete_other_users_tts_results,
        can_delete_other_users_w2l_templates: user_session.can_delete_other_users_w2l_templates,
        can_delete_other_users_w2l_results: user_session.can_delete_other_users_w2l_results,
        can_ban_users: user_session.can_ban_users,
        can_delete_users: user_session.can_delete_users,
      },
      feature_flags: UserSessionFeatureFlags::from_optional_str(
        user_session.maybe_feature_flags.as_deref()),
    }))
  }

  fn maybe_get_redis_cache_connection(&self) -> Option<RedisTtlCacheConnection> {
    // NB: This is split into assignment and return because CLion IDE couldn't figure out the types.
    let result : Option<Option<RedisTtlCacheConnection>> = self.maybe_redis_ttl_cache
        .as_ref()
        .map(|redis_ttl_cache| redis_ttl_cache.get_connection()
            .map_err(|err| {
              warn!("redis cache failure: {:?}", err); // NB: We'll fail open if Redis cache fails
              err
            })
            .ok());
    result.flatten()
  }
}
