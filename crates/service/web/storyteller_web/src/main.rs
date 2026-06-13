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

use actix_artcraft::sessions::user_sessions::http_user_session_manager::HttpUserSessionManager;
use actix_cors_configs::cors::build_cors_config;
use actix_cors_configs::shared_array_buffer_cors::shared_array_buffer_cors;
use actix_helpers::middleware::banned_cidr_filter::banned_cidr_filter::BannedCidrFilter;
use actix_helpers::middleware::banned_ip_filter::banned_ip_filter::BannedIpFilter;
use actix_helpers::middleware::disabled_endpoint_filter::disabled_endpoint_filter::DisabledEndpointFilter;
use actix_multipart::form::MultipartFormConfig;
use actix_web::middleware::{DefaultHeaders, Logger};
use actix_web::{middleware, web, App, HttpServer};
use billing_component::stripe::traits::internal_product_to_stripe_lookup::InternalProductToStripeLookup;
use billing_component::stripe::traits::internal_subscription_product_lookup::InternalSubscriptionProductLookup;
use bootstrap::bootstrap::{bootstrap, BootstrapArgs};
use component_traits::traits::internal_user_lookup::InternalUserLookup;
use errors::AnyhowResult;
use log::{info, warn};
use server_environment::ServerEnvironment;
use shared_env_var_config::logging::DEFAULT_RUST_LOG;
use tokio::runtime::Runtime;
use user_traits_component::traits::internal_session_cache_purge::InternalSessionCachePurge;

use crate::billing::internal_product_to_stripe_lookup_impl::InternalProductToStripeLookupImpl;
use crate::billing::internal_session_cache_purge_impl::InternalSessionCachePurgeImpl;
use crate::billing::stripe_internal_subscription_product_lookup_impl::StripeInternalSubscriptionProductLookupImpl;
use crate::billing::stripe_internal_user_lookup_impl::StripeInternalUserLookupImpl;
use crate::http_server::middleware::error_alerting_middleware::error_alerting_middleware::ErrorAlertingMiddleware;
use crate::http_server::middleware::metrics_middleware::metrics_middleware::MetricsMiddleware;
use crate::http_server::middleware::pushback_filter_middleware::PushbackFilter;
use crate::http_server::routes::add_routes::add_routes;
use crate::http_server::web_utils::handle_multipart_error::handle_multipart_error;
use crate::startup::build_dependencies::setup_dependencies;
use crate::startup::setup_disabled_endpoints::read_disabled_endpoints;
use crate::startup::setup_metrics::build_metrics;
use crate::state::server_state::ServerState;
use crate::threads::db_health_checker_thread::db_health_checker_thread::db_health_checker_thread;
use crate::threads::poll_ip_banlist_thread::poll_ip_bans;
use crate::threads::poll_model_token_info_thread::poll_model_token_info_thread;

pub mod billing;
pub mod configs;
pub mod email;
pub mod http_server;
pub mod startup;
pub mod state;
pub mod threads;
pub mod util;

// Report cloudflare trace ID header (CF-Ray) in logs
const LOG_FORMAT: &str =
  "[%{HOSTNAME}e] IP=[%{X-Forwarded-For}i] %{CF-Ray}i \"%r\" %s %b \"%{Referer}i\" \"%{User-Agent}i\" %T";

#[actix_web::main]
async fn main() -> AnyhowResult<()> {

  // NB: Both ring (via reqwest 0.12/hyper-rustls) and aws-lc-rs (via quinn/resend-rs)
  // are compiled into this binary as rustls crypto providers. rustls 0.23 panics at
  // runtime if it can't auto-select a single provider, so we install ring explicitly.
  rustls::crypto::ring::default_provider()
    .install_default()
    .expect("Failed to install rustls crypto provider");

  let container_environment = bootstrap(BootstrapArgs {
    app_name: "storyteller-web",
    default_logging_override: Some(DEFAULT_RUST_LOG),
    config_search_directories: &[".", "./config", "crates/service/web/storyteller_web/config"],
    ignore_legacy_dot_env_file: true,
  })?;

  info!("Obtaining hostname...");

  let server_hostname = hostname::get()
    .ok()
    .and_then(|h| h.into_string().ok())
    .unwrap_or("storyteller-web-unknown".to_string());

  info!("Hostname: {}", &server_hostname);

  // ==================== Setup all dependencies ==================== //

  let setup = setup_dependencies(&server_hostname).await?;
  let server_state = setup.server_state;
  let health_check_interval = setup.health_check_interval;
  let pager_worker = setup.pager_worker;

  // ==================== Background threads ==================== //

  let tokio_runtime = Runtime::new()?;

  info!("Spawning pager worker thread.");

  tokio_runtime.spawn(async move {
    pager_worker.run().await;
  });

  info!("Spawning DB health checker thread.");

  let health_check_status_clone = server_state.health_check_status.clone();
  let mysql_pool_clone = server_state.mysql_pool.clone();
  let pager_clone = server_state.pager.clone();

  tokio_runtime.spawn(async move {
    db_health_checker_thread(
      health_check_status_clone,
      mysql_pool_clone,
      health_check_interval,
      pager_clone,
    ).await;
  });

  info!("Spawning IP ban polling thread.");

  let ip_ban_list_clone = server_state.ip_ban_list.clone();
  let mysql_pool_clone = server_state.mysql_pool.clone();

  tokio_runtime.spawn(async {
    poll_ip_bans(ip_ban_list_clone, mysql_pool_clone).await;
  });

  info!("Spawning token info cache polling thread.");

  let model_token_info_cache_clone = server_state.caches.durable.model_token_info.clone();
  let mysql_pool_clone = server_state.mysql_pool.clone();

  tokio_runtime.spawn(async {
    poll_model_token_info_thread(model_token_info_cache_clone, mysql_pool_clone).await;
  });

  // ==================== Metrics worker ==================== //

  let (metrics_collector, maybe_metrics_worker) =
    build_metrics(server_state.server_environment, &server_state.hostname);

  let maybe_metrics_shutdown = maybe_metrics_worker.map(|worker| {
    info!("Spawning metrics worker thread.");
    let shutdown = worker.shutdown_handle();
    tokio_runtime.spawn(async move {
      worker.run().await;
    });
    shutdown
  });

  // ==================== Serve ==================== //

  serve(server_state, metrics_collector).await?;

  // ==================== Graceful drain ==================== //
  //
  // serve() returns once actix has finished its own shutdown (SIGTERM,
  // SIGINT, etc.). Tell the metrics worker to flush its last batch and
  // exit, giving it a bounded grace period before we drop the runtime.
  if let Some(shutdown) = maybe_metrics_shutdown {
    use std::sync::atomic::Ordering;
    info!("Signaling metrics worker to drain before exit.");
    shutdown.store(true, Ordering::Relaxed);
    // The worker drains on the next tick. One flush_interval (default 10s)
    // is plenty for it to wake, drain, and POST one last batch. We don't
    // join the spawned task directly because the runtime owns it.
    tokio_runtime.block_on(async {
      tokio::time::sleep(std::time::Duration::from_secs(12)).await;
    });
  }

  Ok(())
}

pub async fn serve(
  server_state: ServerState,
  metrics_collector: metrics::collector::MetricsCollector,
) -> AnyhowResult<()>
{
  let bind_address = server_state.env_config.bind_address.clone();
  let num_workers = server_state.env_config.num_workers;
  let hostname = server_state.hostname.clone();

  let server_environment = server_state.server_environment;

  let paging_flags_for_middleware = server_state.flags.paging.clone();
  let pager_for_middleware = server_state.pager.clone();
  let enable_error_alerting = paging_flags_for_middleware.is_paging_enabled
    && paging_flags_for_middleware.is_paging_for_500s_enabled;

  if enable_error_alerting {
    info!("Error alerting middleware is ENABLED (ENABLE_PAGING=true, ENABLE_PAGING_FOR_500S=true).");
  }

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
      .app_data(web::Data::new(server_state_arc.stripe_artcraft.clone()))
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
      .app_data(web::Data::new(server_state_arc.google_sign_in_cert.clone()))
      .app_data(web::Data::new(server_state_arc.pager.clone()))
      .app_data(web::Data::new(server_environment))
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
      .wrap(MetricsMiddleware::new(metrics_collector.clone()))
      .wrap(build_cors_config(server_environment))
      .wrap(shared_array_buffer_cors())
      .wrap(DefaultHeaders::new()
        .header("X-Backend-Hostname", &hostname)
        .header("X-Build-Sha", server_state_arc.server_info.build_sha.clone()))
      .wrap(middleware::Condition::new(
        enable_error_alerting,
        ErrorAlertingMiddleware::new(pager_for_middleware.clone(), paging_flags_for_middleware.clone()),
      ))
      .wrap(PushbackFilter::new(&server_state_arc.flags.clone()))
      .wrap(DisabledEndpointFilter::new(disabled_endpoints.clone()))
      .wrap(BannedIpFilter::new(ip_ban_list))
      .wrap(BannedCidrFilter::new(cidr_ban_set))
      .wrap(Logger::new(LOG_FORMAT)
        .exclude("/liveness")
        .exclude("/readiness"))
      .wrap(middleware::Compress::default());

    add_routes(app, server_environment)
  })
  .bind(&bind_address)
  .unwrap_or_else(|err| {
    eprintln!("FATAL: Failed to bind to address '{}': {}", bind_address, err);
    eprintln!("The address is likely already in use by another process.");
    std::process::exit(1);
  })
  .workers(num_workers)
  .run()
  .await?;

  Ok(())
}
