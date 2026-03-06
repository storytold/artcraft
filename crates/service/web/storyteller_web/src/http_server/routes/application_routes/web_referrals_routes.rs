use actix_http::body::MessageBody;
use actix_service::ServiceFactory;
use actix_web::dev::{ServiceRequest, ServiceResponse};
use actix_web::error::Error;
use actix_web::{web, App, HttpResponse};

use crate::http_server::endpoints::web_referrals::log_web_referral_handler::log_web_referral_handler;

pub fn add_web_referrals_routes<T, B> (app: App<T>) -> App<T>
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
  app.service(web::scope("/v1/web_referrals")
      .service(web::resource("/record")
          .route(web::post().to(log_web_referral_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
  )
}
