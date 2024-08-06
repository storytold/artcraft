// Never allow these
#![forbid(private_bounds)]
#![forbid(private_interfaces)]
#![forbid(unused_must_use)] // NB: It's unsafe to not close/check some things

// Okay to toggle
//#![forbid(warnings)]
#![allow(unreachable_patterns)]
#![allow(unused_imports)]
#![allow(unused_mut)]
#![allow(unused_variables)]

// Always allow
#![allow(dead_code)]
#![allow(non_snake_case)]

#[macro_use] extern crate magic_crypt;
#[macro_use] extern crate serde_derive;

use std::sync::Arc;
use std::sync::atomic::AtomicUsize;
use std::time::Duration;

use actix::Actor;
use actix_multipart::form::MultipartFormConfig;
use actix_web::{App, HttpServer, middleware, web};
use actix_web::middleware::{DefaultHeaders, Logger};
use anyhow::anyhow;
use elasticsearch::Elasticsearch;
use elasticsearch::http::transport::Transport;
use futures::Future;
use log::info;
use r2d2_redis::r2d2;
use r2d2_redis::redis::Commands;
use r2d2_redis::RedisConnectionManager;
use sqlx::mysql::MySqlPoolOptions;
use sqlx::MySqlPool;
use tokio::runtime::Runtime;

use actix_cors_configs::cors::build_cors_config;
use actix_cors_configs::shared_array_buffer_cors::shared_array_buffer_cors;
use actix_helpers::middleware::banned_cidr_filter::banned_cidr_filter::BannedCidrFilter;
use actix_helpers::middleware::banned_cidr_filter::banned_cidr_set::BannedCidrSet;
use actix_helpers::middleware::banned_cidr_filter::load_cidr_ban_set_from_file::load_cidr_ban_set_from_file;
use actix_helpers::middleware::banned_ip_filter::banned_ip_filter::BannedIpFilter;
use actix_helpers::middleware::banned_ip_filter::ip_ban_list::ip_ban_list::IpBanList;
use actix_helpers::middleware::banned_ip_filter::ip_ban_list::load_ip_ban_list_from_directory::load_ip_ban_list_from_directory;
use actix_helpers::middleware::disabled_endpoint_filter::disabled_endpoint_filter::DisabledEndpointFilter;
use actix_helpers::middleware::disabled_endpoint_filter::disabled_endpoints::disabled_endpoints::DisabledEndpoints;
use actix_helpers::middleware::disabled_endpoint_filter::disabled_endpoints::exact_match_disabled_endpoints::ExactMatchDisabledEndpoints;
use actix_helpers::middleware::disabled_endpoint_filter::disabled_endpoints::prefix_disabled_endpoints::PrefixDisabledEndpoints;
use billing_component::stripe::stripe_config::{FullUrlOrPath, StripeCheckoutConfigs, StripeConfig, StripeCustomerPortalConfigs, StripeSecrets};
use billing_component::stripe::traits::internal_product_to_stripe_lookup::InternalProductToStripeLookup;
use billing_component::stripe::traits::internal_subscription_product_lookup::InternalSubscriptionProductLookup;
use billing_component::stripe::traits::internal_user_lookup::InternalUserLookup;
use bootstrap::bootstrap::{bootstrap, BootstrapArgs};
use cloud_storage::bucket_client::BucketClient;
use config::common_env::CommonEnv;
use config::shared_constants::DEFAULT_MYSQL_CONNECTION_STRING;
use config::shared_constants::DEFAULT_RUST_LOG;
use email_sender::smtp_email_sender::SmtpEmailSender;
use errors::AnyhowResult;
use memory_caching::arc_sieve::ArcSieve;
use memory_caching::single_item_ttl_cache::SingleItemTtlCache;
use mysql_queries::mediators::badge_granter::BadgeGranter;
use mysql_queries::mediators::firehose_publisher::FirehosePublisher;
use redis_caching::redis_ttl_cache::RedisTtlCache;
use reusable_types::server_environment::ServerEnvironment;
use url_config::third_party_url_redirector::ThirdPartyUrlRedirector;
use user_traits_component::traits::internal_session_cache_purge::InternalSessionCachePurge;

use crate::billing::internal_product_to_stripe_lookup_impl::InternalProductToStripeLookupImpl;
use crate::billing::internal_session_cache_purge_impl::InternalSessionCachePurgeImpl;
use crate::billing::stripe_internal_subscription_product_lookup_impl::StripeInternalSubscriptionProductLookupImpl;
use crate::billing::stripe_internal_user_lookup_impl::StripeInternalUserLookupImpl;
use crate::configs::app_startup::redis_rate_limiters::configure_redis_rate_limiters;
use crate::configs::static_api_tokens::StaticApiTokenSet;
use crate::http_server::cookies::anonymous_visitor_tracking::avt_cookie_manager::AvtCookieManager;
use crate::http_server::endpoints::workflows::enqueue::progress_tracker_server;
use crate::http_server::middleware::pushback_filter_middleware::PushbackFilter;
use crate::http_server::routes::add_routes::add_routes;
use crate::http_server::session::http::http_user_session_manager::HttpUserSessionManager;
use crate::http_server::session::session_checker::SessionChecker;
use crate::http_server::web_utils::handle_multipart_error::handle_multipart_error;
use crate::state::memory_cache::model_token_to_info_cache::ModelTokenToInfoCache;
use crate::state::server_state::{DurableInMemoryCaches, EnvConfig, EphemeralInMemoryCaches, InMemoryCaches, ServerInfo, ServerState, StaticFeatureFlags, StripeSettings, TrollBans};
use crate::threads::db_health_checker_thread::db_health_check_status::HealthCheckStatus;
use crate::threads::db_health_checker_thread::db_health_checker_thread::db_health_checker_thread;
use crate::threads::poll_ip_banlist_thread::poll_ip_bans;
use crate::threads::poll_model_token_info_thread::poll_model_token_info_thread;
use crate::util::encrypted_sort_id::SortKeyCrypto;
use crate::util::troll_user_bans::load_troll_user_ban_list_from_directory::load_user_token_ban_list_from_directory;
use crate::util::troll_user_bans::troll_user_ban_list::TrollUserBanList;

pub mod billing;
pub mod configs;
pub mod http_server;
pub mod state;
pub mod threads;
pub mod util;

const DEFAULT_BIND_ADDRESS : &str = "0.0.0.0:12345";

// Buckets (shared config)
const ENV_ACCESS_KEY : &str = "ACCESS_KEY";
const ENV_SECRET_KEY : &str = "SECRET_KEY";
const ENV_REGION_NAME : &str = "REGION_NAME";

// Buckets (private data)
const ENV_PRIVATE_BUCKET_NAME : &str = "W2L_PRIVATE_DOWNLOAD_BUCKET_NAME";
// Buckets (public data)
const ENV_PUBLIC_BUCKET_NAME : &str = "W2L_PUBLIC_DOWNLOAD_BUCKET_NAME";

const ENV_GC_ENABLED_PUBLIC_BUCKET_NAME : &str = "GC_ENABLED_PUBLIC_BUCKET_NAME";

// Various bucket roots
const ENV_AUDIO_UPLOADS_BUCKET_ROOT : &str = "AUDIO_UPLOADS_BUCKET_ROOT";

// "[%{HOSTNAME}e] %a \"%r\" %s %b \"%{Referer}i\" \"%{User-Agent}i\" %T";
const LOG_FORMAT : &str =
  "[%{HOSTNAME}e] IP=[%{X-Forwarded-For}i] \"%r\" %s %b \"%{Referer}i\" \"%{User-Agent}i\" %T";

#[actix_web::main]
async fn main() -> AnyhowResult<()> {

  let container_environment = bootstrap(BootstrapArgs {
    app_name: "storyteller-web",
    default_logging_override: Some(DEFAULT_RUST_LOG),
    config_search_directories: &[".", "./config", "crates/service/web/storyteller_web/config"],
  })?;

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
    .max_connections(easyenv::get_env_num("MYSQL_MAX_CONNECTIONS", 5)?)
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

  let redis_ttl_cache = RedisTtlCache::new_with_ttl(
    redis_pool.clone(),
    easyenv::get_env_num("REDIS_CACHE_TTL_SECONDS", 60)?,
  );


  info!("Connecting to elasticsearch...");

  let elasticsearch = get_elasticsearch_client()?;

  info!("Reading env vars and setting up utils...");

  let bind_address = easyenv::get_env_string_or_default("BIND_ADDRESS", DEFAULT_BIND_ADDRESS);
  let num_workers = easyenv::get_env_num("NUM_WORKERS", 8)?;
  let hmac_secret = easyenv::get_env_string_or_default("COOKIE_SECRET", "notsecret");
  let cookie_domain = easyenv::get_env_string_or_default("COOKIE_DOMAIN", ".vo.codes");
  let cookie_secure = easyenv::get_env_bool_or_default("COOKIE_SECURE", true);
  let cookie_http_only = easyenv::get_env_bool_or_default("COOKIE_HTTP_ONLY", true);
  let website_homepage_redirect =
      easyenv::get_env_string_or_default("WEBSITE_HOMEPAGE_REDIRECT", "https://vo.codes/");

  let session_cookie_manager = HttpUserSessionManager::new(&cookie_domain, &hmac_secret)?;
  let avt_cookie_manager = AvtCookieManager::new(&cookie_domain, &hmac_secret)?;

  let session_checker = SessionChecker::new_with_cache(
    &session_cookie_manager,
    redis_ttl_cache.clone(),
  );

  let access_key = easyenv::get_env_string_required(ENV_ACCESS_KEY)?;
  let secret_key = easyenv::get_env_string_required(ENV_SECRET_KEY)?;
  let region_name = easyenv::get_env_string_required(ENV_REGION_NAME)?;

  // Private and Public Buckets
  let private_bucket_name = easyenv::get_env_string_required(ENV_PRIVATE_BUCKET_NAME)?;
  let public_bucket_name = easyenv::get_env_string_required(ENV_PUBLIC_BUCKET_NAME)?;
  let gc_enabled_public_bucket_name = easyenv::get_env_string_required(ENV_GC_ENABLED_PUBLIC_BUCKET_NAME)?;

  // Bucket roots
  let audio_uploads_bucket_root= easyenv::get_env_string_required(ENV_AUDIO_UPLOADS_BUCKET_ROOT)?;

  let s3_compatible_endpoint_url = easyenv::get_env_string_or_default("S3_COMPATIBLE_ENDPOINT_URL", "https://storage.googleapis.com");
  let bucket_timeout = easyenv::get_env_duration_seconds_or_default("BUCKET_TIMEOUT_SECONDS",
    Duration::from_secs(60 * 5));

  let private_bucket_client = BucketClient::create(
    &access_key,
    &secret_key,
    &region_name,
    &private_bucket_name,
    &s3_compatible_endpoint_url,
    None,
    Some(bucket_timeout),
  )?;

  let public_bucket_client = BucketClient::create(
    &access_key,
    &secret_key,
    &region_name,
    &public_bucket_name,
    &s3_compatible_endpoint_url,
    None,
    Some(bucket_timeout),
  )?;

  let auto_gc_bucket_client = BucketClient::create(
    &access_key,
    &secret_key,
    &region_name,
    &gc_enabled_public_bucket_name,
    &s3_compatible_endpoint_url,
    None,
    Some(bucket_timeout),
  )?;

  // In-Memory Cache
  let voice_list_cache_ttl = easyenv::get_env_duration_seconds_or_default("VOICE_LIST_CACHE_TTL_SECONDS", Duration::from_secs(60));
  let category_list_cache_ttl = easyenv::get_env_duration_seconds_or_default("CATEGORY_LIST_CACHE_TTL_SECONDS", Duration::from_secs(60));
  let voice_list_cache = SingleItemTtlCache::create_with_duration(voice_list_cache_ttl);

  let database_tts_category_list_cache = SingleItemTtlCache::create_with_duration(
    easyenv::get_env_duration_seconds_or_default("DATABASE_TTS_CATEGORY_LIST_CACHE_TTL_SECONDS", Duration::from_secs(60))
  );

  let w2l_template_cache = SingleItemTtlCache::create_with_duration(
    easyenv::get_env_duration_seconds_or_default("W2L_TEMPLATE_LIST_CACHE_TTL_SECONDS", Duration::from_secs(300)) // 5 minutes
  );

  let tts_queue_length_cache = SingleItemTtlCache::create_with_duration(
    easyenv::get_env_duration_seconds_or_default("TTS_QUEUE_LENGTH_CACHE_TTL_SECONDS", Duration::from_secs(30))
  );

  let tts_model_category_assignments_cache = SingleItemTtlCache::create_with_duration(
    easyenv::get_env_duration_seconds_or_default("TTS_MODEL_CATEGORY_ASSIGNMENTS_CACHE_TTL_SECONDS", Duration::from_secs(60))
  );

  let leaderboard_cache = SingleItemTtlCache::create_with_duration(
    easyenv::get_env_duration_seconds_or_default("LEADERBOARD_CACHE_TTL_SECONDS", Duration::from_secs(60))
  );

  let inference_queue_length_cache = SingleItemTtlCache::create_with_duration(
    easyenv::get_env_duration_seconds_or_default("INFERENCE_QUEUE_LENGTH_CACHE_TTL_SECONDS", Duration::from_secs(30))
  );

  // NB: This secret really isn't too important.
  // We can even rotate it without too much impact to users.
  let sort_key_crypto_secret =
      easyenv::get_env_string_or_default("SORT_KEY_SECRET", "webscale");
  let sort_key_crypto = SortKeyCrypto::new(&sort_key_crypto_secret);

  let health_check_interval = easyenv::get_env_duration_seconds_or_default(
    "HEALTH_CHECK_INTERVAL_SECS", Duration::from_secs(3));

  let static_api_token_set = read_static_api_tokens();

  let ip_ban_list = load_static_container_ip_bans();
  let ip_ban_list2 = ip_ban_list.clone();

  let cidr_ban_set = load_cidr_bans();

  let user_token_troll_bans = load_troll_user_token_bans();
  let ip_address_troll_bans = load_ip_address_troll_bans();

  let model_token_info_cache = ModelTokenToInfoCache::new();
  let model_token_info_cache2 = model_token_info_cache.clone();

  // Background jobs.

  let health_check_status = HealthCheckStatus::new();
  let health_check_status2 = health_check_status.clone();
  let mysql_pool3 = pool.clone();
  let mysql_pool4 = pool.clone();
  let mysql_pool5 = pool.clone();

  let tokio_runtime = Runtime::new()?;

  info!("Spawning DB health checker thread.");

  tokio_runtime.spawn(async move {
    db_health_checker_thread(
      health_check_status2,
      mysql_pool3,
      health_check_interval,
    ).await;
  });

  info!("Spawning IP ban polling thread.");

  tokio_runtime.spawn(async {
    poll_ip_bans(ip_ban_list2, mysql_pool4).await;
  });

  info!("Spawning token info cache polling thread.");

  tokio_runtime.spawn(async {
    poll_model_token_info_thread(model_token_info_cache2, mysql_pool5).await;
  });


  let stripe_configs = StripeConfig {
    checkout: StripeCheckoutConfigs {
      success_url: FullUrlOrPath::Path(easyenv::get_env_string_required("STRIPE_CHECKOUT_SUCCESS_URL_PATH")?),
      cancel_url: FullUrlOrPath::Path(easyenv::get_env_string_required("STRIPE_CHECKOUT_CANCEL_URL_PATH")?),
    },
    portal: StripeCustomerPortalConfigs {
      return_url: FullUrlOrPath::Path(easyenv::get_env_string_required("STRIPE_PORTAL_RETURN_URL_PATH")?),
      default_portal_config_id: easyenv::get_env_string_required("STRIPE_PORTAL_DEFAULT_CONFIG_ID")?,
    },
    secrets: StripeSecrets {
      publishable_key: easyenv::get_env_string_optional("STRIPE_PUBLISHABLE_KEY"),
      secret_key: easyenv::get_env_string_required("STRIPE_SECRET_KEY")?,
      secret_webhook_signing_key: easyenv::get_env_string_required("STRIPE_SECRET_WEBHOOK_SIGNING_KEY")?,
    },
  };

  let server_environment = ServerEnvironment::from_str(&easyenv::get_env_string_required("SERVER_ENVIRONMENT")?)
      .ok_or(anyhow!("invalid server environment"))?;

  let service_feature_flags = StaticFeatureFlags {
    // Permanent (control plane / safety) flags : messaging
    maybe_status_alert_category: easyenv::get_env_string_optional("FF_STATUS_ALERT_CATEGORY"),
    maybe_status_alert_custom_message: easyenv::get_env_string_optional("FF_STATUS_ALERT_CUSTOM_MESSAGE"),

    // Permanent (control plane / safety) flags : disabling features
    global_429_pushback_filter_enabled: easyenv::get_env_bool_or_default("FF_GLOBAL_429_PUSHBACK_FILTER_ENABLED", false),
    disable_unified_queue_stats_endpoint: easyenv::get_env_bool_or_default("FF_DISABLE_QUEUE_STATS_ENDPOINT", false),
    disable_inference_queue_length_endpoint: easyenv::get_env_bool_or_default("FF_DISABLE_INFERENCE_QUEUE_LENGTH_ENDPOINT", false),
    disable_tts_queue_length_endpoint: easyenv::get_env_bool_or_default("FF_DISABLE_TTS_QUEUE_LENGTH_ENDPOINT", false),
    disable_tts_model_list_endpoint: easyenv::get_env_bool_or_default("FF_DISABLE_TTS_MODEL_LIST_ENDPOINT", false),
    disable_voice_conversion_model_list_endpoint: easyenv::get_env_bool_or_default("FF_DISABLE_VOICE_CONVERSION_MODEL_LIST_ENDPOINT", false),

    // Refresh rates
    frontend_unified_queue_stats_refresh_interval_millis: easyenv::get_env_num("FF_FRONTEND_QUEUE_STATS_REFRESH_INTERVAL_MILLIS", 15_000)?,
    frontend_pending_inference_refresh_interval_millis: easyenv::get_env_num("FF_FRONTEND_PENDING_INFERENCE_REFRESH_INTERVAL_MILLIS", 15_000)?,
    frontend_pending_tts_refresh_interval_millis: easyenv::get_env_num("FF_FRONTEND_PENDING_TTS_REFRESH_INTERVAL_MILLIS", 15_000)?,

    // Bans
    troll_ban_user_percent: easyenv::get_env_num("FF_TROLL_BANNED_USER_PERCENT", 0)?,

    // Temporary flags
    switch_tts_to_model_weights: easyenv::get_env_bool_or_default("FF_SWITCH_TTS_TO_MODEL_WEIGHTS", false),
    force_session_studio_flags: easyenv::get_env_bool_or_default("FF_FORCE_SESSION_STUDIO_FLAG", false),
    force_session_video_style_transfer_flags: easyenv::get_env_bool_or_default("FF_FORCE_SESSION_VST_FLAG", false),
  };

  let third_party_url_redirector = ThirdPartyUrlRedirector::new(server_environment);

  let stripe_client = {
    let api_secret = stripe_configs.secrets.secret_key.clone();
    stripe::Client::new(api_secret)
  };

  // NB: Docker creates this file within container builds.
  let build_sha = std::fs::read_to_string("/GIT_SHA")
      .unwrap_or(String::from("unknown"))
      .trim()
      .to_string();

  // TODO(bt,2023-11-11): Password and account details should be a secret, but gotta go fast.
  let email_sender = SmtpEmailSender::new(
    "smtp.gmail.com",
    "noreply@storyteller.ai".to_string(),
    "FakeYouHanashi1".to_string())?;

  let server_state = ServerState {
    env_config: EnvConfig {
      num_workers,
      bind_address,
      cookie_domain,
      cookie_secure,
      cookie_http_only,
      website_homepage_redirect,
    },
    server_info: ServerInfo {
      build_sha,
    },
    stripe: StripeSettings {
      config: stripe_configs,
      client: stripe_client,
    },
    hostname: server_hostname,
    server_environment,
    flags: service_feature_flags,
    third_party_url_redirector,
    health_check_status,
    mysql_pool: pool,
    elasticsearch,
    redis_pool,
    redis_ttl_cache,
    redis_rate_limiters: configure_redis_rate_limiters(&common_env)?,
    firehose_publisher,
    badge_granter,
    avt_cookie_manager,
    session_cookie_manager,
    session_checker,
    private_bucket_client,
    public_bucket_client,
    auto_gc_bucket_client,
    audio_uploads_bucket_root,
    sort_key_crypto,
    static_api_token_set,
    email_sender,
    caches: InMemoryCaches {
      durable: DurableInMemoryCaches {
        model_token_info: model_token_info_cache,
      },
      ephemeral: EphemeralInMemoryCaches {
        tts_model_list: voice_list_cache,
        voice_conversion_model_list: SingleItemTtlCache::create_with_duration(
          easyenv::get_env_duration_seconds_or_default(
            "VOICE_CONVERSION_MODEL_LIST_CACHE_TTL_SECONDS",
            Duration::from_secs(60))),
        w2l_template_list: w2l_template_cache,
        database_tts_category_list: database_tts_category_list_cache,
        tts_queue_length: tts_queue_length_cache,
        tts_model_category_assignments: tts_model_category_assignments_cache,
        leaderboard: leaderboard_cache,
        inference_queue_length: inference_queue_length_cache,
        queue_stats: SingleItemTtlCache::create_with_duration(
          easyenv::get_env_duration_seconds_or_default(
            "QUEUE_STATS_CACHE_TTL_SECONDS",
            Duration::from_secs(60))),
        featured_media_files_sieve: ArcSieve::with_capacity(
          easyenv::get_env_num("FEATURED_MEDIA_FILES_CACHE_SIZE", 25)?
        )?,
      }
    },
    ip_ban_list,
    cidr_ban_set,
    troll_bans: TrollBans {
      user_tokens: user_token_troll_bans,
      ip_addresses: ip_address_troll_bans,
    },
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

fn read_disabled_endpoints() -> DisabledEndpoints {
  let exact_filename = easyenv::get_env_string_or_default(
    "DISABLED_ENDPOINTS_FILE_EXACT_MATCH",
    "./includes/container_includes/disabled_endpoints/endpoint_exact_matches.txt");

  let exact = ExactMatchDisabledEndpoints::load_from_file(exact_filename)
      .unwrap_or(ExactMatchDisabledEndpoints::new()); // NB: Fail open

  let prefix_filename = easyenv::get_env_string_or_default(
    "DISABLED_ENDPOINTS_FILE_PREFIX_MATCH",
    "./includes/container_includes/disabled_endpoints/endpoint_prefixes.txt");

  let prefix = PrefixDisabledEndpoints::load_from_file(prefix_filename)
      .unwrap_or(PrefixDisabledEndpoints::new()); // NB: Fail open

  info!("Disabled endpoints by exact match: {}", exact.len());
  info!("Disabled endpoints by prefix: {}", prefix.len());

  DisabledEndpoints::new(exact, prefix)
}

fn load_static_container_ip_bans() -> IpBanList {
  let ip_ban_directory = easyenv::get_env_string_or_default(
    "IP_BAN_DIRECTORY",
    "./includes/container_includes/banned_ip_addresses"
  );

  let ip_ban_list = load_ip_ban_list_from_directory(ip_ban_directory)
      .unwrap_or(IpBanList::new());

  info!("Static IP bans loaded: {}", ip_ban_list.total_ip_address_count().unwrap_or(0));
  ip_ban_list
}

fn load_cidr_bans() -> BannedCidrSet {
  let cidr_ban_file = easyenv::get_env_string_or_default(
    "CIDR_BAN_FILE",
    "./includes/container_includes/banned_cidrs/banned_cidrs.txt"
  );

  let cidr_bans = load_cidr_ban_set_from_file(cidr_ban_file)
      .unwrap_or(BannedCidrSet::new());

  info!("CIDR bans loaded : {} CIDRs, {} addresses total",
    cidr_bans.total_cidr_count().unwrap_or(0),
    cidr_bans.total_ip_address_count().unwrap_or(0));

  cidr_bans
}

// NB: Some users abuse our service.
// Instead of outright banning them, we can change the function of the service.
fn load_troll_user_token_bans() -> TrollUserBanList {
  let user_token_troll_ban_directory = easyenv::get_env_string_or_default(
    "USER_TOKEN_TROLL_BAN_DIRECTORY",
    "./includes/container_includes/troll_bans/user_token_troll_bans"
  );

  let troll_ban_list = load_user_token_ban_list_from_directory(user_token_troll_ban_directory)
      .unwrap_or(TrollUserBanList::new());

  info!("Static user token troll bans loaded: {}", troll_ban_list.total_user_token_count().unwrap_or(0));
  troll_ban_list
}

// NB: Some users abuse our service.
// Instead of outright banning them, we can change the function of the service.
fn load_ip_address_troll_bans() -> IpBanList {
  let ip_ban_directory = easyenv::get_env_string_or_default(
    "IP_TROLL_BAN_DIRECTORY",
    "./includes/container_includes/troll_bans/ip_address_troll_bans"
  );

  let ip_ban_list = load_ip_ban_list_from_directory(ip_ban_directory)
      .unwrap_or(IpBanList::new());

  info!("Static IP troll bans loaded: {}", ip_ban_list.total_ip_address_count().unwrap_or(0));
  ip_ban_list
}

pub async fn serve(server_state: ServerState) -> AnyhowResult<()>
{
  let bind_address = server_state.env_config.bind_address.clone();
  let num_workers = server_state.env_config.num_workers;
  let hostname = server_state.hostname.clone();

  // TODO(bt,2023-11-12): Remove the old type.
  let old_server_environment = server_state.server_environment;
  let new_server_environment = match old_server_environment {
    ServerEnvironment::Development => server_environment::ServerEnvironment::Development,
    ServerEnvironment::Production => server_environment::ServerEnvironment::Production,
  };

  let server_state_arc = web::Data::new(Arc::new(server_state));

  let disabled_endpoints = read_disabled_endpoints();

  info!("Starting HTTP service.");

  HttpServer::new(move || {
    // NB: Safe to clone due to internal arc
    let ip_ban_list = server_state_arc.ip_ban_list.clone();
    let cidr_ban_set= server_state_arc.cidr_ban_set.clone();

    // NB: Dynamic dispatch needs to be wrapped with Arc.
    let product_lookup : Arc<dyn InternalSubscriptionProductLookup> = Arc::new(StripeInternalSubscriptionProductLookupImpl {});
    let stripe_lookup : Arc<dyn InternalProductToStripeLookup> = Arc::new(InternalProductToStripeLookupImpl{});
    let user_lookup : Arc<dyn InternalUserLookup> = Arc::new(StripeInternalUserLookupImpl::new(
      server_state_arc.session_checker.clone(),
      server_state_arc.mysql_pool.clone(),
    ));
    let session_cache_purge : Arc<dyn InternalSessionCachePurge> = Arc::new(InternalSessionCachePurgeImpl::new(
      server_state_arc.session_checker.clone(),
      server_state_arc.redis_ttl_cache.clone(),
    ));

    // NB: app_data being clone()'d below should all be safe (dependencies included)
    let app = App::new()
      .app_data(web::Data::new(server_state_arc.firehose_publisher.clone()))
      .app_data(web::Data::new(server_state_arc.mysql_pool.clone()))
      .app_data(web::Data::new(server_state_arc.redis_pool.clone()))
      .app_data(web::Data::new(server_state_arc.redis_ttl_cache.clone()))
      .app_data(web::Data::new(server_state_arc.session_checker.clone()))
      .app_data(web::Data::new(server_state_arc.avt_cookie_manager.clone()))
      .app_data(web::Data::new(server_state_arc.session_cookie_manager.clone()))
      .app_data(web::Data::new(server_state_arc.stripe.clone().config.clone()))
      .app_data(web::Data::new(server_state_arc.stripe.clone().client.clone()))
      .app_data(web::Data::new(server_state_arc.third_party_url_redirector))
      .app_data(web::Data::new(server_state_arc.email_sender.clone()))
      .app_data(web::Data::new(old_server_environment))
      .app_data(web::Data::new(new_server_environment))
      .app_data(web::Data::from(product_lookup)) // NB: Data::from(Arc<T>) for dynamic dispatch
      .app_data(web::Data::from(stripe_lookup)) // NB: Data::from(Arc<T>) for dynamic dispatch
      .app_data(web::Data::from(user_lookup)) // NB: Data::from(Arc<T>) for dynamic dispatch
      .app_data(web::Data::from(session_cache_purge)) // NB: Data::from(Arc<T>) for dynamic dispatch
      .app_data(server_state_arc.clone())
      .app_data(
        // NB: https://stackoverflow.com/a/78399675
        MultipartFormConfig::default()
            .total_limit(10 *1024 * 1024 * 1024) // 10 GB
            .memory_limit(10 * 1024 * 1024) // 10 MB
            .error_handler(handle_multipart_error)
      )
      .wrap(build_cors_config(old_server_environment))
      .wrap(shared_array_buffer_cors())
      .wrap(DefaultHeaders::new()
        .header("X-Backend-Hostname", &hostname)
        .header("X-Build-Sha", server_state_arc.server_info.build_sha.clone()))
      .wrap(PushbackFilter::new(&server_state_arc.flags.clone()))
      .wrap(DisabledEndpointFilter::new(disabled_endpoints.clone()))
      .wrap(BannedIpFilter::new(ip_ban_list))
      .wrap(BannedCidrFilter::new(cidr_ban_set))
      .wrap(Logger::new(LOG_FORMAT)
        .exclude("/liveness")
        .exclude("/readiness"))
      .wrap(middleware::Compress::default());

    add_routes(app, old_server_environment)
  })
  .bind(bind_address)?
  .workers(num_workers)
  .run()
  .await?;

  Ok(())
}

fn get_elasticsearch_client() -> AnyhowResult<Elasticsearch> {
  let transport = Transport::single_node(&easyenv::get_env_string_required("ELASTICSEARCH_URL")?)?;
  let client = Elasticsearch::new(transport);
  Ok(client)
}
