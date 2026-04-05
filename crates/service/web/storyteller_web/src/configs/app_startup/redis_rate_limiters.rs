use std::time::Duration;

use log::info;

use errors::AnyhowResult;
use limitation::Limiter;
use shared_env_var_config::redis::env_get_redis_0_connection_string_or_default;

use crate::configs::app_startup::username_set::UsernameSet;
use crate::http_server::web_utils::redis_rate_limiter::RedisRateLimiter;
use crate::state::server_state::RedisRateLimiters;

/// Build the various rate limiters
pub fn configure_redis_rate_limiters() -> AnyhowResult<RedisRateLimiters> {
  info!("Setting up Redis rate limiters...");

  let redis_connection_string = env_get_redis_0_connection_string_or_default();

  let logged_out_redis_rate_limiter = {
    let limiter_enabled = easyenv::get_env_bool_or_default("LIMITER_LOGGED_OUT_ENABLED", true);
    let limiter_max_requests = easyenv::get_env_num("LIMITER_LOGGED_OUT_MAX_REQUESTS", 3)?;
    let limiter_window_seconds = easyenv::get_env_num("LIMITER_LOGGED_OUT_WINDOW_SECONDS", 10)?;

    let limiter = Limiter::build(&redis_connection_string)
        .limit(limiter_max_requests)
        .period(Duration::from_secs(limiter_window_seconds))
        .finish()?;

    RedisRateLimiter::new(limiter, "logged_out", limiter_enabled)
  };

  let logged_in_redis_rate_limiter = {
    let limiter_enabled = easyenv::get_env_bool_or_default("LIMITER_LOGGED_IN_ENABLED", true);
    let limiter_max_requests = easyenv::get_env_num("LIMITER_LOGGED_IN_MAX_REQUESTS", 3)?;
    let limiter_window_seconds = easyenv::get_env_num("LIMITER_LOGGED_IN_WINDOW_SECONDS", 10)?;

    let limiter = Limiter::build(&redis_connection_string)
        .limit(limiter_max_requests)
        .period(Duration::from_secs(limiter_window_seconds))
        .finish()?;

    RedisRateLimiter::new(limiter, "logged_in", limiter_enabled)
  };

  let api_high_priority_redis_rate_limiter = {
    let limiter_enabled = easyenv::get_env_bool_or_default("LIMITER_API_HIGH_PRIORITY_ENABLED", true);
    let limiter_max_requests = easyenv::get_env_num("LIMITER_API_HIGH_PRIORITY_MAX_REQUESTS", 30)?;
    let limiter_window_seconds = easyenv::get_env_num("LIMITER_API_HIGH_PRIORITY_WINDOW_SECONDS", 30)?;

    let limiter = Limiter::build(&redis_connection_string)
        .limit(limiter_max_requests)
        .period(Duration::from_secs(limiter_window_seconds))
        .finish()?;

    RedisRateLimiter::new(limiter, "api_high_priority", limiter_enabled)
  };

  // This is for the following users:
  // https://www.notion.so/storytellerai/dd88609558a24196b4ddeeef6079da98
  let api_ai_streamers_redis_rate_limiter = {
    let limiter_enabled = easyenv::get_env_bool_or_default("LIMITER_API_AI_STREAMERS_ENABLED", true);
    let limiter_max_requests = easyenv::get_env_num("LIMITER_API_AI_STREAMERS_MAX_REQUESTS", 30)?;
    let limiter_window_seconds = easyenv::get_env_num("LIMITER_API_AI_STREAMERS_WINDOW_SECONDS", 30)?;

    let limiter = Limiter::build(&redis_connection_string)
        .limit(limiter_max_requests)
        .period(Duration::from_secs(limiter_window_seconds))
        .finish()?;

    RedisRateLimiter::new(limiter, "api_ai_streamers", limiter_enabled)
  };

  let ai_streamer_usernames =
      UsernameSet::from_comma_separated(&easyenv::get_env_string_or_default("AI_STREAMER_USERNAMES", ""));

  info!("AI Streamers that can bypass the normal rate limiter ({}): {:?}",
    ai_streamer_usernames.len(),
    ai_streamer_usernames.list_names());

  let model_upload_rate_limiter = {
    let limiter_enabled = easyenv::get_env_bool_or_default("LIMITER_MODEL_UPLOAD_ENABLED", true);
    let limiter_max_requests = easyenv::get_env_num("LIMITER_MODEL_UPLOAD_MAX_REQUESTS", 3)?;
    let limiter_window_seconds = easyenv::get_env_num("LIMITER_MODEL_UPLOAD_WINDOW_SECONDS", 10)?;

    let limiter = Limiter::build(&redis_connection_string)
        .limit(limiter_max_requests)
        .period(Duration::from_secs(limiter_window_seconds))
        .finish()?;

    RedisRateLimiter::new(limiter, "model_upload", limiter_enabled)
  };

  let file_upload_logged_out_redis_rate_limiter = {
    let limiter_enabled = easyenv::get_env_bool_or_default("LIMITER_FILE_UPLOAD_LOGGED_OUT_ENABLED", true);
    let limiter_max_requests = easyenv::get_env_num("LIMITER_FILE_UPLOAD_LOGGED_OUT_MAX_REQUESTS", 4)?;
    let limiter_window_seconds = easyenv::get_env_num("LIMITER_FILE_UPLOAD_LOGGED_OUT_WINDOW_SECONDS", 30)?;

    let limiter = Limiter::build(&redis_connection_string)
        .limit(limiter_max_requests)
        .period(Duration::from_secs(limiter_window_seconds))
        .finish()?;

    RedisRateLimiter::new(limiter, "file_upload_logged_out", limiter_enabled)
  };

  let file_upload_logged_in_redis_rate_limiter = {
    let limiter_enabled = easyenv::get_env_bool_or_default("LIMITER_FILE_UPLOAD_LOGGED_IN_ENABLED", true);
    let limiter_max_requests = easyenv::get_env_num("LIMITER_FILE_UPLOAD_LOGGED_IN_MAX_REQUESTS", 6)?;
    let limiter_window_seconds = easyenv::get_env_num("LIMITER_FILE_UPLOAD_LOGGED_IN_WINDOW_SECONDS", 30)?;

    let limiter = Limiter::build(&redis_connection_string)
        .limit(limiter_max_requests)
        .period(Duration::from_secs(limiter_window_seconds))
        .finish()?;

    RedisRateLimiter::new(limiter, "file_upload_logged_in", limiter_enabled)
  };

  Ok(RedisRateLimiters {
    logged_out: logged_out_redis_rate_limiter,
    logged_in: logged_in_redis_rate_limiter,
    api_high_priority: api_high_priority_redis_rate_limiter,
    api_ai_streamers: api_ai_streamers_redis_rate_limiter,
    api_ai_streamer_username_set: ai_streamer_usernames,
    model_upload: model_upload_rate_limiter,
    file_upload_logged_out: file_upload_logged_out_redis_rate_limiter,
    file_upload_logged_in: file_upload_logged_in_redis_rate_limiter,
  })
}
