use std::sync::Arc;
use std::time::Duration;

use actix_artcraft::sessions::anonymous_visitor_tracking::avt_cookie_manager::AvtCookieManager;
use actix_artcraft::sessions::user_sessions::http_user_session_manager::HttpUserSessionManager;
use anyhow::anyhow;
use chrono::Utc;
use cloud_storage::bucket_client::BucketClient;
use elasticsearch::http::transport::Transport;
use elasticsearch::Elasticsearch;
use errors::AnyhowResult;
use fal_client::creds::fal_api_key::FalApiKey;
use log::info;
use memory_caching::arc_ttl_sieve::ArcTtlSieve;
use memory_caching::single_item_ttl_cache::SingleItemTtlCache;
use mysql_queries::mediators::badge_granter::BadgeGranter;
use mysql_queries::mediators::firehose_publisher::FirehosePublisher;
use opaque_cursors::v2::opaque_cursor_encoder_v2::OpaqueCursorEncoderV2;
use pager::worker::pager_worker::PagerWorker;
use redis::Client;
use redis_caching::redis_ttl_cache::RedisTtlCache;
use server_environment::ServerEnvironment;
use shared_env_var_config::redis::env_get_redis_0_connection_string_or_default;
use sqlx::MySqlPool;
use url_config::third_party_url_redirector::ThirdPartyUrlRedirector;

use crate::configs::app_startup::redis_rate_limiters::configure_redis_rate_limiters;
use crate::configs::connect_to_database::connect_to_database;
use crate::configs::static_api_tokens::StaticApiTokenSet;
use crate::http_server::session::session_checker::SessionChecker;
use crate::http_server::web_utils::scoped_temp_dir_creator::ScopedTempDirCreator;
use crate::startup::setup_pager::build_pager;
use crate::startup::setup_bans::{
  load_cidr_bans, load_ip_address_troll_bans,
  load_static_container_ip_bans, load_troll_user_token_bans,
};
use crate::startup::setup_static_feature_flags::setup_static_feature_flags;
use crate::startup::setup_stripe_artcraft::setup_stripe_artcraft;
use crate::startup::setup_stripe_fakeyou::setup_stripe_fakeyou;
use crate::state::certs::google_sign_in_cert::GoogleSignInCert;
use crate::state::memory_cache::model_token_to_info_cache::ModelTokenToInfoCache;
use crate::state::server_state::{
  BeebleData, DurableInMemoryCaches, EnvConfig, EphemeralInMemoryCaches, FalData,
  GmiCloudData, GrokApiData, InMemoryCaches, OpenAiData, ResendData, Seedance2ProData, ServerInfo,
  ServerState, TrollBans, WorldLabsData,
};
use crate::threads::db_health_checker_thread::db_health_check_status::HealthCheckStatus;
use crate::util::encrypted_sort_id::SortKeyCrypto;

// Bucket config
const ENV_ACCESS_KEY: &str = "ACCESS_KEY";
const ENV_SECRET_KEY: &str = "SECRET_KEY";
const ENV_REGION_NAME: &str = "REGION_NAME";
const ENV_PRIVATE_BUCKET_NAME: &str = "W2L_PRIVATE_DOWNLOAD_BUCKET_NAME";
const ENV_PUBLIC_BUCKET_NAME: &str = "W2L_PUBLIC_DOWNLOAD_BUCKET_NAME";
const ENV_GC_ENABLED_PUBLIC_BUCKET_NAME: &str = "GC_ENABLED_PUBLIC_BUCKET_NAME";
const ENV_AUDIO_UPLOADS_BUCKET_ROOT: &str = "AUDIO_UPLOADS_BUCKET_ROOT";

/// Everything produced by server startup that the main function needs.
pub struct SetupResult {
  pub server_state: ServerState,
  pub pager_worker: PagerWorker,
  pub health_check_interval: Duration,
}

pub async fn setup_dependencies(server_hostname: &str) -> AnyhowResult<SetupResult> {
  info!("Connecting to database...");
  let pool = connect_to_database().await?;

  info!("Connected to database.");

  let firehose_publisher = FirehosePublisher {
    mysql_pool: pool.clone(),
  };

  let badge_granter = BadgeGranter {
    mysql_pool: pool.clone(),
    firehose_publisher: firehose_publisher.clone(),
  };

  info!("Connecting to redis...");

  let redis_manager = Client::open(env_get_redis_0_connection_string_or_default())?;
  let redis_pool = r2d2::Pool::builder().build(redis_manager)?;

  let redis_ttl_cache = RedisTtlCache::new_with_ttl(
    redis_pool.clone(),
    easyenv::get_env_num("REDIS_CACHE_TTL_SECONDS", 60)?,
  );

  info!("Connecting to elasticsearch...");
  let elasticsearch = get_elasticsearch_client()?;

  info!("Reading env vars and setting up utils...");

  let bind_address = easyenv::get_env_string_or_default("BIND_ADDRESS", "0.0.0.0:12345");
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

  let private_bucket_name = easyenv::get_env_string_required(ENV_PRIVATE_BUCKET_NAME)?;
  let public_bucket_name = easyenv::get_env_string_required(ENV_PUBLIC_BUCKET_NAME)?;
  let gc_enabled_public_bucket_name = easyenv::get_env_string_required(ENV_GC_ENABLED_PUBLIC_BUCKET_NAME)?;

  let audio_uploads_bucket_root = easyenv::get_env_string_required(ENV_AUDIO_UPLOADS_BUCKET_ROOT)?;

  let s3_compatible_endpoint_url = easyenv::get_env_string_or_default("S3_COMPATIBLE_ENDPOINT_URL", "https://storage.googleapis.com");
  let bucket_timeout = easyenv::get_env_duration_seconds_or_default("BUCKET_TIMEOUT_SECONDS", Duration::from_secs(60 * 5));

  let private_bucket_client = BucketClient::create(
    &access_key, &secret_key, &region_name, &private_bucket_name,
    &s3_compatible_endpoint_url, None, Some(bucket_timeout),
  )?;

  let public_bucket_client = BucketClient::create(
    &access_key, &secret_key, &region_name, &public_bucket_name,
    &s3_compatible_endpoint_url, None, Some(bucket_timeout),
  )?;

  let auto_gc_bucket_client = BucketClient::create(
    &access_key, &secret_key, &region_name, &gc_enabled_public_bucket_name,
    &s3_compatible_endpoint_url, None, Some(bucket_timeout),
  )?;

  // In-Memory Caches
  let voice_list_cache_ttl = easyenv::get_env_duration_seconds_or_default("VOICE_LIST_CACHE_TTL_SECONDS", Duration::from_secs(60));
  let voice_list_cache = SingleItemTtlCache::create_with_duration(voice_list_cache_ttl);

  let database_tts_category_list_cache = SingleItemTtlCache::create_with_duration(
    easyenv::get_env_duration_seconds_or_default("DATABASE_TTS_CATEGORY_LIST_CACHE_TTL_SECONDS", Duration::from_secs(60))
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

  let sort_key_crypto_secret = easyenv::get_env_string_or_default("SORT_KEY_SECRET", "webscale");
  let sort_key_crypto = SortKeyCrypto::new(&sort_key_crypto_secret);
  let opaque_cursor_encoder = OpaqueCursorEncoderV2::new(&sort_key_crypto_secret);

  let health_check_interval = easyenv::get_env_duration_seconds_or_default(
    "HEALTH_CHECK_INTERVAL_SECS", Duration::from_secs(3));

  let static_api_token_set = read_static_api_tokens();

  let ip_ban_list = load_static_container_ip_bans();

  let cidr_ban_set = load_cidr_bans();

  let user_token_troll_bans = load_troll_user_token_bans();
  let ip_address_troll_bans = load_ip_address_troll_bans();

  let model_token_info_cache = ModelTokenToInfoCache::new();

  let health_check_status = HealthCheckStatus::new();

  let server_environment = ServerEnvironment::from_str(&easyenv::get_env_string_required("SERVER_ENVIRONMENT")?)
    .ok_or(anyhow!("invalid server environment"))?;

  let (pager, pager_worker, paging_flags) = build_pager(server_environment, server_hostname);

  let service_feature_flags = setup_static_feature_flags(paging_flags)?;

  let third_party_url_redirector = ThirdPartyUrlRedirector::new(server_environment);

  // NB: Docker creates this file within container builds.
  let build_sha = std::fs::read_to_string("/GIT_SHA")
    .unwrap_or(String::from("unknown"))
    .trim()
    .to_string();

  let fal_api_key = FalApiKey::new(easyenv::get_env_string_required("FAL_API_KEY")?);
  let fal_webhook_url = easyenv::get_env_string_required("FAL_WEBHOOK_URL")?;

  let openai_api_key = easyenv::get_env_string_required("OPENAI_API_KEY")?;
  let resend_api_key = easyenv::get_env_string_required("RESEND_API_KEY")?;
  let gmicloud_api_key = easyenv::get_env_string_required("GMICLOUD_API_KEY")?;
  let grok_api_key = easyenv::get_env_string_required("GROK_API_KEY")?;
  let worldlabs_api_key = easyenv::get_env_string_required("WORLDLABS_API_KEY")?;

  let startup_time = Utc::now();

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
    stripe: setup_stripe_fakeyou()?,
    stripe_artcraft: setup_stripe_artcraft()?,
    hostname: server_hostname.to_string(),
    startup_time,
    server_environment,
    flags: service_feature_flags,
    third_party_url_redirector,
    health_check_status,
    mysql_pool: pool,
    elasticsearch,
    redis_pool,
    redis_ttl_cache,
    redis_rate_limiters: configure_redis_rate_limiters()?,
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
    opaque_cursors: opaque_cursor_encoder,
    static_api_token_set,
    beeble: BeebleData {
      api_key: beeble_client::creds::beeble_api_key::BeebleApiKey::new(
        easyenv::get_env_string_required("BEEBLE_API_KEY")?,
      ),
      webhook_url: easyenv::get_env_string_required("BEEBLE_WEBHOOK_URL")?,
    },
    fal: FalData {
      api_key: fal_api_key,
      webhook_url: fal_webhook_url,
    },
    gmicloud: GmiCloudData {
      api_key: gmicloud_client::creds::gmicloud_api_key::GmiCloudApiKey::new(gmicloud_api_key),
    },
    grok_api: GrokApiData {
      api_key: grok_api_client::creds::grok_api_key::GrokApiKey::new(grok_api_key),
    },
    seedance2pro: Seedance2ProData {
      cookies: easyenv::get_env_string_required("SEEDANCE2PRO_COOKIES")?,
      cookies_byteplus: easyenv::get_env_string_required("SEEDANCE2PRO_WHITELIST_COOKIES")?,
    },
    openai: OpenAiData {
      api_key: openai_api_key,
    },
    resend: ResendData {
      api_key: resend_api_key,
    },
    worldlabs: WorldLabsData {
      api_key: worldlabs_api_key,
    },
    pager,
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
        database_tts_category_list: database_tts_category_list_cache,
        tts_queue_length: tts_queue_length_cache,
        tts_model_category_assignments: tts_model_category_assignments_cache,
        leaderboard: leaderboard_cache,
        inference_queue_length: inference_queue_length_cache,
        queue_stats: SingleItemTtlCache::create_with_duration(
          easyenv::get_env_duration_seconds_or_default(
            "QUEUE_STATS_CACHE_TTL_SECONDS",
            Duration::from_secs(60))),
        featured_media_files_sieve: ArcTtlSieve::with_capacity_and_ttl_duration(
          easyenv::get_env_num("FEATURED_MEDIA_FILES_CACHE_SIZE", 25)?,
          easyenv::get_env_duration_seconds_or_default("FEATURED_MEDIA_FILES_TTL_SECONDS", Duration::from_secs(60)),
        )?,
      }
    },
    ip_ban_list,
    cidr_ban_set,
    troll_bans: TrollBans {
      user_tokens: user_token_troll_bans,
      ip_addresses: ip_address_troll_bans,
    },
    temp_dir_creator: ScopedTempDirCreator::auto_setup(),
    google_sign_in_cert: GoogleSignInCert::new(),
  };

  Ok(SetupResult {
    server_state,
    pager_worker,
    health_check_interval,
  })
}

fn read_static_api_tokens() -> StaticApiTokenSet {
  let filename = easyenv::get_env_string_or_default(
    "STATIC_API_TOKENS_CONFIG_FILE",
    "./configs/static_api_tokens.toml");

  StaticApiTokenSet::from_file(&filename)
}

fn get_elasticsearch_client() -> AnyhowResult<Elasticsearch> {
  let transport = Transport::single_node(&easyenv::get_env_string_required("ELASTICSEARCH_URL")?)?;
  let client = Elasticsearch::new(transport);
  Ok(client)
}
