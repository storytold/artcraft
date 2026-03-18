use std::sync::Arc;

use actix_web::{App, HttpResponse, HttpServer, web};
use actix_web::dev::Server;
use actix_web::middleware::Logger;
use log::info;

use bootstrap::bootstrap::ContainerEnvironment;
use errors::AnyhowResult;
use jobs_common::job_stats::JobStats;

use crate::http_server::endpoints::health_check_handler::get_health_check_handler;
use crate::http_server::http_server_shared_state::HttpServerSharedState;

const DEFAULT_BIND_ADDRESS : &str = "0.0.0.0:12345";
const DEFAULT_NUM_WORKERS : usize = 4;

pub struct CreateServerArgs {
  pub container_environment: ContainerEnvironment,
  pub job_stats: JobStats,
}

pub fn run_http_server(args: CreateServerArgs) -> AnyhowResult<Server>
{
  // HTTP server args
  let bind_address = easyenv::get_env_string_or_default("HTTP_BIND_ADDRESS", DEFAULT_BIND_ADDRESS);
  let num_workers = easyenv::get_env_num("HTTP_NUM_WORKERS", DEFAULT_NUM_WORKERS)?;
  let _hostname = args.container_environment.hostname.clone();

  let server_state = HttpServerSharedState {
    job_stats: args.job_stats.clone(),
    consecutive_failure_unhealthy_threshold:
      easyenv::get_env_num("CONSECUTIVE_FAILURE_UNHEALTHY_THRESHOLD", 3)?,
  };

  let server_state_arc = web::Data::new(Arc::new(server_state));

  info!("Starting HTTP service (just for k8s health checking).");

  // NB: We shouldn't be logging much as the /_status endpoint is all we aim to expose.
  let log_format = "[%{HOSTNAME}e] IP=[%{X-Forwarded-For}i] \"%r\" %s %b \"%{Referer}i\" \"%{User-Agent}i\" %T";

  info!("HTTP server will bind to: {}", bind_address);

  let handle = HttpServer::new(move || {
    // NB: app_data being clone()'d below should all be safe (dependencies included)
    App::new()
        .app_data(server_state_arc.clone())
        .wrap(Logger::new(&log_format)
            .exclude("/_status")
        )
        //.wrap(middleware::Compress::default())
        .service(
          web::resource("/")
              .route(web::get().to(|| HttpResponse::Ok()))
              .route(web::head().to(|| HttpResponse::Ok()))
        )
        .service(
          web::resource("/_status")
              .route(web::get().to(get_health_check_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
        )
  })
      .bind(bind_address)?
      .workers(num_workers)
      .run();

  Ok(handle)
}

pub async fn launch_http_server(args: CreateServerArgs) -> AnyhowResult<()> {
  run_http_server(args)?.await?;
  Ok(())
}
