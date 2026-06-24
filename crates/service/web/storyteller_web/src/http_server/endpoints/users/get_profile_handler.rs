// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use std::collections::BTreeSet;

use actix_web::web::Path;
use actix_web::{web, HttpRequest, HttpResponse};
use chrono::{DateTime, Utc};
use log::{error, warn};
use r2d2::PooledConnection;
use redis::{Client, Commands};
use sqlx::MySqlPool;
use utoipa::ToSchema;

use enums::by_table::users::user_feature_flag::UserFeatureFlag;
use enums::common::visibility::Visibility;
use http_server_common::request::get_request_header_optional::get_request_header_optional;
use http_server_common::util::timer::MultiBenchmarkingTimer;
use mysql_queries::queries::users::user_badges::list_user_badges::list_user_badges;
use mysql_queries::queries::users::user_badges::list_user_badges::UserBadgeForList;
use mysql_queries::queries::users::user_profiles::get_user_profile_by_username::{get_user_profile_by_username_from_connection, UserProfileResult};
use tokens::tokens::users::UserToken;

use crate::http_server::common_responses::user_avatars::default_avatar_color_from_username::default_avatar_color_from_username;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::common_responses::user_avatars::default_avatar_from_username::default_avatar_from_username;
use crate::http_server::common_responses::user_details_lite::UserDetailsLight;
use crate::http_server::user_lookup::user_session::session_utils::lookup::user_session_feature_flags::UserSessionFeatureFlags;
use crate::http_server::user_lookup::user_session::session_utils::session_checker::SessionChecker;

// TODO: This is duplicated in query_user_profile

#[derive(Serialize, ToSchema)]
pub struct UserProfileRecordForResponse {
  pub user_token: UserToken,

  pub core_info: UserDetailsLight,
  
  pub username: String,
  pub display_name: String,
  pub email_gravatar_hash: String,
  pub default_avatar_index: u8,
  pub default_avatar_color_index: u8,
  pub profile_markdown: String,
  pub profile_rendered_html: String,
  pub user_role_slug: String,
  pub disable_gravatar: bool,
  pub preferred_tts_result_visibility: Visibility,
  pub preferred_w2l_result_visibility: Visibility,
  pub discord_username: Option<String>,
  pub twitch_username: Option<String>,
  pub twitter_username: Option<String>,
  pub patreon_username: Option<String>,
  pub github_username: Option<String>,
  pub cashapp_username: Option<String>,
  pub website_url: Option<String>,
  pub badges: Vec<UserProfileUserBadge>,
  pub created_at: DateTime<Utc>,
  pub maybe_moderator_fields: Option<UserProfileModeratorFields>,
}

#[derive(Serialize, ToSchema)]
pub struct UserProfileModeratorFields {
  pub is_banned: bool,
  pub maybe_mod_comments: Option<String>,
  pub maybe_mod_user_token: Option<String>,

  // Collection of feature / rollout flags
  // NB: The BTreeSet maintains order so React doesn't introduce re-render state bugs when order changes
  pub maybe_feature_flags: BTreeSet<UserFeatureFlag>,
}

#[derive(Serialize, Deserialize, Clone, ToSchema)]
pub struct UserProfileUserBadge {
  pub slug: String,
  pub title: String,
  pub description: String,
  pub image_url: String,
  pub granted_at: DateTime<Utc>,
}

#[derive(Serialize, ToSchema)]
pub struct ProfileSuccessResponse {
  pub success: bool,
  pub user: Option<UserProfileRecordForResponse>,
}
/// For the URL PathInfo
#[derive(Deserialize, ToSchema)]
pub struct GetProfilePathInfo {
  username: String,
}
// NB: Not using derive_more::Display since Clion doesn't understand it.
#[utoipa::path(
  get,
  tag = "Users",
  path = "/v1/user/{username}/profile",
  responses(
    (status = 200, description = "Get profile", body = UserProfileRecordForResponse),
    (status = 404, description = "Not found", body = CommonWebError),
    (status = 500, description = "Server error", body = CommonWebError),
  ),
  params(
    ("path" = GetProfilePathInfo, description = "Path for Request")
  )
)]
pub async fn get_profile_handler(
  http_request: HttpRequest,
  path: Path<GetProfilePathInfo>,
  mysql_pool: web::Data<MySqlPool>,
  redis_pool: web::Data<r2d2::Pool<Client>>,
  session_checker: web::Data<SessionChecker>,
) -> Result<HttpResponse, CommonWebError>
{
  let mut benchmark = MultiBenchmarkingTimer::new_started();

  let pool_connection = mysql_pool.acquire()
      .await
      .map_err(|e| {
        warn!("Could not acquire DB pool: {:?}", e);
        CommonWebError::from_error(e)
      })?;

  let (pool_connection, maybe_user_session_fut) =
      benchmark.time_async_section_moving_args("session checker", pool_connection, |mut pc| async {
        let ret = session_checker
            .maybe_get_user_session_from_connection(&http_request, &mut pc)
            .await
            .map_err(|e| {
              warn!("Session checker error: {:?}", e);
              CommonWebError::from_error(e)
            });
        (pc, ret)
        }
      ).await;

  let maybe_user_session = maybe_user_session_fut?;

  let mut is_mod = false;

  if let Some(user_session) = &maybe_user_session {
    is_mod = user_session.can_ban_users;
  }


  // TODO: Standard cache key
  let cache_key = format!("cache:userProfile:{}", path.username);
  let mut maybe_redis = redis_pool.get().ok();

  let mut maybe_user_data = None;
  let mut store_in_cache = false;

  if let Some(redis) = maybe_redis.as_mut() {
    maybe_user_data = try_get_user_from_redis_cache(&cache_key, redis);
  }

  if maybe_user_data.is_some() {
    warn!("User pulled from Redis cache key: {}", cache_key);
  }

  if maybe_user_data.is_none() {
    let (pool_connection, maybe_user_profile) =
        benchmark.time_async_section_moving_args("profile query", pool_connection, |mut pc| async {
          let ret = get_user_profile_by_username_from_connection(&path.username, &mut pc).await;
          (pc, ret)
        }).await;

    let user_profile = match maybe_user_profile {
      Ok(Some(user_profile)) => user_profile,
      Ok(None) => return Err(CommonWebError::NotFound),
      Err(err) => {
        error!("User profile query error: {:?}", err);
        return Err(CommonWebError::from_anyhow_error(err));
      }
    };

    let (_pool_connection, maybe_badges) =
        benchmark.time_async_section_moving_args("badges query", pool_connection, |mut pc| async {
          let ret = list_user_badges(&mut pc, &user_profile.user_token.0)
              .await;
          (pc, ret)
        }).await;

    let badges = maybe_badges
        .unwrap_or_else(|err| {
          warn!("Error querying badges: {:?}", err);
          Vec::new() // NB: Fine if this fails. Not sure why it would.
        });

    maybe_user_data = Some(RedisCacheData {
      user_profile: user_profile.clone(),
      badges: badges.clone(),
    });

    store_in_cache = true;
  }

  let user_data = match maybe_user_data {
    None => return Err(CommonWebError::NotFound),
    Some(user_data) => user_data,
  };

  let is_banned = user_data.user_profile.maybe_moderator_fields
      .as_ref()
      .map(|mod_fields| mod_fields.is_banned)
      .unwrap_or(false);

  if is_banned && !is_mod {
    // Can't see banned users.
    return Err(CommonWebError::NotFound);
  }

  if store_in_cache {
    if let Some(redis) = maybe_redis.as_mut() {
      if let Ok(redis_payload) = serde_json::to_string(&user_data) {
        const SECONDS : u64 = 60;
        // NB: Compiler can't figure out the throwaway result type
        let _r : Option<String> = redis.set_ex(&cache_key, redis_payload, SECONDS).ok();
      }
    }
  }

  let mut profile_for_response = UserProfileRecordForResponse {
    user_token: user_data.user_profile.user_token.clone(), // NB: Cloned because of ref use for avatar below
    core_info: UserDetailsLight::from_db_fields(
      &user_data.user_profile.user_token,
      &user_data.user_profile.username,
      &user_data.user_profile.display_name,
      &user_data.user_profile.email_gravatar_hash,
    ),
    username: user_data.user_profile.username.to_string(), // NB: Cloned because of ref use for avatar below
    display_name: user_data.user_profile.display_name,
    email_gravatar_hash: user_data.user_profile.email_gravatar_hash,
    default_avatar_index: default_avatar_from_username(&user_data.user_profile.username),
    default_avatar_color_index: default_avatar_color_from_username(&user_data.user_profile.username),
    profile_markdown: user_data.user_profile.profile_markdown,
    profile_rendered_html: user_data.user_profile.profile_rendered_html,
    user_role_slug: user_data.user_profile.user_role_slug,
    disable_gravatar: user_data.user_profile.disable_gravatar,
    preferred_tts_result_visibility: user_data.user_profile.preferred_tts_result_visibility,
    preferred_w2l_result_visibility: user_data.user_profile.preferred_w2l_result_visibility,
    discord_username: user_data.user_profile.discord_username,
    twitch_username: user_data.user_profile.twitch_username,
    twitter_username: user_data.user_profile.twitter_username,
    patreon_username: user_data.user_profile.patreon_username,
    github_username: user_data.user_profile.github_username,
    cashapp_username: user_data.user_profile.cashapp_username,
    website_url: user_data.user_profile.website_url,
    created_at: user_data.user_profile.created_at,
    maybe_moderator_fields: user_data.user_profile.maybe_moderator_fields.map(|mod_fields| {
      let feature_flags =
          UserSessionFeatureFlags::new(mod_fields.maybe_feature_flags.as_deref());

      UserProfileModeratorFields {
        is_banned: mod_fields.is_banned,
        maybe_mod_comments: mod_fields.maybe_mod_comments,
        maybe_mod_user_token: mod_fields.maybe_mod_user_token,
        maybe_feature_flags: feature_flags.clone_flags(),
      }
    }),
    badges: user_data.badges
        .into_iter()
        .map(|badge| UserProfileUserBadge {
          slug: badge.slug,
          title: badge.title,
          description: badge.description,
          image_url: badge.image_url,
          granted_at: badge.granted_at,
        }).collect(),
  };

  if !is_mod {
    profile_for_response.maybe_moderator_fields = None;
  }

  benchmark.mark_end();

  let response = ProfileSuccessResponse {
    success: true,
    user: Some(profile_for_response),
  };

  let body = serde_json::to_string(&response)
    .map_err(CommonWebError::from_error)?;

  let mut http_response = HttpResponse::Ok();

  http_response.content_type("application/json");

  let has_debug_header = get_request_header_optional(&http_request, "debug-timing")
      .is_some();

  if has_debug_header {
    for header in benchmark.section_timings_as_headers() {
      http_response.insert_header(header);
    }
  }

  let http_response = http_response.body(body);

  Ok(http_response)
}


#[derive(Serialize, Deserialize, Clone)]
pub (crate) struct RedisCacheData {
  pub user_profile: UserProfileResult,
  pub badges: Vec<UserBadgeForList>,
}

// TODO: Async
pub (crate) fn try_get_user_from_redis_cache(
  cache_key: &str,
  redis: &mut PooledConnection<Client>,
) -> Option<RedisCacheData> {

  let results : Option<String> = redis.get(cache_key).ok().flatten();

  let redis_data = match results {
    None => return None,
    Some(redis_data) => redis_data,
  };

  serde_json::from_str(&redis_data).ok()
}
