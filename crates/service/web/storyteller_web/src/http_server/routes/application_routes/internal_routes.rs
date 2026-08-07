use actix_http::body::MessageBody;
use actix_service::ServiceFactory;
use actix_web::dev::{ServiceRequest, ServiceResponse};
use actix_web::{web, App, Error};

use crate::http_server::endpoints::internal::minimax_jobs::mark_minimax_job_failure_handler::mark_minimax_job_failure_handler;
use crate::http_server::endpoints::internal::minimax_jobs::mark_minimax_job_success_handler::mark_minimax_job_success_handler;
use crate::http_server::endpoints::internal::minimax_jobs::obtain_minimax_job_handler::obtain_minimax_job_handler;

/// Internal-facing routes for our own worker fleets (GPU inference).
/// Every endpoint requires an internal API key (`ACCEPTED_INTERNAL_API_KEYS`).
pub fn add_internal_routes<T, B>(app: App<T>) -> App<T>
where
    B: MessageBody,
    T: ServiceFactory<
      ServiceRequest,
      Config = (),
      Response = ServiceResponse<B>,
      Error = Error,
      InitError = (),
    >,
{
  app.service(web::scope("/v1/internal")
      .service(web::scope("/minimax_jobs")
          .service(web::resource("/obtain_job")
              .route(web::post().to(obtain_minimax_job_handler))
          )
          .service(web::resource("/job/{job_token}/failure")
              .route(web::post().to(mark_minimax_job_failure_handler))
          )
          .service(web::resource("/job/{job_token}/success")
              .route(web::post().to(mark_minimax_job_success_handler))
          )
      ))
}
