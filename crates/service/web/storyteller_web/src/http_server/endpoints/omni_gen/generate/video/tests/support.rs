//! Shared harness for database fixture tests: a `ServerState` wired to the
//! guarded test database, a local stub Kinovi server (so NO external calls
//! ever leave the process), and helpers for driving the generate handler
//! with dummy Actix HTTP requests as a fixture user.

use std::collections::HashSet;
use std::sync::Arc;
use std::time::Duration;

use actix_web::cookie::Cookie;
use actix_web::test::TestRequest;
use actix_web::web::{Data, Json};
use actix_web::HttpRequest;
use chrono::Utc;
use sqlx::MySqlPool;

use actix_artcraft::sessions::anonymous_visitor_tracking::avt_cookie_manager::AvtCookieManager;
use actix_artcraft::sessions::user_sessions::http_user_session_manager::HttpUserSessionManager;
use actix_helpers::middleware::banned_cidr_filter::banned_cidr_set::BannedCidrSet;
use actix_helpers::middleware::banned_ip_filter::ip_ban_list::ip_ban_list::IpBanList;
use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_video_cost_and_generate_request::OmniGenVideoCostAndGenerateRequest;
use artcraft_api_defs::omni_gen::generate_response::omni_gen_video_generate_response::OmniGenVideoGenerateResponse;
use billing_artcraft_component::utils::artcraft_stripe_config::ArtcraftStripeConfig;
use billing_component::stripe::stripe_config::{
  FullUrlOrPath, StripeCheckoutConfigs, StripeConfig, StripeCustomerPortalConfigs, StripeSecrets,
};
use cloud_storage::legacy_bucket_client::LegacyBucketClient;
use elasticsearch::http::transport::Transport;
use elasticsearch::Elasticsearch;
use enums::common::generation::common_video_model::CommonVideoModel;
use kinovi_web_client::requests::kinovi_host::{
  ENV_KINOVI_CUSTOM_API_HOST, ENV_KINOVI_CUSTOM_CDN_HOST,
};
use memory_caching::arc_ttl_sieve::ArcTtlSieve;
use memory_caching::single_item_ttl_cache::SingleItemTtlCache;
use mysql_queries::mediators::badge_granter::BadgeGranter;
use mysql_queries::mediators::firehose_publisher::FirehosePublisher;
use mysql_testing::fixtures::users::TestUser;
use redis_caching::redis_ttl_cache::RedisTtlCache;
use server_environment::ServerEnvironment;
use url_config::third_party_url_redirector::ThirdPartyUrlRedirector;

use crate::configs::app_startup::redis_rate_limiters::configure_redis_rate_limiters;
use crate::configs::static_api_tokens::StaticApiTokenSet;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::omni_gen::generate::video::omni_gen_video_generate_handler::omni_gen_video_generate_handler;
use crate::http_server::user_lookup::user_session::session_utils::session_checker::SessionChecker;
use crate::http_server::web_utils::scoped_temp_dir_creator::ScopedTempDirCreator;
use crate::http_server::web_utils::web_opaque_cursor_encoder_v2::WebOpaqueCursorEncoderV2;
use crate::http_server::web_utils::web_sort_key_crypto::WebSortKeyCrypto;
use crate::startup::setup_inference_providers::{
  BeebleData, FalData, GmiCloudData, GrokApiData, InferenceProviders, KinoviWebData, OpenAiData,
  WorldLabsData,
};
use crate::startup::setup_pager::build_pager;
use crate::startup::setup_static_feature_flags::setup_static_feature_flags;
use crate::state::certs::google_sign_in_cert::GoogleSignInCert;
use crate::state::memory_cache::model_token_to_info_cache::ModelTokenToInfoCache;
use crate::state::server_state::{
  Dashboards, DataboxDashboards, DurableInMemoryCaches, EnvConfig, EphemeralInMemoryCaches,
  InMemoryCaches, ResendData, ServerInfo, ServerState, StripeSettings, TrollBans,
};
use crate::threads::db_health_checker_thread::db_health_check_status::HealthCheckStatus;
use crate::util::troll_user_bans::troll_user_ban_list::TrollUserBanList;

const TEST_COOKIE_DOMAIN: &str = "localhost";
const TEST_COOKIE_SECRET: &str = "test_cookie_secret";

/// Everything a database test needs. Keep it alive for the test's duration.
pub struct TestHarness {
  pub pool: MySqlPool,
  pub server_state: Arc<ServerState>,
  pub stub_kinovi_base_url: String,
}

impl TestHarness {
  /// Connect to the guarded test database, start the stub Kinovi server, and
  /// build a ServerState pointing at both.
  pub async fn create() -> TestHarness {
    // The test binary compiles rustls with BOTH crypto backends (via the
    // union of dev-dependencies), which makes TLS-config construction panic
    // with an ambiguous-provider error unless one is installed explicitly.
    let _ = rustls::crypto::aws_lc_rs::default_provider().install_default();

    // One stub per process; the OnceLock init also points the Kinovi env
    // override at it BEFORE any test can issue a request, so tests are free
    // to run in parallel (each creates isolated users/wallets/media).
    let stub_kinovi_base_url = process_stub_kinovi_base_url().clone();

    let pool = mysql_testing::pool::create_test_pool().await;
    let server_state = Arc::new(build_test_server_state(pool.clone(), stub_kinovi_base_url.clone()));

    TestHarness {
      pool,
      server_state,
      stub_kinovi_base_url,
    }
  }

  /// Create a fixture user with a session and a wallet funded with `credits`.
  pub async fn create_funded_user(&self, credits: u64) -> TestUser {
    let user = mysql_testing::fixtures::users::create_test_user(&self.pool)
      .await
      .expect("create test user");
    mysql_testing::fixtures::wallets::fund_wallet_banked(&self.pool, &user.user_token, credits)
      .await
      .expect("fund wallet");
    user
  }

  /// The user's current total wallet balance (banked + monthly).
  pub async fn wallet_balance(&self, user: &TestUser) -> u64 {
    mysql_testing::fixtures::wallets::artcraft_wallet_balance(&self.pool, &user.user_token)
      .await
      .expect("read wallet balance")
      .map(|balance| balance.total())
      .unwrap_or(0)
  }

  /// All ledger entries for the user's wallet, oldest first.
  pub async fn ledger_entries(
    &self,
    user: &TestUser,
  ) -> Vec<mysql_testing::fixtures::wallets::LedgerEntry> {
    let wallet_token =
      mysql_testing::fixtures::wallets::fund_wallet_banked(&self.pool, &user.user_token, 0)
        .await
        .expect("resolve wallet token");
    mysql_testing::fixtures::wallets::wallet_ledger_entries(&self.pool, &wallet_token)
      .await
      .expect("read ledger")
  }

  /// POST the request through the real generate handler as `user`.
  pub async fn post_generate(
    &self,
    user: &TestUser,
    request: OmniGenVideoCostAndGenerateRequest,
  ) -> Result<OmniGenVideoGenerateResponse, CommonWebError> {
    let http_request = self.authed_request(user);
    omni_gen_video_generate_handler(
      http_request,
      Json(request),
      Data::new(self.server_state.clone()),
    )
    .await
    .map(Json::into_inner)
  }

  /// A dummy HTTP request carrying the user's session cookie.
  fn authed_request(&self, user: &TestUser) -> HttpRequest {
    let cookie = self
      .server_state
      .session_cookie_manager
      .create_cookie(&user.session_token, &user.user_token)
      .expect("create session cookie");
    // TestRequest wants an owned cookie with a 'static-compatible lifetime.
    let cookie = Cookie::new("session", cookie.value().to_string());

    TestRequest::post()
      .uri("/v1/omni_gen/generate/video")
      .cookie(cookie)
      .peer_addr("127.0.0.1:9999".parse().expect("peer addr"))
      .to_http_request()
  }
}

/// Every pricing test funds a fresh user with this many credits.
pub const STARTING_CREDITS: u64 = 100_000;

/// Newtype wrappers so pricing-table test cases read unambiguously:
/// `(Some(FourEightyP), Seconds(5), Batch(1), ExpectedCredits(39))`.
#[derive(Clone, Copy, Debug)]
pub struct Seconds(pub u16);

#[derive(Clone, Copy, Debug)]
pub struct Batch(pub u16);

#[derive(Clone, Copy, Debug)]
pub struct ExpectedCredits(pub u64);

/// How many credits MORE the variant charges than its base model.
#[derive(Clone, Copy, Debug)]
pub struct CreditsDelta(pub u64);

/// A generate request with only the model set; tests fill in the rest.
/// Idempotency tokens must be unique per call.
pub fn base_generate_request(model: CommonVideoModel) -> OmniGenVideoCostAndGenerateRequest {
  OmniGenVideoCostAndGenerateRequest {
    idempotency_token: Some(uuid_v4_like()),
    model: Some(model),
    prompt: Some("a corgi runs through a field of sunflowers".to_string()),
    negative_prompt: None,
    start_frame_image_media_token: None,
    end_frame_image_media_token: None,
    reference_image_media_tokens: None,
    reference_video_media_tokens: None,
    reference_audio_media_tokens: None,
    reference_character_tokens: None,
    resolution: None,
    aspect_ratio: None,
    bitrate: None,
    quality: None,
    duration_seconds: None,
    video_batch_count: None,
    generate_audio: None,
    estimate_only: None,
  }
}

/// A unique 32-hex-char idempotency token (accepted UUID format).
fn uuid_v4_like() -> String {
  use std::sync::atomic::{AtomicU64, Ordering};
  static COUNTER: AtomicU64 = AtomicU64::new(0);
  let count = COUNTER.fetch_add(1, Ordering::Relaxed);
  let nanos = std::time::SystemTime::now()
    .duration_since(std::time::UNIX_EPOCH)
    .expect("clock")
    .as_nanos();
  format!("{:016x}{:016x}", nanos as u64, count)
}

/// The process-wide stub server's base URL. First use spawns the stub
/// (plain OS threads — it outlives every per-test tokio runtime) and sets
/// BOTH the Kinovi host-override and media-CDN-override env vars exactly
/// once, before returning.
fn process_stub_kinovi_base_url() -> &'static String {
  use std::sync::OnceLock;
  static STUB: OnceLock<String> = OnceLock::new();
  STUB.get_or_init(|| {
    let base_url = spawn_stub_server();
    std::env::set_var(ENV_KINOVI_CUSTOM_API_HOST, &base_url);
    std::env::set_var(ENV_KINOVI_CUSTOM_CDN_HOST, &base_url);
    base_url
  })
}

/// A stub for BOTH the Kinovi API and the media CDN. Runs on plain OS
/// threads so it is independent of any tokio runtime and serves connections
/// until the test process exits.
///
/// - `GET` paths containing `dur{millis}ms` serve a REAL generated video of
///   that duration (ffmpeg, cached per duration) — the reference-video
///   billing probe downloads and ffprobes these.
/// - `POST …uploads.signedUploadUrl` answers with an upload URL back at this
///   stub; the subsequent `PUT` is accepted with 200.
/// - Any other `POST` answers as a successful workflow.runTask with
///   process-unique order ids.
fn spawn_stub_server() -> String {
  use std::io::{Read, Write};
  use std::net::TcpListener;
  use std::sync::atomic::{AtomicU64, Ordering};

  // Order/task ids must be unique: generic_inference_jobs has a UNIQUE key
  // on the external third-party id — and the test database PERSISTS across
  // runs, so ids must be unique across processes, not just within one.
  static ORDER_COUNTER: AtomicU64 = AtomicU64::new(1);
  let process_prefix = std::time::SystemTime::now()
    .duration_since(std::time::UNIX_EPOCH)
    .expect("clock")
    .as_nanos() as u64;

  let listener = TcpListener::bind("127.0.0.1:0").expect("bind stub server");
  let port = listener.local_addr().expect("local addr").port();
  let base_url = format!("http://127.0.0.1:{port}");
  let base_url_for_thread = base_url.clone();

  std::thread::spawn(move || {
    for stream in listener.incoming() {
      let Ok(mut stream) = stream else { continue };
      let base_url = base_url_for_thread.clone();
      std::thread::spawn(move || {
        let _ = stream.set_read_timeout(Some(Duration::from_millis(500)));
        let mut buffer = vec![0u8; 1 << 20];
        let mut read_total = 0;
        loop {
          match stream.read(&mut buffer[read_total..]) {
            Ok(n) if n > 0 => {
              read_total += n;
              if buffer[..read_total].windows(4).any(|w| w == b"\r\n\r\n") && read_total > 4 {
                break;
              }
            }
            _ => break,
          }
        }
        let head = String::from_utf8_lossy(&buffer[..read_total]).to_string();
        let request_line = head.lines().next().unwrap_or_default().to_string();

        let (status, content_type, body): (&str, &str, Vec<u8>) =
          if request_line.starts_with("GET") {
            match extract_fixture_duration_millis(&request_line) {
              Some(millis) => ("200 OK", "video/mp4", fixture_video_bytes(millis)),
              None => ("404 Not Found", "text/plain", b"not found".to_vec()),
            }
          } else if request_line.starts_with("PUT") {
            ("200 OK", "text/plain", Vec::new())
          } else if request_line.contains("uploads.signedUploadUrl") {
            let upload_url = format!("{base_url}/upload-target/materials/test/fixture.mp4");
            let json = format!(r#"[{{"result":{{"data":{{"json":"{upload_url}"}}}}}}]"#);
            ("200 OK", "application/json", json.into_bytes())
          } else {
            let order_number = ORDER_COUNTER.fetch_add(1, Ordering::Relaxed);
            let json = format!(
              r#"[{{"result":{{"data":{{"json":{{"taskId":"task_test_{process_prefix:016x}_{order_number:04}","orderId":"ord_test_{process_prefix:016x}_{order_number:04}","violationWarning":false}}}}}}}}]"#,
            );
            ("200 OK", "application/json", json.into_bytes())
          };

        let response = format!(
          "HTTP/1.1 {status}\r\nContent-Type: {content_type}\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",
          body.len(),
        );
        let _ = stream.write_all(response.as_bytes());
        let _ = stream.write_all(&body);
        let _ = stream.shutdown(std::net::Shutdown::Both);
      });
    }
  });

  base_url
}

/// `GET /media/.../dur2500ms_abc.mp4 HTTP/1.1` → `Some(2500)`.
fn extract_fixture_duration_millis(request_line: &str) -> Option<u64> {
  let idx = request_line.find("dur")?;
  let rest = &request_line[idx + 3..];
  let end = rest.find("ms")?;
  rest[..end].parse().ok()
}

/// A real MP4 of the requested duration, generated with ffmpeg once per
/// duration and cached on disk for the life of the machine's temp dir.
fn fixture_video_bytes(duration_millis: u64) -> Vec<u8> {
  use std::sync::Mutex;
  // Parallel tests race on cache generation; serialize it and land finished
  // files with an atomic rename so a reader can never see a partial write.
  static GENERATION_LOCK: Mutex<()> = Mutex::new(());

  let cache_dir = std::env::temp_dir().join("artcraft_mysql_testing_fixture_videos");
  std::fs::create_dir_all(&cache_dir).expect("create fixture video cache dir");
  let cache_path = cache_dir.join(format!("fixture_{duration_millis}.mp4"));

  if !cache_path.exists() {
    let _guard = GENERATION_LOCK.lock().unwrap_or_else(|poisoned| poisoned.into_inner());
    if !cache_path.exists() {
      let scratch_path = cache_dir.join(format!(
        "fixture_{duration_millis}.partial.{}.mp4",
        std::process::id(),
      ));
      let seconds = duration_millis as f64 / 1_000.0;
      let status = std::process::Command::new("ffmpeg")
        .args([
          "-y",
          "-f", "lavfi",
          // Rate INSIDE the filter so the frame count (and thus the container
          // duration) is exact; output retiming via `-r` pads the duration.
          "-i", &format!("color=c=black:s=64x64:r=10:d={seconds}"),
          "-pix_fmt", "yuv420p",
        ])
        .arg(&scratch_path)
        .output()
        .expect("ffmpeg must be installed to generate fixture videos for database tests");
      assert!(
        status.status.success(),
        "ffmpeg failed generating a {duration_millis}ms fixture video: {}",
        String::from_utf8_lossy(&status.stderr),
      );
      std::fs::rename(&scratch_path, &cache_path).expect("land fixture video");
    }
  }

  std::fs::read(&cache_path).expect("read fixture video")
}

/// A ServerState whose only live dependencies are the test MySQL pool and
/// the stub Kinovi server. Everything else is inert dummy configuration:
/// Redis/Elasticsearch/Stripe/bucket clients are constructed lazily and are
/// never called on the video generate path.
fn build_test_server_state(pool: MySqlPool, media_cdn_override_url: String) -> ServerState {
  let session_cookie_manager = HttpUserSessionManager::new(TEST_COOKIE_DOMAIN, TEST_COOKIE_SECRET)
    .expect("session cookie manager");
  let avt_cookie_manager =
    AvtCookieManager::new(TEST_COOKIE_DOMAIN, TEST_COOKIE_SECRET).expect("avt cookie manager");
  // NB: `new` (not `new_with_cache`) keeps Redis out of session checks.
  let session_checker = SessionChecker::new(&session_cookie_manager);

  let firehose_publisher = FirehosePublisher { mysql_pool: pool.clone() };
  let badge_granter = BadgeGranter {
    mysql_pool: pool.clone(),
    firehose_publisher: firehose_publisher.clone(),
  };

  // Lazy client: never connects unless used (it isn't on this path).
  let redis_pool = r2d2::Pool::builder()
    .build_unchecked(redis::Client::open("redis://127.0.0.1:1/").expect("redis client"));
  let redis_ttl_cache = RedisTtlCache::new_with_ttl(redis_pool.clone(), 60);

  let server_environment = ServerEnvironment::Development;
  let (pager, _pager_worker, paging_flags) = build_pager(server_environment, "test-host");

  // Built once per process: these construct HTTP/TLS clients that load the
  // platform certificate store, which intermittently fails (macOS keychain
  // I/O errors) when dozens of parallel tests do it simultaneously.
  struct ExpensiveDummies {
    stripe: StripeSettings,
    stripe_artcraft: billing_artcraft_component::utils::artcraft_stripe_config::ArtcraftStripeConfigWithClient,
    elasticsearch: Elasticsearch,
    private_bucket_client: LegacyBucketClient,
    public_bucket_client: LegacyBucketClient,
    auto_gc_bucket_client: LegacyBucketClient,
    redis_rate_limiters: crate::state::server_state::RedisRateLimiters,
  }
  use std::sync::OnceLock;
  static DUMMIES: OnceLock<ExpensiveDummies> = OnceLock::new();
  let dummies = DUMMIES.get_or_init(|| {
    let dummy_bucket = || {
      LegacyBucketClient::create(
        "test-access-key",
        "test-secret-key",
        "auto",
        "test-bucket",
        "http://127.0.0.1:1",
        None,
        Some(Duration::from_secs(5)),
      )
      .expect("bucket client")
    };
    ExpensiveDummies {
      stripe: StripeSettings {
        config: StripeConfig {
          checkout: StripeCheckoutConfigs {
            success_url: FullUrlOrPath::Path("/success".to_string()),
            cancel_url: FullUrlOrPath::Path("/cancel".to_string()),
          },
          portal: StripeCustomerPortalConfigs {
            return_url: FullUrlOrPath::Path("/portal".to_string()),
            default_portal_config_id: "bpc_test".to_string(),
          },
          secrets: StripeSecrets {
            publishable_key: None,
            secret_key: "sk_test_dummy".to_string(),
            secret_webhook_signing_key: "whsec_test_dummy".to_string(),
          },
        },
        client: stripe::Client::new("sk_test_dummy"),
        stripe_account_id: "acct_test".to_string(),
      },
      stripe_artcraft: ArtcraftStripeConfig {
        stripe_account_id: "acct_test".to_string(),
        secret_key: "sk_test_dummy".to_string(),
        secret_webhook_signing_key: "whsec_test_dummy".to_string(),
        checkout_success_url: "http://localhost/success".to_string(),
        checkout_cancel_url: "http://localhost/cancel".to_string(),
        portal_return_url: "http://localhost/portal".to_string(),
      }
      .to_config_with_client(),
      elasticsearch: Elasticsearch::new(
        Transport::single_node("http://127.0.0.1:1").expect("es transport"),
      ),
      private_bucket_client: dummy_bucket(),
      public_bucket_client: dummy_bucket(),
      auto_gc_bucket_client: dummy_bucket(),
      redis_rate_limiters: configure_redis_rate_limiters().expect("rate limiters"),
    }
  });

  ServerState {
    env_config: EnvConfig {
      num_workers: 1,
      bind_address: "127.0.0.1:0".to_string(),
      cookie_domain: TEST_COOKIE_DOMAIN.to_string(),
      cookie_secure: false,
      cookie_http_only: true,
      website_homepage_redirect: "http://localhost/".to_string(),
    },
    server_info: ServerInfo { build_sha: "test".to_string() },
    stripe: dummies.stripe.clone(),
    stripe_artcraft: dummies.stripe_artcraft.clone(),
    hostname: "test-host".to_string(),
    startup_time: Utc::now(),
    server_environment,
    // Server-side media downloads (reference probing, upload resolution) hit
    // the stub instead of the real CDN.
    maybe_media_cdn_override_url: Some(media_cdn_override_url),
    flags: setup_static_feature_flags(paging_flags).expect("feature flags"),
    third_party_url_redirector: ThirdPartyUrlRedirector::new(server_environment),
    health_check_status: HealthCheckStatus::new(),
    mysql_pool: pool,
    elasticsearch: dummies.elasticsearch.clone(),
    redis_pool,
    redis_ttl_cache,
    redis_rate_limiters: dummies.redis_rate_limiters.clone(),
    session_cookie_manager,
    avt_cookie_manager,
    session_checker,
    firehose_publisher,
    badge_granter,
    private_bucket_client: dummies.private_bucket_client.clone(),
    public_bucket_client: dummies.public_bucket_client.clone(),
    auto_gc_bucket_client: dummies.auto_gc_bucket_client.clone(),
    seedance_video_bucket: None,
    inference_providers: InferenceProviders {
      fal: FalData {
        api_key: fal_client::creds::fal_api_key::FalApiKey::new("test".to_string()),
        webhook_url: "http://localhost/webhook".to_string(),
      },
      gmicloud: GmiCloudData {
        api_key: gmicloud_client::creds::gmicloud_api_key::GmiCloudApiKey::new("test".to_string()),
      },
      grok_api: GrokApiData {
        api_key: grok_api_client::creds::grok_api_key::GrokApiKey::new("test".to_string()),
      },
      beeble: BeebleData {
        api_key: beeble_client::creds::beeble_api_key::BeebleApiKey::new("test".to_string()),
        webhook_url: "http://localhost/webhook".to_string(),
      },
      kinovi_web: KinoviWebData {
        cookies_volcengine: "test_cookie_volcengine=1".to_string(),
        cookies_byteplus: "test_cookie_byteplus=1".to_string(),
        cookies_byteplus_ultra: "test_cookie_byteplus_ultra=1".to_string(),
      },
      openai: OpenAiData { api_key: "test".to_string() },
      worldlabs: WorldLabsData { api_key: "test".to_string() },
    },
    resend: ResendData { api_key: "test".to_string() },
    pager,
    audio_uploads_bucket_root: "test-audio-uploads".to_string(),
    sort_key_crypto: WebSortKeyCrypto::new("test-sort-key"),
    opaque_cursors: WebOpaqueCursorEncoderV2::new("test-sort-key"),
    ip_ban_list: IpBanList::new(),
    cidr_ban_set: BannedCidrSet::new(),
    troll_bans: TrollBans {
      user_tokens: TrollUserBanList::new(),
      ip_addresses: IpBanList::new(),
    },
    static_api_token_set: StaticApiTokenSet::from_file("/nonexistent/static_api_tokens.toml"),
    internal_api_keys: HashSet::new(),
    caches: InMemoryCaches {
      durable: DurableInMemoryCaches {
        model_token_info: ModelTokenToInfoCache::new(),
      },
      ephemeral: EphemeralInMemoryCaches {
        tts_model_list: SingleItemTtlCache::create_with_duration(Duration::from_secs(60)),
        database_tts_category_list: SingleItemTtlCache::create_with_duration(Duration::from_secs(60)),
        tts_model_category_assignments: SingleItemTtlCache::create_with_duration(Duration::from_secs(60)),
        inference_queue_length: SingleItemTtlCache::create_with_duration(Duration::from_secs(60)),
        featured_media_files_sieve: ArcTtlSieve::with_capacity_and_ttl_duration(
          25,
          Duration::from_secs(60),
        )
        .expect("sieve"),
      },
    },
    google_sign_in_cert: GoogleSignInCert::new(),
    temp_dir_creator: ScopedTempDirCreator::auto_setup(),
    dashboards: Dashboards {
      databox: DataboxDashboards {
        daus_id: None,
        daily_generations_id: None,
      },
    },
  }
}

/// Fund a fresh user, run one generation to completion via the stub Kinovi
/// server, and assert the wallet was debited exactly the expected credits
/// (balance delta AND ledger entry).
pub async fn assert_successful_generation_charges(
  harness: &TestHarness,
  model: CommonVideoModel,
  resolution: Option<enums::common::generation::common_resolution::CommonResolution>,
  Seconds(duration_seconds): Seconds,
  Batch(batch_count): Batch,
  ExpectedCredits(expected_credits): ExpectedCredits,
) {
  let user = harness.create_funded_user(STARTING_CREDITS).await;

  let mut request = base_generate_request(model);
  request.resolution = resolution;
  request.duration_seconds = Some(duration_seconds);
  request.video_batch_count = Some(batch_count);

  let response = harness
    .post_generate(&user, request)
    .await
    .unwrap_or_else(|err| {
      panic!("{:?} {:?} {}s x{}: generation failed: {:?}", model, resolution, duration_seconds, batch_count, err)
    });
  assert!(response.success);

  let balance = harness.wallet_balance(&user).await;
  assert_eq!(
    STARTING_CREDITS - balance,
    expected_credits,
    "{:?} {:?} {}s x{}: wrong wallet debit", model, resolution, duration_seconds, batch_count,
  );

  let entries = harness.ledger_entries(&user).await;
  let debit = entries
    .iter()
    .find(|entry| entry.credits_delta < 0)
    .unwrap_or_else(|| panic!("{:?}: no debit ledger entry found", model));
  assert_eq!(
    -debit.credits_delta,
    expected_credits as i64,
    "{:?} {:?} {}s x{}: wrong ledger debit", model, resolution, duration_seconds, batch_count,
  );
  assert!(!debit.is_refunded, "{:?}: successful generation must not be refunded", model);
}

/// Reference-video request: the charge lands (pinning the with-references
/// price), then the unreachable fixture media makes the provider upload fail
/// and the charge is refunded. Asserts the exact debit amount on the
/// refunded ledger entry and that the balance is made whole.
pub async fn assert_reference_video_charge_then_refund(
  harness: &TestHarness,
  model: CommonVideoModel,
  resolution: Option<enums::common::generation::common_resolution::CommonResolution>,
  Seconds(duration_seconds): Seconds,
  Batch(batch_count): Batch,
  ExpectedCredits(expected_credits): ExpectedCredits,
) {
  let user = harness.create_funded_user(STARTING_CREDITS).await;

  let video_token = mysql_testing::fixtures::media_files::create_test_video_media_file(
    &harness.pool,
    &user.user_token,
    Some(6_000),
  )
  .await
  .expect("create video media file fixture");

  let mut request = base_generate_request(model);
  request.resolution = resolution;
  request.duration_seconds = Some(duration_seconds);
  request.video_batch_count = Some(batch_count);
  request.reference_video_media_tokens = Some(vec![video_token]);

  // The upload of the (unreachable) reference video fails after billing, so
  // the endpoint errors and the charge is refunded.
  let result = harness.post_generate(&user, request).await;
  assert!(
    result.is_err(),
    "{:?}: generation with unreachable reference media should fail", model,
  );

  let entries = harness.ledger_entries(&user).await;
  let debit = entries
    .iter()
    .find(|entry| entry.credits_delta < 0)
    .unwrap_or_else(|| panic!("{:?}: no debit ledger entry found", model));
  assert_eq!(
    -debit.credits_delta,
    expected_credits as i64,
    "{:?} {:?} {}s + refs: wrong charged amount", model, resolution, duration_seconds,
  );
  assert!(
    debit.is_refunded,
    "{:?}: failed generation must refund the charge", model,
  );

  assert_eq!(
    harness.wallet_balance(&user).await,
    STARTING_CREDITS,
    "{:?}: refund must make the wallet whole", model,
  );
}

/// For models that currently have no execution route: the request must fail
/// cleanly BEFORE any billing happens.
pub async fn assert_generation_fails_and_charges_nothing(
  harness: &TestHarness,
  model: CommonVideoModel,
  Seconds(duration_seconds): Seconds,
) {
  let user = harness.create_funded_user(STARTING_CREDITS).await;

  let mut request = base_generate_request(model);
  request.duration_seconds = Some(duration_seconds);

  let result = harness.post_generate(&user, request).await;
  assert!(result.is_err(), "{:?}: unroutable model must be rejected", model);

  assert_eq!(
    harness.wallet_balance(&user).await,
    STARTING_CREDITS,
    "{:?}: rejected generation must not charge", model,
  );
}

/// Assert the variant model charges a premium over the base model: runs one
/// generation on EACH model, asserts both exact charges, and that
/// `variant == base + delta`. (A delta of 0 is allowed where ceil-rounding
/// collapses a sub-cent premium.)
pub async fn assert_variant_charges_premium(
  harness: &TestHarness,
  base_model: CommonVideoModel,
  variant_model: CommonVideoModel,
  resolution: Option<enums::common::generation::common_resolution::CommonResolution>,
  seconds: Seconds,
  batch: Batch,
  base: ExpectedCredits,
  variant: ExpectedCredits,
  CreditsDelta(delta): CreditsDelta,
) {
  let ExpectedCredits(base_credits) = base;
  let ExpectedCredits(variant_credits) = variant;

  // The table itself must be internally consistent.
  assert_eq!(
    base_credits + delta,
    variant_credits,
    "test table bug: {:?} {} + delta {} != {:?} {}",
    base_model, base_credits, delta, variant_model, variant_credits,
  );

  assert_successful_generation_charges(harness, base_model, resolution, seconds, batch, base).await;
  assert_successful_generation_charges(harness, variant_model, resolution, seconds, batch, variant).await;
}

/// Run one generation with REAL probeable reference videos (served by the
/// stub CDN with exact durations) and assert the exact wallet debit. The
/// whole flow succeeds: probe → billing → upload (to the stub) → generate.
pub async fn assert_real_input_videos_charge(
  harness: &TestHarness,
  model: CommonVideoModel,
  resolution: Option<enums::common::generation::common_resolution::CommonResolution>,
  Seconds(duration_seconds): Seconds,
  input_video_millis: &[u64],
  ExpectedCredits(expected_credits): ExpectedCredits,
) {
  let user = harness.create_funded_user(STARTING_CREDITS).await;

  let mut video_tokens = Vec::new();
  for millis in input_video_millis {
    let token = mysql_testing::fixtures::media_files::create_probeable_test_video_media_file(
      &harness.pool,
      &user.user_token,
      *millis,
    )
    .await
    .expect("create probeable video media file fixture");
    video_tokens.push(token);
  }

  let mut request = base_generate_request(model);
  request.resolution = resolution;
  request.duration_seconds = Some(duration_seconds);
  request.reference_video_media_tokens = Some(video_tokens);

  let response = harness
    .post_generate(&user, request)
    .await
    .unwrap_or_else(|err| {
      panic!(
        "{:?} {:?} {}s inputs {:?}ms: generation failed: {:?}",
        model, resolution, duration_seconds, input_video_millis, err,
      )
    });
  assert!(response.success);

  let balance = harness.wallet_balance(&user).await;
  assert_eq!(
    STARTING_CREDITS - balance,
    expected_credits,
    "{:?} {:?} {}s inputs {:?}ms: wrong wallet debit",
    model, resolution, duration_seconds, input_video_millis,
  );

  let entries = harness.ledger_entries(&user).await;
  let debit = entries
    .iter()
    .find(|entry| entry.credits_delta < 0)
    .unwrap_or_else(|| panic!("{:?}: no debit ledger entry found", model));
  assert!(!debit.is_refunded, "{:?}: successful generation must not be refunded", model);
}
