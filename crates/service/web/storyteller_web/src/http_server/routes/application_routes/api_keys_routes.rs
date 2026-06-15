use actix_http::body::MessageBody;
use actix_service::ServiceFactory;
use actix_web::dev::{ServiceRequest, ServiceResponse};
use actix_web::{web, App, Error, HttpResponse};

use crate::http_server::endpoints::api_keys::create_api_key_handler::create_api_key_handler;
use crate::http_server::endpoints::api_keys::delete_api_key_handler::delete_api_key_handler;
use crate::http_server::endpoints::api_keys::get_api_key_handler::get_api_key_handler;
use crate::http_server::endpoints::api_keys::list_api_keys_handler::list_api_keys_handler;
use crate::http_server::endpoints::api_keys::update_api_key_handler::update_api_key_handler;

pub fn add_api_keys_routes<T, B>(app: App<T>) -> App<T>
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
  app.service(
    web::scope("/v1/api_keys")
      // NB: Static routes are registered BEFORE the dynamic `/{api_key_token}`
      // route so they take precedence. API key tokens are always `api_key_…`,
      // so they can never collide with these literals anyway.
      .service(
        web::resource("/create")
          .route(web::post().to(create_api_key_handler))
          .route(web::head().to(|| HttpResponse::Ok())),
      )
      .service(
        web::resource("/list")
          .route(web::get().to(list_api_keys_handler))
          .route(web::head().to(|| HttpResponse::Ok())),
      )
      .service(
        web::resource("/{api_key_token}")
          .route(web::get().to(get_api_key_handler))
          .route(web::delete().to(delete_api_key_handler))
          .route(web::put().to(update_api_key_handler))
          .route(web::head().to(|| HttpResponse::Ok())),
      ),
  )
}
