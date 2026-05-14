use actix_service::ServiceFactory;
use actix_web::body::MessageBody;
use actix_web::dev::{ServiceRequest, ServiceResponse};
use actix_web::{web, App, Error, HttpResponse};

use crate::http_server::endpoints::user_referral_codes::create_referral_code_handler::create_referral_code_handler;
use crate::http_server::endpoints::user_referral_codes::delete_referral_code_handler::delete_referral_code_handler;
use crate::http_server::endpoints::user_referral_codes::list_referral_codes_handler::list_referral_codes_handler;

pub fn add_user_referral_code_routes<T, B>(app: App<T>) -> App<T>
where
  T: ServiceFactory<ServiceRequest, Config = (), Error = Error, Response = ServiceResponse<B>, InitError = ()>,
  B: MessageBody,
{
  app
    .service(web::resource("/v1/user_referral_codes/create")
      .route(web::post().to(create_referral_code_handler))
      .route(web::head().to(|| HttpResponse::Ok()))
    )
    .service(web::resource("/v1/user_referral_codes/list")
      .route(web::get().to(list_referral_codes_handler))
      .route(web::head().to(|| HttpResponse::Ok()))
    )
    .service(web::resource("/v1/user_referral_codes/code/{token}")
      .route(web::delete().to(delete_referral_code_handler))
      .route(web::head().to(|| HttpResponse::Ok()))
    )
}
