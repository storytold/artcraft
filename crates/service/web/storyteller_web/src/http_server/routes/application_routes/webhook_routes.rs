use crate::http_server::endpoints::webhooks::beeble::beeble_webhook_handler::beeble_webhook_handler;
use crate::http_server::endpoints::webhooks::fal::fal_webhook_handler::fal_webhook_handler;
use actix_http::body::MessageBody;
use actix_service::ServiceFactory;
use actix_web::dev::{ServiceRequest, ServiceResponse};
use actix_web::{web, App, Error, HttpResponse};

pub fn add_webhook_routes<T, B> (app: App<T>) -> App<T>
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
  app.service(web::scope("/v1/webhooks")
      .service(web::resource("/fal")
          .route(web::post().to(fal_webhook_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(web::resource("/beeble")
          .route(web::post().to(beeble_webhook_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
  )
}
