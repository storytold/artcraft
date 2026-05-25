use actix_http::body::MessageBody;
use actix_service::ServiceFactory;
use actix_web::dev::{ServiceRequest, ServiceResponse};
use actix_web::error::Error;
use actix_web::{web, App, HttpResponse};

use crate::http_server::endpoints::dev::dev_basic_input_error_handler::dev_basic_input_error_handler;
use crate::http_server::endpoints::dev::dev_input_error_handler::dev_input_error_handler;

pub fn add_dev_routes<T, B> (app: App<T>) -> App<T>
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
  app.service(web::scope("/v1/dev")
      .service(web::resource("/input_error")
          .route(web::get().to(dev_input_error_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(web::resource("/basic_input_error")
          .route(web::get().to(dev_basic_input_error_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
  )
}
