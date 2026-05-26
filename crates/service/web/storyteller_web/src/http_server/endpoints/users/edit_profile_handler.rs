// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]


use actix_web::web::Path;
use actix_web::{web, HttpRequest, HttpResponse};
use log::warn;
use sqlx::MySqlPool;

use enums::common::visibility::Visibility;
use http_server_common::request::get_request_ip::get_request_ip;
use markdown::simple_markdown_to_html::simple_markdown_to_html;
use mysql_queries::queries::users::user_profiles::edit_user_profile_as_account_holder::edit_user_profile_as_account_holder;
use mysql_queries::queries::users::user_profiles::edit_user_profile_as_mod::edit_user_profile_as_mod;
use mysql_queries::queries::users::user_profiles::get_user_profile_by_username::get_user_profile_by_username;
use mysql_queries::queries::users::user_profiles::{edit_user_profile_as_account_holder, edit_user_profile_as_mod};
use redis_caching::redis_ttl_cache::RedisTtlCache;
use redis_common::redis_cache_keys::RedisCacheKeys;
use user_input_common::check_for_slurs::contains_slurs;

use crate::http_server::session::session_checker::SessionChecker;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::validations::validate_profile_cashapp_username::{normalize_cashapp_username_for_storage, validate_profile_cashapp_username};
use crate::http_server::validations::validate_profile_discord_username::validate_profile_discord_username;
use crate::http_server::validations::validate_profile_github_username::validate_profile_github_username;
use crate::http_server::validations::validate_profile_twitch_username::validate_profile_twitch_username;
use crate::http_server::validations::validate_profile_twitter_username::{normalize_twitter_username_for_storage, validate_profile_twitter_username};
use crate::http_server::validations::validate_profile_website_url::validate_profile_website_url;

/// For the URL PathInfo
#[derive(Deserialize)]
pub struct EditProfilePathInfo {
  username: String,
}

#[derive(Deserialize)]
pub struct EditProfileRequest {
  pub display_name: Option<String>,

  pub profile_markdown: Option<String>,

  pub discord_username: Option<String>,
  pub twitter_username: Option<String>,
  pub twitch_username: Option<String>,
  pub patreon_username: Option<String>,
  pub github_username: Option<String>,
  pub cashapp_username: Option<String>,
  pub website_url: Option<String>,

  pub preferred_tts_result_visibility: Option<Visibility>,
  pub preferred_w2l_result_visibility: Option<Visibility>,
}

#[derive(Serialize)]
pub struct EditProfileSuccessResponse {
  pub success: bool,
}
// NB: Not using derive_more::Display since Clion doesn't understand it.
pub async fn edit_profile_handler(
  http_request: HttpRequest,
  path: Path<EditProfilePathInfo>,
  request: web::Json<EditProfileRequest>,
  mysql_pool: web::Data<MySqlPool>,
  redis_ttl_cache: web::Data<RedisTtlCache>,
  session_checker: web::Data<SessionChecker>,
) -> Result<HttpResponse, CommonWebError>
{
  let maybe_user_session = session_checker
      .maybe_get_user_session(&http_request, &mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        CommonWebError::from_error(e)
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(CommonWebError::NotAuthorized);
    }
  };

  if user_session.is_banned {
    // Banned users can't edit anything
    return Err(CommonWebError::NotAuthorized);
  }

  let user_lookup_result =
      get_user_profile_by_username(&path.username, &mysql_pool)
      .await;

  let user_record = match user_lookup_result {
    Ok(Some(result)) => result,
    Ok(None) => return Err(CommonWebError::NotFound),
    Err(err) => {
      warn!("lookup error: {:?}", err);
      return Err(CommonWebError::from_anyhow_error(err));
    }
  };

  let mut editor_is_original_user = false;
  let mut editor_is_moderator = false;

  if path.username == user_session.username {
    editor_is_original_user = true;
  }

  if user_session.can_edit_other_users_profiles {
    editor_is_moderator = true;
  }

  if !editor_is_original_user && !editor_is_moderator {
    return Err(CommonWebError::NotAuthorized);
  }

  // Fields to set
  let mut twitter_username = None;
  let mut twitch_username = None;
  let mut discord_username = None;
  let mut cashapp_username = None;
  let mut github_username = None;
  let mut website_url = None;
  let mut profile_markdown = None;
  let mut profile_html = None;

  if let Some(twitter) = request.twitter_username.as_deref() {
    let trimmed = twitter.trim();
    if trimmed.is_empty() {
      twitter_username = None;
    } else {
      if let Err(reason) = validate_profile_twitter_username(trimmed) {
        return Err(CommonWebError::BadInputWithSimpleMessage(reason));
      }
      let normalized = normalize_twitter_username_for_storage(trimmed);
      twitter_username = Some(normalized);
    }
  }

  if let Some(twitch) = request.twitch_username.as_deref() {
    let trimmed = twitch.trim();
    if trimmed.is_empty() {
      twitch_username = None;
    } else {
      if let Err(reason) = validate_profile_twitch_username(trimmed) {
        return Err(CommonWebError::BadInputWithSimpleMessage(reason));
      }
      twitch_username = Some(trimmed);
    }
  }

  if let Some(discord) = request.discord_username.as_deref() {
    let trimmed = discord.trim();
    if trimmed.is_empty() {
      discord_username = None;
    } else {
      if let Err(reason) = validate_profile_discord_username(trimmed) {
        return Err(CommonWebError::BadInputWithSimpleMessage(reason));
      }
      discord_username = Some(trimmed);
    }
  }

  if let Some(github) = request.github_username.as_deref() {
    let trimmed = github.trim();
    if trimmed.is_empty() {
      github_username = None;
    } else {
      if let Err(reason) = validate_profile_github_username(trimmed) {
        return Err(CommonWebError::BadInputWithSimpleMessage(reason));
      }
      github_username = Some(trimmed);
    }
  }

  if let Some(cashapp) = request.cashapp_username.as_deref() {
    let trimmed = cashapp.trim();
    if trimmed.is_empty() {
      cashapp_username = None;
    } else {
      if let Err(reason) = validate_profile_cashapp_username(trimmed) {
        return Err(CommonWebError::BadInputWithSimpleMessage(reason));
      }
      let normalized = normalize_cashapp_username_for_storage(trimmed);
      cashapp_username = Some(normalized);
    }
  }

  if let Some(website) = request.website_url.as_deref() {
    let trimmed = website.trim();
    if trimmed.is_empty() {
      website_url = None;
    } else {
      if let Err(reason) = validate_profile_website_url(trimmed) {
        return Err(CommonWebError::BadInputWithSimpleMessage(reason));
      }
      website_url = Some(trimmed);
    }
  }

  if let Some(markdown) = request.profile_markdown.as_deref() {
    if contains_slurs(markdown) {
      return Err(CommonWebError::BadInputWithSimpleMessage("profile contains slurs".to_string()));
    }

    let markdown = markdown.trim().to_string();
    let html = simple_markdown_to_html(&markdown);

    profile_markdown = Some(markdown);
    profile_html = Some(html);
  }

  let ip_address = get_request_ip(&http_request);

  let preferred_tts_result_visibility = request.preferred_tts_result_visibility
      .unwrap_or(Visibility::Hidden);

  let preferred_w2l_result_visibility = request.preferred_w2l_result_visibility
      .unwrap_or(Visibility::Hidden);

  let query_result = if editor_is_original_user {
    edit_user_profile_as_account_holder(
      &mysql_pool,
      edit_user_profile_as_account_holder::Args {
        user_token: &user_record.user_token.0,
        profile_markdown: profile_markdown.as_deref(),
        profile_html: profile_html.as_deref(),
        discord_username: discord_username.as_deref(),
        twitter_username: twitter_username.as_deref(),
        cashapp_username: cashapp_username.as_deref(),
        github_username: github_username.as_deref(),
        twitch_username: twitch_username.as_deref(),
        website_url: website_url.as_deref(),
        preferred_tts_result_visibility: preferred_tts_result_visibility.to_str(),
        preferred_w2l_result_visibility: preferred_w2l_result_visibility.to_str(),
        ip_address: &ip_address,
      }
    ).await
  } else {
    // TODO(2022-09-01): We need to store the moderator details or have an audit log.
    // Also, mods shouldn't change user preferences.
    edit_user_profile_as_mod(
      &mysql_pool,
      edit_user_profile_as_mod::Args {
        user_token: &user_record.user_token.0,
        profile_markdown: profile_markdown.as_deref(),
        profile_html: profile_html.as_deref(),
        discord_username: discord_username.as_deref(),
        twitter_username: twitter_username.as_deref(),
        cashapp_username: cashapp_username.as_deref(),
        github_username: github_username.as_deref(),
        twitch_username: twitch_username.as_deref(),
        website_url: website_url.as_deref(),
      }
    ).await
  };

  match query_result {
    Ok(_) => {},
    Err(err) => {
      warn!("Profile edit DB error: {:?}", err);
      return Err(CommonWebError::from_anyhow_error(err));
    }
  };

  // TODO: Clear Redis cache of sessions
  //  Unfortunately we don't yet have an index of user_token => session_tokens[] outside the DB.
  //  For now, a hacky solution is just to delete the cache under the current user.
  //  This makes sense for non-mods and should solve 95% of cases.
  if let Some(session_token) = session_checker.forgiving_get_session_token(&http_request) {
    if let Ok(mut redis_ttl_cache) = redis_ttl_cache.get_connection() {
      let keys = vec![
        RedisCacheKeys::session_record_user(&session_token),
        RedisCacheKeys::session_record_light(&session_token),
      ];
      for key in keys.iter() {
        let _r = redis_ttl_cache.delete_from_cache(key).ok();
      }
    }
  }

  let response = EditProfileSuccessResponse {
    success: true,
  };

  let body = serde_json::to_string(&response)
      .map_err(|_e| CommonWebError::BadInputWithSimpleMessage("".to_string()))?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
