// Never allow these
#![forbid(private_in_public)]
#![forbid(unused_must_use)] // NB: It's unsafe to not close/check some things

// Okay to toggle
//#![forbid(warnings)]
#![allow(unused_imports)]
#![allow(unused_mut)]
#![allow(unused_variables)]

// Always allow
#![allow(dead_code)]
#![allow(non_snake_case)]

#[macro_use] extern crate lazy_static;
#[macro_use] extern crate magic_crypt;
#[macro_use] extern crate serde_derive;

pub const RESERVED_USERNAMES : &'static str = include_str!("../../../../db/reserved_usernames.txt");
pub const RESERVED_SUBSTRINGS : &'static str = include_str!("../../../../db/reserved_usernames_including.txt");

pub mod configs;
pub mod http_server;
pub mod routes;
pub mod server_state;
pub mod threads;
pub mod util;
pub mod validations;

// TODO: Eventually move all of these to the `database_queries` crate and no longer write inline MySQL.
// NB: Also so sqlx codegens everything.
// Not sure if this is strictly necessary.
mod shared_queries {
  use database_queries::queries::twitch::twitch_oauth::find;
  use database_queries::queries::twitch::twitch_oauth::insert;
}

use actix_cors::Cors;
use actix_http::http;
use actix_web::middleware::{Logger, DefaultHeaders};
use actix_web::{HttpServer, web, HttpResponse, App};
use config::common_env::CommonEnv;
use config::shared_constants::DEFAULT_MYSQL_CONNECTION_STRING;
use config::shared_constants::DEFAULT_RUST_LOG;
use container_common::anyhow_result::AnyhowResult;
use container_common::files::read_toml_file_to_struct::read_toml_file_to_struct;
use crate::configs::static_api_tokens::{StaticApiTokenConfig, StaticApiTokens, StaticApiTokenSet};
use crate::http_server::endpoints::events::list_events::list_events_handler;
use crate::http_server::endpoints::leaderboard::get_leaderboard::leaderboard_handler;
use crate::http_server::endpoints::misc::default_route_404::default_route_404;
use crate::http_server::endpoints::misc::enable_alpha_easy_handler::enable_alpha_easy_handler;
use crate::http_server::endpoints::misc::enable_alpha_handler::enable_alpha_handler;
use crate::http_server::endpoints::misc::root_index::get_root_index;
use crate::http_server::endpoints::moderation::approval::pending_w2l_templates::get_pending_w2l_templates_handler;
use crate::http_server::endpoints::moderation::ip_bans::add_ip_ban::add_ip_ban_handler;
use crate::http_server::endpoints::moderation::ip_bans::delete_ip_ban::delete_ip_ban_handler;
use crate::http_server::endpoints::moderation::ip_bans::get_ip_ban::get_ip_ban_handler;
use crate::http_server::endpoints::moderation::ip_bans::list_ip_bans::list_ip_bans_handler;
use crate::http_server::endpoints::moderation::jobs::get_tts_inference_queue_count::get_tts_inference_queue_count_handler;
use crate::http_server::endpoints::moderation::jobs::get_w2l_inference_queue_count::get_w2l_inference_queue_count_handler;
use crate::http_server::endpoints::moderation::stats::get_voice_count_stats::get_voice_count_stats_handler;
use crate::http_server::endpoints::moderation::user_bans::ban_user::ban_user_handler;
use crate::http_server::endpoints::moderation::user_bans::list_banned_users::list_banned_users_handler;
use crate::http_server::endpoints::moderation::user_roles::list_roles::list_user_roles_handler;
use crate::http_server::endpoints::moderation::user_roles::list_staff::list_staff_handler;
use crate::http_server::endpoints::moderation::user_roles::set_user_role::set_user_role_handler;
use crate::http_server::endpoints::moderation::users::list_users::list_users_handler;
use crate::http_server::endpoints::tts::delete_tts_model::delete_tts_model_handler;
use crate::http_server::endpoints::tts::delete_tts_result::delete_tts_inference_result_handler;
use crate::http_server::endpoints::tts::edit_tts_model::edit_tts_model_handler;
use crate::http_server::endpoints::tts::edit_tts_result::edit_tts_inference_result_handler;
use crate::http_server::endpoints::tts::enqueue_infer_tts::infer_tts_handler;
use crate::http_server::endpoints::tts::enqueue_upload_tts_model::upload_tts_model_handler;
use crate::http_server::endpoints::tts::get_tts_inference_job_status::get_tts_inference_job_status_handler;
use crate::http_server::endpoints::tts::get_tts_model::get_tts_model_handler;
use crate::http_server::endpoints::tts::get_tts_model_use_count::get_tts_model_use_count_handler;
use crate::http_server::endpoints::tts::get_tts_result::get_tts_inference_result_handler;
use crate::http_server::endpoints::tts::get_tts_upload_model_job_status::get_tts_upload_model_job_status_handler;
use crate::http_server::endpoints::tts::list_tts_models::list_tts_models_handler;
use crate::http_server::endpoints::users::create_account::create_account_handler;
use crate::http_server::endpoints::users::edit_profile::edit_profile_handler;
use crate::http_server::endpoints::users::get_profile::get_profile_handler;
use crate::http_server::endpoints::users::list_user_tts_inference_results::list_user_tts_inference_results_handler;
use crate::http_server::endpoints::users::list_user_tts_models::list_user_tts_models_handler;
use crate::http_server::endpoints::users::list_user_w2l_inference_results::list_user_w2l_inference_results_handler;
use crate::http_server::endpoints::users::list_user_w2l_templates::list_user_w2l_templates_handler;
use crate::http_server::endpoints::users::login::login_handler;
use crate::http_server::endpoints::users::logout::logout_handler;
use crate::http_server::endpoints::users::session_info::session_info_handler;
use crate::http_server::endpoints::w2l::delete_w2l_result::delete_w2l_inference_result_handler;
use crate::http_server::endpoints::w2l::delete_w2l_template::delete_w2l_template_handler;
use crate::http_server::endpoints::w2l::edit_w2l_result::edit_w2l_inference_result_handler;
use crate::http_server::endpoints::w2l::edit_w2l_template::edit_w2l_template_handler;
use crate::http_server::endpoints::w2l::enqueue_infer_w2l::infer_w2l_handler;
use crate::http_server::endpoints::w2l::enqueue_infer_w2l_with_uploads::enqueue_infer_w2l_with_uploads;
use crate::http_server::endpoints::w2l::enqueue_upload_w2l_template::upload_w2l_template_handler;
use crate::http_server::endpoints::w2l::get_w2l_inference_job_status::get_w2l_inference_job_status_handler;
use crate::http_server::endpoints::w2l::get_w2l_result::get_w2l_inference_result_handler;
use crate::http_server::endpoints::w2l::get_w2l_template::get_w2l_template_handler;
use crate::http_server::endpoints::w2l::get_w2l_template_use_count::get_w2l_template_use_count_handler;
use crate::http_server::endpoints::w2l::get_w2l_upload_template_job_status::get_w2l_upload_template_job_status_handler;
use crate::http_server::endpoints::w2l::list_w2l_templates::list_w2l_templates_handler;
use crate::http_server::endpoints::w2l::set_w2l_template_mod_approval::set_w2l_template_mod_approval_handler;
use crate::http_server::middleware::ip_filter_middleware::IpFilter;
use crate::http_server::web_utils::cookie_manager::CookieManager;
use crate::http_server::web_utils::redis_rate_limiter::RedisRateLimiter;
use crate::http_server::web_utils::session_checker::SessionChecker;
use crate::routes::add_routes;
use crate::server_state::{ServerState, EnvConfig, TwitchOauthSecrets, TwitchOauth, RedisRateLimiters, InMemoryCaches};
use crate::threads::db_health_checker_thread::db_health_check_status::HealthCheckStatus;
use crate::threads::db_health_checker_thread::db_health_checker_thread::db_health_checker_thread;
use crate::threads::ip_banlist_set::IpBanlistSet;
use crate::threads::poll_ip_banlist_thread::poll_ip_bans;
use crate::util::encrypted_sort_id::SortKeyCrypto;
use database_queries::mediators::badge_granter::BadgeGranter;
use database_queries::mediators::firehose_publisher::FirehosePublisher;
use futures::Future;
use http_server_common::cors::build_common_cors_config;
use limitation::Limiter;
use log::{error, info};
use memory_caching::single_item_ttl_cache::SingleItemTtlCache;
use r2d2_redis::RedisConnectionManager;
use r2d2_redis::r2d2;
use r2d2_redis::redis::Commands;
use sqlx::MySqlPool;
use sqlx::mysql::MySqlPoolOptions;
use std::sync::Arc;
use std::time::Duration;
use storage_buckets_common::bucket_client::BucketClient;
use tokio::runtime::Runtime;
use twitch_common::twitch_secrets::TwitchSecrets;

// TODO TODO TODO TODO
// TODO TODO TODO TODO
// TODO TODO TODO TODO
// https://github.com/TensorSpeech/TensorFlowTTS (MAYBE USE THIS)
// TODO TODO TODO TODO
// TODO TODO TODO TODO
// TODO TODO TODO TODO

// TODO TODO TODO -- ON signup, add an "early adopter" badge. And a tool for making it easy to add badges.
// TODO - badge for uploading template, badge for uploading model, etc.

// TODO TODO -- also this: https://material-ui.com

const DEFAULT_BIND_ADDRESS : &'static str = "0.0.0.0:12345";

// Buckets (shared config)
const ENV_ACCESS_KEY : &'static str = "ACCESS_KEY";
const ENV_SECRET_KEY : &'static str = "SECRET_KEY";
const ENV_REGION_NAME : &'static str = "REGION_NAME";

// Buckets (private data)
const ENV_PRIVATE_BUCKET_NAME : &'static str = "W2L_PRIVATE_DOWNLOAD_BUCKET_NAME";
// Buckets (public data)
const ENV_PUBLIC_BUCKET_NAME : &'static str = "W2L_PUBLIC_DOWNLOAD_BUCKET_NAME";

// Various bucket roots
const ENV_AUDIO_UPLOADS_BUCKET_ROOT : &'static str = "AUDIO_UPLOADS_BUCKET_ROOT";

#[actix_web::main]
async fn main() -> AnyhowResult<()> {
  easyenv::init_all_with_default_logging(Some(DEFAULT_RUST_LOG));

  // NB: Do not check this secrets-containing dotenv file into VCS.
  // This file should only contain *development* secrets, never production.
  let _ = dotenv::from_filename(".env-secrets").ok();

  let common_env = CommonEnv::read_from_env()?;

  info!("Obtaining hostname...");

  let server_hostname = hostname::get()
    .ok()
    .and_then(|h| h.into_string().ok())
    .unwrap_or("storyteller-web-unknown".to_string());

  info!("Hostname: {}", &server_hostname);

  info!("Connecting to database...");

  let db_connection_string =
    easyenv::get_env_string_or_default(
      "MYSQL_URL",
      DEFAULT_MYSQL_CONNECTION_STRING);

  let pool = MySqlPoolOptions::new()
    .max_connections(5)
    .connect(&db_connection_string)
    .await?;

  let firehose_publisher = FirehosePublisher {
    mysql_pool: pool.clone(), // NB: Pool is clone/sync/send-safe
  };

  let badge_granter = BadgeGranter {
    mysql_pool: pool.clone(), // NB: Pool is clone/sync/send-safe
    firehose_publisher: firehose_publisher.clone(), // NB: Also safe
  };

  let redis_manager = RedisConnectionManager::new(
    common_env.redis_0_connection_string.clone())?;

  let redis_pool = r2d2::Pool::builder()
      .build(redis_manager)?;

  info!("Setting up Redis rate limiters...");

  // Old env vars:
  //
  // "LIMITER_ENABLED"
  // "LIMITER_MAX_REQUESTS"
  // "LIMITER_WINDOW_SECONDS"
  //
  let logged_out_redis_rate_limiter = {
    let limiter_enabled = easyenv::get_env_bool_or_default("LIMITER_LOGGED_OUT_ENABLED", true);
    let limiter_max_requests = easyenv::get_env_num("LIMITER_LOGGED_OUT_MAX_REQUESTS", 3)?;
    let limiter_window_seconds = easyenv::get_env_num("LIMITER_LOGGED_OUT_WINDOW_SECONDS", 10)?;

    let limiter = Limiter::build(&common_env.redis_0_connection_string)
        .limit(limiter_max_requests)
        .period(Duration::from_secs(limiter_window_seconds))
        .finish()?;

    RedisRateLimiter::new(limiter, "logged_out", limiter_enabled)
  };

  let logged_in_redis_rate_limiter = {
    let limiter_enabled = easyenv::get_env_bool_or_default("LIMITER_LOGGED_IN_ENABLED", true);
    let limiter_max_requests = easyenv::get_env_num("LIMITER_LOGGED_IN_MAX_REQUESTS", 3)?;
    let limiter_window_seconds = easyenv::get_env_num("LIMITER_LOGGED_IN_WINDOW_SECONDS", 10)?;

    let limiter = Limiter::build(&common_env.redis_0_connection_string)
        .limit(limiter_max_requests)
        .period(Duration::from_secs(limiter_window_seconds))
        .finish()?;

    RedisRateLimiter::new(limiter, "logged_in", limiter_enabled)
  };

  let api_high_priority_redis_rate_limiter = {
    let limiter_enabled = easyenv::get_env_bool_or_default("LIMITER_API_HIGH_PRIORITY_ENABLED", true);
    let limiter_max_requests = easyenv::get_env_num("LIMITER_API_HIGH_PRIORITY_MAX_REQUESTS", 30)?;
    let limiter_window_seconds = easyenv::get_env_num("LIMITER_API_HIGH_PRIORITY_WINDOW_SECONDS", 30)?;

    let limiter = Limiter::build(&common_env.redis_0_connection_string)
        .limit(limiter_max_requests)
        .period(Duration::from_secs(limiter_window_seconds))
        .finish()?;

    RedisRateLimiter::new(limiter, "api_high_priority", limiter_enabled)
  };

  let model_upload_rate_limiter = {
    let limiter_enabled = easyenv::get_env_bool_or_default("LIMITER_MODEL_UPLOAD_ENABLED", true);
    let limiter_max_requests = easyenv::get_env_num("LIMITER_MODEL_UPLOAD_MAX_REQUESTS", 3)?;
    let limiter_window_seconds = easyenv::get_env_num("LIMITER_MODEL_UPLOAD_WINDOW_SECONDS", 10)?;

    let limiter = Limiter::build(&common_env.redis_0_connection_string)
        .limit(limiter_max_requests)
        .period(Duration::from_secs(limiter_window_seconds))
        .finish()?;

    RedisRateLimiter::new(limiter, "model_upload", limiter_enabled)
  };

  info!("Reading env vars and setting up utils...");

  let bind_address = easyenv::get_env_string_or_default("BIND_ADDRESS", DEFAULT_BIND_ADDRESS);
  let num_workers = easyenv::get_env_num("NUM_WORKERS", 8)?;
  let hmac_secret = easyenv::get_env_string_or_default("COOKIE_SECRET", "notsecret");
  let cookie_domain = easyenv::get_env_string_or_default("COOKIE_DOMAIN", ".vo.codes");
  let cookie_secure = easyenv::get_env_bool_or_default("COOKIE_SECURE", true);
  let cookie_http_only = easyenv::get_env_bool_or_default("COOKIE_HTTP_ONLY", true);
  let website_homepage_redirect =
      easyenv::get_env_string_or_default("WEBSITE_HOMEPAGE_REDIRECT", "https://vo.codes/");

  let cookie_manager = CookieManager::new(&cookie_domain, &hmac_secret);
  let session_checker = SessionChecker::new(&cookie_manager);

  let access_key = easyenv::get_env_string_required(ENV_ACCESS_KEY)?;
  let secret_key = easyenv::get_env_string_required(ENV_SECRET_KEY)?;
  let region_name = easyenv::get_env_string_required(ENV_REGION_NAME)?;

  // Private and Public Buckets
  let private_bucket_name = easyenv::get_env_string_required(ENV_PRIVATE_BUCKET_NAME)?;
  let public_bucket_name = easyenv::get_env_string_required(ENV_PUBLIC_BUCKET_NAME)?;

  // Bucket roots
  let audio_uploads_bucket_root= easyenv::get_env_string_required(ENV_AUDIO_UPLOADS_BUCKET_ROOT)?;

  let private_bucket_client = BucketClient::create(
    &access_key,
    &secret_key,
    &region_name,
    &private_bucket_name,
    None,
  )?;

  let public_bucket_client = BucketClient::create(
    &access_key,
    &secret_key,
    &region_name,
    &public_bucket_name,
    None,
  )?;

  // In-Memory Cache
  let voice_list_cache_ttl = easyenv::get_env_duration_seconds_or_default("VOICE_LIST_CACHE_TTL_SECONDS", Duration::from_secs(60));
  let category_list_cache_ttl = easyenv::get_env_duration_seconds_or_default("CATEGORY_LIST_CACHE_TTL_SECONDS", Duration::from_secs(60));
  let voice_list_cache = SingleItemTtlCache::create_with_duration(voice_list_cache_ttl);
  let category_list_cache = SingleItemTtlCache::create_with_duration(category_list_cache_ttl);

  let w2l_template_cache = SingleItemTtlCache::create_with_duration(
    easyenv::get_env_duration_seconds_or_default("W2L_TEMPLATE_LIST_CACHE_TTL_SECONDS", Duration::from_secs(300)) // 5 minutes
  );

  let tts_queue_length_cache = SingleItemTtlCache::create_with_duration(
    easyenv::get_env_duration_seconds_or_default("TTS_QUEUE_LENGTH_CACHE_TTL_SECONDS", Duration::from_secs(30))
  );

  // NB: This secret really isn't too important.
  // We can even rotate it without too much impact to users.
  let sort_key_crypto_secret =
      easyenv::get_env_string_or_default("SORT_KEY_SECRET", "webscale");
  let sort_key_crypto = SortKeyCrypto::new(&sort_key_crypto_secret);

  let twitch_oauth_redirect_landing_url = easyenv::get_env_string_or_default(
    "TWITCH_OAUTH_REDIRECT_LANDING_URL",
    "https://api.jungle.horse/twitch/oauth/enroll_redirect_landing");

  let twitch_oauth_redirect_landing_finished_url = easyenv::get_env_string_or_default(
    "TWITCH_OAUTH_REDIRECT_LANDING_FINISHED_URL",
    "https://jungle.horse/");

  let twitch_secrets = TwitchSecrets::from_env()?;

  let static_api_token_set = read_static_api_tokens();

  // Background jobs.

  let health_check_status = HealthCheckStatus::new();
  let health_check_status2 = health_check_status.clone();
  let ip_banlist = IpBanlistSet::new();
  let ip_banlist2 = ip_banlist.clone();
  let mysql_pool3 = pool.clone();
  let mysql_pool4 = pool.clone();

  let tokio_runtime = Runtime::new()?;

  info!("Spawning DB health checker thread.");

  tokio_runtime.spawn(async {
    db_health_checker_thread(health_check_status2, mysql_pool3).await;
  });

  info!("Spawning IP ban polling thread.");

  tokio_runtime.spawn(async {
    poll_ip_bans(ip_banlist2, mysql_pool4).await;
  });

  let server_state = ServerState {
    env_config: EnvConfig {
      num_workers,
      bind_address,
      cookie_domain,
      cookie_secure,
      cookie_http_only,
      website_homepage_redirect,
    },
    hostname: server_hostname,
    health_check_status,
    mysql_pool: pool,
    redis_pool,
    redis_rate_limiters: RedisRateLimiters {
      logged_out: logged_out_redis_rate_limiter,
      logged_in: logged_in_redis_rate_limiter,
      api_high_priority: api_high_priority_redis_rate_limiter,
      model_upload: model_upload_rate_limiter,
    },
    firehose_publisher,
    badge_granter,
    cookie_manager,
    session_checker,
    private_bucket_client,
    public_bucket_client,
    audio_uploads_bucket_root,
    sort_key_crypto,
    ip_banlist,
    static_api_token_set,
    caches: InMemoryCaches {
      voice_list: voice_list_cache,
      w2l_template_list: w2l_template_cache,
      category_list: category_list_cache,
      tts_queue_length: tts_queue_length_cache,
    },
    twitch_oauth: TwitchOauth {
      secrets: TwitchOauthSecrets {
        client_id: twitch_secrets.app_client_id,
        client_secret: twitch_secrets.app_client_secret,
      },
      redirect_landing_url: twitch_oauth_redirect_landing_url,
      redirect_landing_finished_url: twitch_oauth_redirect_landing_finished_url,
    }
  };

  serve(server_state)
    .await?;
  Ok(())
}

fn read_static_api_tokens() -> StaticApiTokenSet {
  let filename = easyenv::get_env_string_or_default(
    "STATIC_API_TOKENS_CONFIG_FILE",
    "./configs/static_api_tokens.toml");

  StaticApiTokenSet::from_file(&filename)
}

pub async fn serve(server_state: ServerState) -> AnyhowResult<()>
{
  let bind_address = server_state.env_config.bind_address.clone();
  let num_workers = server_state.env_config.num_workers.clone();
  let hostname = server_state.hostname.clone();

  let server_state_arc = web::Data::new(Arc::new(server_state));

  info!("Starting HTTP service.");

  let log_format = "[%{HOSTNAME}e] %a \"%r\" %s %b \"%{Referer}i\" \"%{User-Agent}i\" %T";

  HttpServer::new(move || {
    // NB: Safe to clone due to internal arc
    let ip_banlist = server_state_arc.ip_banlist.clone();
    let build_sha = std::fs::read_to_string("/GIT_SHA").unwrap_or(String::from("unknown"));

    let app = App::new()
      .app_data(server_state_arc.clone())
      .wrap(build_common_cors_config())
      .wrap(DefaultHeaders::new()
        .header("X-Backend-Hostname", &hostname)
        .header("X-Build-Sha", build_sha.trim()))
      .wrap(IpFilter::new(ip_banlist))
      .wrap(Logger::new(&log_format)
        .exclude("/liveness")
        .exclude("/readiness"));

    add_routes(app)
  })
  .bind(bind_address)?
  .workers(num_workers)
  .run()
  .await?;

  Ok(())
}
