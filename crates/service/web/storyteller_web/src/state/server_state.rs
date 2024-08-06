use elasticsearch::Elasticsearch;
use r2d2_redis::{r2d2, RedisConnectionManager};
use sqlx::MySqlPool;

use actix_helpers::middleware::banned_cidr_filter::banned_cidr_set::BannedCidrSet;
use actix_helpers::middleware::banned_ip_filter::ip_ban_list::ip_ban_list::IpBanList;
use billing_component::stripe::stripe_config::StripeConfig;
use cloud_storage::bucket_client::BucketClient;
use email_sender::smtp_email_sender::SmtpEmailSender;
use memory_caching::arc_sieve::ArcSieve;
use memory_caching::single_item_ttl_cache::SingleItemTtlCache;
use mysql_queries::mediators::badge_granter::BadgeGranter;
use mysql_queries::mediators::firehose_publisher::FirehosePublisher;
use mysql_queries::queries::generic_inference::web::get_pending_inference_job_count::InferenceQueueLengthResult;
use mysql_queries::queries::media_files::list::list_featured_media_files::FeaturedMediaFileListPage;
use mysql_queries::queries::model_categories::list_categories_query_builder::CategoryList;
use mysql_queries::queries::tts::tts_inference_jobs::get_pending_tts_inference_job_count::TtsQueueLengthResult;
use mysql_queries::queries::w2l::w2l_templates::list_w2l_templates::W2lTemplateRecordForList;
use redis_caching::redis_ttl_cache::RedisTtlCache;
use reusable_types::server_environment::ServerEnvironment;
use url_config::third_party_url_redirector::ThirdPartyUrlRedirector;

use crate::configs::app_startup::username_set::UsernameSet;
use crate::configs::static_api_tokens::StaticApiTokenSet;
use crate::http_server::cookies::anonymous_visitor_tracking::avt_cookie_manager::AvtCookieManager;
use crate::http_server::endpoints::categories::tts::list_fully_computed_assigned_tts_categories::list_fully_computed_assigned_tts_categories::ModelTokensByCategoryToken;
use crate::http_server::endpoints::leaderboard::get_leaderboard::LeaderboardInfo;
use crate::http_server::endpoints::media_files::list::list_featured_media_files_handler::ListFeaturedMediaFilesQueryParams;
use crate::http_server::endpoints::stats::result_transformer::CacheableQueueStats;
use crate::http_server::endpoints::tts::list_tts_models::TtsModelRecordForResponse;
use crate::http_server::endpoints::voice_conversion::models::list_voice_conversion_models::VoiceConversionModel;
use crate::http_server::session::http::http_user_session_manager::HttpUserSessionManager;
use crate::http_server::session::session_checker::SessionChecker;
use crate::http_server::web_utils::redis_rate_limiter::RedisRateLimiter;
use crate::state::memory_cache::model_token_to_info_cache::ModelTokenToInfoCache;
use crate::threads::db_health_checker_thread::db_health_check_status::HealthCheckStatus;
use crate::util::encrypted_sort_id::SortKeyCrypto;
use crate::util::troll_user_bans::troll_user_ban_list::TrollUserBanList;

/// State that is injected into every endpoint.
pub struct ServerState {
  /// Configuration from ENV vars.
  pub env_config: EnvConfig,

  pub server_info: ServerInfo,

  pub stripe: StripeSettings,

  pub hostname: String,

  /// Knowing if we're in production will allow us to turn off development-only functionalities.
  pub server_environment: ServerEnvironment,

  /// Feature flags will allow us to restart the service with different conditions embedded in the code.
  pub flags: StaticFeatureFlags,

  pub third_party_url_redirector: ThirdPartyUrlRedirector,

  pub health_check_status: HealthCheckStatus,

  pub mysql_pool: MySqlPool,

  pub elasticsearch: Elasticsearch,

  pub redis_pool: r2d2::Pool<RedisConnectionManager>,
  pub redis_ttl_cache: RedisTtlCache,

  pub redis_rate_limiters: RedisRateLimiters,

  pub session_cookie_manager: HttpUserSessionManager,
  pub avt_cookie_manager: AvtCookieManager,

  pub session_checker: SessionChecker,

  pub firehose_publisher: FirehosePublisher,
  pub badge_granter: BadgeGranter,

  pub private_bucket_client: BucketClient,
  pub public_bucket_client: BucketClient,
  pub auto_gc_bucket_client: BucketClient,

  /// Where to store audio uploads for w2l
  pub audio_uploads_bucket_root: String,

  pub sort_key_crypto: SortKeyCrypto,

  pub email_sender: SmtpEmailSender,

  pub ip_ban_list: IpBanList,

  pub cidr_ban_set: BannedCidrSet,

  pub troll_bans: TrollBans,

  pub static_api_token_set: StaticApiTokenSet,

  pub caches: InMemoryCaches,
}

#[derive(Clone)]
pub struct EnvConfig {
  // Number of thread workers.
  pub num_workers: usize,
  pub bind_address: String,
  pub cookie_domain: String,
  pub cookie_secure: bool,
  pub cookie_http_only: bool,
  pub website_homepage_redirect: String,
}

#[derive(Clone)]
pub struct ServerInfo {
  pub build_sha: String,
}

/// Different rate limiters for different users
#[derive(Clone)]
pub struct RedisRateLimiters {
  /// Logged out users have stricter limits
  pub logged_out: RedisRateLimiter,

  /// Logged in users have a little more leeway
  pub logged_in: RedisRateLimiter,

  /// API consumers have even higher priority
  /// (Temporary for VidVoice.ai; a long term solution builds an in-memory cache
  /// of these or finds a better rate limit library that allows on-demand rate
  /// constructions)
  pub api_high_priority: RedisRateLimiter,

  /// API rate limit for AI streamers
  pub api_ai_streamers: RedisRateLimiter,

  /// Usernames of AI streamers
  pub api_ai_streamer_username_set: UsernameSet,

  /// A rate limiter for TTS and W2L uploads
  pub model_upload: RedisRateLimiter,

  /// For uploading files for voice conversion, face animator, etc.
  pub file_upload_logged_out: RedisRateLimiter,

  /// For uploading files for voice conversion, face animator, etc.
  pub file_upload_logged_in: RedisRateLimiter,
}

/// In-memory caches of several types.
#[derive(Clone)]
pub struct InMemoryCaches {
  pub durable: DurableInMemoryCaches,
  pub ephemeral: EphemeralInMemoryCaches,
}

/// Durable caches
#[derive(Clone)]
pub struct DurableInMemoryCaches {
  /// Lightweight model token (for generic inference) metadata
  pub model_token_info: ModelTokenToInfoCache,
}

/// In-memory caches with TTL-based eviction.
#[derive(Clone)]
pub struct EphemeralInMemoryCaches {
  /// Contains a list of all TTS models.
  pub tts_model_list: SingleItemTtlCache<Vec<TtsModelRecordForResponse>>,

  /// Contains a list of all voice conversion models.
  pub voice_conversion_model_list: SingleItemTtlCache<Vec<VoiceConversionModel>>,

  /// Contains a list of all W2L templates.
  pub w2l_template_list: SingleItemTtlCache<Vec<W2lTemplateRecordForList>>,

  /// Contains a list of all TTS categories in the database
  /// (before any enrichment with synthetic categories)
  /// This is used in several places (list categories, computed category assignments)
  pub database_tts_category_list: SingleItemTtlCache<CategoryList>,

  /// Computed category assignments for TTS models
  /// This is approximately O(n^3) and recursively generates all super-category membership.
  pub tts_model_category_assignments: SingleItemTtlCache<ModelTokensByCategoryToken>,

  /// Stats on generic inference queue and legacy TTS queue (combined).
  /// The frontend will consult a distributed cache and use the monotonic DB time as a
  /// vector clock.
  pub queue_stats: SingleItemTtlCache<CacheableQueueStats>,

  /// Generic inference queue length
  /// The frontend will consult a distributed cache and use the monotonic DB time as a
  /// vector clock.
  pub inference_queue_length: SingleItemTtlCache<InferenceQueueLengthResult>,

  /// TTS queue length
  /// The frontend will consult a distributed cache and use the monotonic DB time as a
  /// vector clock.
  pub tts_queue_length: SingleItemTtlCache<TtsQueueLengthResult>,

  pub leaderboard: SingleItemTtlCache<LeaderboardInfo>,

  /// Cache of featured media files
  pub featured_media_files_sieve: ArcSieve<ListFeaturedMediaFilesQueryParams, FeaturedMediaFileListPage>,
}

#[derive(Clone)]
pub struct StripeSettings {
  pub config: StripeConfig,
  pub client: stripe::Client,
}

/// Flags set at service startup
#[derive(Clone)]
pub struct StaticFeatureFlags {
  /// Filter incoming requests indiscriminately with HTTP 429.
  /// Used to bring the service back online slowly.
  pub global_429_pushback_filter_enabled: bool,

  /// If we're suffering an outage, set the alert category to display a predefined message to users.
  pub maybe_status_alert_category: Option<String>,

  /// If we're suffering an outage, set custom text for the alert message.
  pub maybe_status_alert_custom_message: Option<String>,

  /// Disable the live `/v1/stats/queues` endpoint for all users and serve a static value instead.
  pub disable_unified_queue_stats_endpoint: bool,

  /// Disable the live `/v1/model_inference/queue_length` endpoint for all users and serve a static value instead.
  pub disable_inference_queue_length_endpoint: bool,

  /// Disable the live `/tts/queue_length` endpoint for all users and serve a static value instead.
  pub disable_tts_queue_length_endpoint: bool,

  /// Disable the live `/tts/list` endpoint for all users and serve a static value instead.
  pub disable_tts_model_list_endpoint: bool,

  /// Disable the live `/v1/voice_conversion/model_list` endpoint for all users and serve a static value instead.
  pub disable_voice_conversion_model_list_endpoint: bool,

  /// Tell the frontend client how fast to refresh their view of queue stats.
  /// During an attack, we may want this to go extremely slow.
  pub frontend_unified_queue_stats_refresh_interval_millis: u64,

  /// Tell the frontend client how fast to refresh their view of the pending inference count.
  /// During an attack, we may want this to go extremely slow.
  pub frontend_pending_inference_refresh_interval_millis: u64,

  /// Tell the frontend client how fast to refresh their view of the pending TTS count.
  /// During an attack, we may want this to go extremely slow.
  pub frontend_pending_tts_refresh_interval_millis: u64,

  /// For "troll banned" users, what percentage of the time will the service misbehave?
  /// This should be a number over 100.
  pub troll_ban_user_percent: u8,

  // TODO(2024-01-13): Remove temporary flag when done.
  /// TEMPORARY: Move voice control model listing over to `model_weights` from `tts_models`
  /// This will control all downstream enqueuing, jobs, etc.
  pub switch_tts_to_model_weights: bool,

  // TODO(2024-02-06): Remove when done.
  /// TEMPORARY: Require users to have a studio flag on their `users` table record to use studio features.
  /// This will also prevent anonymous users from using the service APIs marked as studio-only.
  pub force_session_studio_flags: bool,

  // TODO(2024-03-05): Remove when done.
  /// TEMPORARY: Require users to have a flag on their `users` table record to use video style transfer.
  /// This will also prevent anonymous users from using the service APIs marked as VST-only.
  pub force_session_video_style_transfer_flags: bool,
}

/// Instead of top level service denial, these are bans against entities that instead return
/// garbage responses.
#[derive(Clone)]
pub struct TrollBans {
  pub user_tokens: TrollUserBanList,
  pub ip_addresses: IpBanList,
}
